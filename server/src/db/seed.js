/**
 * Dynamic demo data seeder.
 *
 * Creates a ready-to-demo account with a password hash and workouts dated
 * relative to today (so streaks and "this week" stats look realistic).
 *
 * Demo login:  demo@fitsync.app  /  demo1234
 */
import bcrypt from 'bcryptjs';
import pool, { query } from './pool.js';

const DEMO = { name: 'Alex Demo', email: 'demo@fitsync.app', password: 'demo1234' };

/** Format a Date as MySQL DATETIME string. */
function dt(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}
/** Format a Date as MySQL DATE string. */
function d(date) {
  return date.toISOString().slice(0, 10);
}
/** A Date `n` days before now, at a fixed evening hour. */
function daysAgo(n, hour = 18) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() - n);
  return date;
}

async function getExerciseMap() {
  const rows = await query('SELECT id, name FROM exercises');
  const map = {};
  for (const r of rows) map[r.name] = r.id;
  return map;
}

/**
 * Insert a workout with its exercises and sets.
 * @param {number} userId
 * @param {Date} when
 * @param {string} title
 * @param {number} duration
 * @param {Array<{exerciseId:number, sets:Array<object>}>} entries
 */
async function insertWorkout(userId, when, title, duration, entries) {
  const res = await query(
    `INSERT INTO workouts (user_id, title, performed_at, duration_min, notes)
     VALUES (:userId, :title, :performedAt, :duration, :notes)`,
    { userId, title, performedAt: dt(when), duration, notes: 'Great session!' }
  );
  const workoutId = res.insertId;

  let position = 0;
  for (const entry of entries) {
    const weRes = await query(
      `INSERT INTO workout_exercises (workout_id, exercise_id, position)
       VALUES (:workoutId, :exerciseId, :position)`,
      { workoutId, exerciseId: entry.exerciseId, position: position++ }
    );
    const weId = weRes.insertId;
    let setNumber = 1;
    for (const s of entry.sets) {
      await query(
        `INSERT INTO workout_sets
           (workout_exercise_id, set_number, reps, weight_kg, duration_sec, distance_m)
         VALUES (:weId, :setNumber, :reps, :weight, :duration, :distance)`,
        {
          weId,
          setNumber: setNumber++,
          reps: s.reps ?? null,
          weight: s.weight ?? null,
          duration: s.duration ?? null,
          distance: s.distance ?? null,
        }
      );
    }
  }
  return workoutId;
}

export async function seedDemoData() {
  const ex = await getExerciseMap();
  const passwordHash = await bcrypt.hash(DEMO.password, 10);

  const userRes = await query(
    `INSERT INTO users (name, email, password_hash, height_cm, weight_kg, fitness_goal, xp, level)
     VALUES (:name, :email, :hash, 178.0, 79.5, 'build_muscle', 1600, 4)`,
    { name: DEMO.name, email: DEMO.email, hash: passwordHash }
  );
  const userId = userRes.insertId;

  // --- Workouts across the last ~12 days, with a current streak (today, -1, -2, -3) ---
  const pushSets = [
    { exerciseId: ex['Barbell Bench Press'], sets: [
      { reps: 10, weight: 60 }, { reps: 8, weight: 65 }, { reps: 6, weight: 70 },
    ]},
    { exerciseId: ex['Overhead Press'], sets: [
      { reps: 10, weight: 35 }, { reps: 9, weight: 35 }, { reps: 8, weight: 37.5 },
    ]},
    { exerciseId: ex['Triceps Pushdown'], sets: [
      { reps: 15, weight: 25 }, { reps: 12, weight: 27.5 },
    ]},
  ];
  const pullSets = [
    { exerciseId: ex['Deadlift'], sets: [
      { reps: 8, weight: 100 }, { reps: 6, weight: 110 }, { reps: 5, weight: 120 },
    ]},
    { exerciseId: ex['Bent-over Row'], sets: [
      { reps: 10, weight: 50 }, { reps: 10, weight: 50 }, { reps: 8, weight: 55 },
    ]},
    { exerciseId: ex['Barbell Curl'], sets: [
      { reps: 12, weight: 25 }, { reps: 10, weight: 27.5 },
    ]},
  ];
  const legSets = [
    { exerciseId: ex['Barbell Back Squat'], sets: [
      { reps: 10, weight: 80 }, { reps: 8, weight: 90 }, { reps: 6, weight: 100 },
    ]},
    { exerciseId: ex['Romanian Deadlift'], sets: [
      { reps: 10, weight: 70 }, { reps: 10, weight: 70 },
    ]},
    { exerciseId: ex['Leg Press'], sets: [
      { reps: 12, weight: 140 }, { reps: 12, weight: 160 },
    ]},
  ];
  const cardioSets = [
    { exerciseId: ex['Running'], sets: [{ distance: 5000, duration: 1680 }] },
    { exerciseId: ex['Plank'], sets: [{ duration: 60 }, { duration: 60 }, { duration: 45 }] },
  ];
  const coreSets = [
    { exerciseId: ex['Hanging Leg Raise'], sets: [{ reps: 12 }, { reps: 10 }, { reps: 8 }] },
    { exerciseId: ex['Russian Twist'], sets: [{ reps: 30 }, { reps: 30 }] },
    { exerciseId: ex['Plank'], sets: [{ duration: 90 }] },
  ];

  // dayOffset, title, duration, entries
  const plan = [
    [0,  'Push Day',   55, pushSets],
    [1,  'Pull Day',   60, pullSets],
    [2,  'Leg Day',    65, legSets],
    [3,  'Cardio & Core', 40, cardioSets],
    [5,  'Core Blast', 30, coreSets],
    [6,  'Push Day',   52, pushSets],
    [8,  'Pull Day',   58, pullSets],
    [9,  'Leg Day',    63, legSets],
    [11, 'Cardio & Core', 42, cardioSets],
    [12, 'Push Day',   50, pushSets],
    [14, 'Core Blast', 28, coreSets],
    [15, 'Pull Day',   57, pullSets],
  ];

  for (const [offset, title, duration, entries] of plan) {
    await insertWorkout(userId, daysAgo(offset), title, duration, entries.filter((e) => e.exerciseId));
  }

  // --- Body metrics over the last 6 weeks (slow recomposition) ---
  const weights = [82.0, 81.4, 81.0, 80.6, 80.1, 79.5];
  for (let i = 0; i < weights.length; i++) {
    const date = daysAgo((weights.length - 1 - i) * 7);
    await query(
      `INSERT INTO body_metrics (user_id, recorded_on, weight_kg, body_fat_pct)
       VALUES (:userId, :day, :weight, :bf)`,
      { userId, day: d(date), weight: weights[i], bf: 20 - i * 0.4 }
    );
  }

  // --- Goals ---
  await query(
    `INSERT INTO goals (user_id, type, title, target_value, current_value, unit, due_date) VALUES
      (:userId, 'workouts_per_week', 'Train 4x per week', 4, 3, 'workouts', NULL),
      (:userId, 'target_weight', 'Reach 77 kg', 77, 79.5, 'kg', :due),
      (:userId, 'total_volume', 'Lift 100,000 kg total', 100000, 0, 'kg', NULL)`,
    { userId, due: d(daysAgo(-60)) }
  );

  // --- Award a few badges that the demo data clearly satisfies ---
  await query(
    `INSERT INTO user_badges (user_id, badge_id)
     SELECT :userId, id FROM badges
     WHERE code IN ('first_workout','ten_workouts','streak_3','volume_5000','explorer_10')`,
    { userId }
  );

  await pool.end();
}
