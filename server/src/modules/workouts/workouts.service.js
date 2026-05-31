import pool, { query } from '../../db/pool.js';
import ApiError from '../../utils/ApiError.js';
import * as gamification from '../gamification/gamification.service.js';

/** Normalize a performedAt input into a MySQL DATETIME string. */
function toDateTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/** XP earned for a logged workout: a base reward plus a bonus per set. */
function computeWorkoutXp(setCount) {
  return 40 + setCount * 5;
}

/**
 * Create a workout with nested exercises and sets in a single transaction,
 * then award XP and evaluate badges. Returns the created workout plus
 * gamification feedback used to celebrate the user in the UI.
 */
export async function create(userId, data) {
  const conn = await pool.getConnection();
  let setCount = 0;
  let workoutId;
  try {
    await conn.beginTransaction();

    const [workoutRes] = await conn.query(
      `INSERT INTO workouts (user_id, title, notes, performed_at, duration_min)
       VALUES (:userId, :title, :notes, :performedAt, :durationMin)`,
      {
        userId,
        title: data.title,
        notes: data.notes ?? null,
        performedAt: toDateTime(data.performedAt),
        durationMin: data.durationMin ?? null,
      }
    );
    workoutId = workoutRes.insertId;

    let position = 0;
    for (const entry of data.exercises) {
      const [weRes] = await conn.query(
        `INSERT INTO workout_exercises (workout_id, exercise_id, position, notes)
         VALUES (:workoutId, :exerciseId, :position, :notes)`,
        { workoutId, exerciseId: entry.exerciseId, position: position++, notes: entry.notes ?? null }
      );
      const weId = weRes.insertId;

      let setNumber = 1;
      for (const s of entry.sets) {
        await conn.query(
          `INSERT INTO workout_sets
             (workout_exercise_id, set_number, reps, weight_kg, duration_sec, distance_m, completed)
           VALUES (:weId, :setNumber, :reps, :weight, :duration, :distance, :completed)`,
          {
            weId,
            setNumber: setNumber++,
            reps: s.reps ?? null,
            weight: s.weightKg ?? null,
            duration: s.durationSec ?? null,
            distance: s.distanceM ?? null,
            completed: s.completed ?? true,
          }
        );
        setCount += 1;
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    // Foreign key failure most likely means a bad exerciseId.
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
      throw ApiError.badRequest('One or more exercises do not exist');
    }
    throw err;
  } finally {
    conn.release();
  }

  // Reward the user (outside the transaction; these are derived/non-critical).
  const xpGained = computeWorkoutXp(setCount);
  const levelBefore = (await query('SELECT level FROM users WHERE id = :id', { id: userId }))[0].level;
  const levelInfo = await gamification.addXp(userId, xpGained);
  const newBadges = await gamification.evaluateBadges(userId);

  const workout = await getById(userId, workoutId);
  return {
    workout,
    feedback: {
      xpGained,
      level: levelInfo.level,
      leveledUp: levelInfo.level > levelBefore,
      newBadges,
    },
  };
}

/** Paginated list of workouts with lightweight summary stats. */
export async function list(userId, { limit, offset }) {
  const rows = await query(
    `SELECT w.id, w.title, w.notes, w.performed_at AS performedAt, w.duration_min AS durationMin,
            COUNT(DISTINCT we.id) AS exerciseCount,
            COUNT(s.id) AS setCount,
            ROUND(COALESCE(SUM(CASE WHEN s.reps IS NOT NULL AND s.weight_kg IS NOT NULL
                                    THEN s.reps * s.weight_kg ELSE 0 END), 0)) AS volume
     FROM workouts w
     LEFT JOIN workout_exercises we ON we.workout_id = w.id
     LEFT JOIN workout_sets s ON s.workout_exercise_id = we.id
     WHERE w.user_id = :userId
     GROUP BY w.id
     ORDER BY w.performed_at DESC
     LIMIT :limit OFFSET :offset`,
    { userId, limit, offset }
  );

  const [{ total }] = await query(
    'SELECT COUNT(*) AS total FROM workouts WHERE user_id = :userId',
    { userId }
  );

  return { workouts: rows, total: Number(total) };
}

/** Full workout detail including exercises and their sets. */
export async function getById(userId, id) {
  const [workout] = await query(
    `SELECT id, title, notes, performed_at AS performedAt, duration_min AS durationMin, created_at AS createdAt
     FROM workouts WHERE id = :id AND user_id = :userId`,
    { id, userId }
  );
  if (!workout) throw ApiError.notFound('Workout not found');

  const exercises = await query(
    `SELECT we.id AS workoutExerciseId, we.exercise_id AS exerciseId, we.position, we.notes,
            e.name, e.category, e.muscle_group AS muscleGroup, e.metric_type AS metricType
     FROM workout_exercises we
     JOIN exercises e ON e.id = we.exercise_id
     WHERE we.workout_id = :id
     ORDER BY we.position ASC`,
    { id }
  );

  for (const ex of exercises) {
    ex.sets = await query(
      `SELECT id, set_number AS setNumber, reps, weight_kg AS weightKg,
              duration_sec AS durationSec, distance_m AS distanceM, completed
       FROM workout_sets WHERE workout_exercise_id = :weId
       ORDER BY set_number ASC`,
      { weId: ex.workoutExerciseId }
    );
  }

  // Convenience aggregate for the detail view.
  const volume = exercises.reduce((sum, ex) => {
    return sum + ex.sets.reduce((s, set) => {
      if (set.reps != null && set.weightKg != null) return s + set.reps * Number(set.weightKg);
      return s;
    }, 0);
  }, 0);

  return { ...workout, exercises, volume: Math.round(volume) };
}

export async function remove(userId, id) {
  const result = await query('DELETE FROM workouts WHERE id = :id AND user_id = :userId', {
    id,
    userId,
  });
  if (result.affectedRows === 0) throw ApiError.notFound('Workout not found');
}

/** The most recent workout as a template for "repeat last workout". */
export async function getLast(userId) {
  const [last] = await query(
    'SELECT id FROM workouts WHERE user_id = :userId ORDER BY performed_at DESC LIMIT 1',
    { userId }
  );
  if (!last) return null;
  return getById(userId, last.id);
}
