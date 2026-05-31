import { query } from '../../db/pool.js';

/**
 * Aggregate lifetime totals for a user.
 * Volume = sum of (reps * weight) across all completed sets.
 */
export async function getTotals(userId) {
  const [totals] = await query(
    `SELECT
        COUNT(DISTINCT w.id) AS totalWorkouts,
        COUNT(DISTINCT we.exercise_id) AS distinctExercises,
        COALESCE(SUM(CASE WHEN s.reps IS NOT NULL AND s.weight_kg IS NOT NULL
                          THEN s.reps * s.weight_kg ELSE 0 END), 0) AS totalVolume,
        COUNT(s.id) AS totalSets
     FROM workouts w
     LEFT JOIN workout_exercises we ON we.workout_id = w.id
     LEFT JOIN workout_sets s ON s.workout_exercise_id = we.id
     WHERE w.user_id = :userId`,
    { userId }
  );

  return {
    totalWorkouts: Number(totals.totalWorkouts) || 0,
    distinctExercises: Number(totals.distinctExercises) || 0,
    totalVolume: Math.round(Number(totals.totalVolume) || 0),
    totalSets: Number(totals.totalSets) || 0,
  };
}

/** Distinct days (YYYY-MM-DD) the user trained, most recent first. */
async function getTrainingDays(userId) {
  const rows = await query(
    `SELECT DISTINCT DATE(performed_at) AS day
     FROM workouts WHERE user_id = :userId
     ORDER BY day DESC`,
    { userId }
  );
  return rows.map((r) => r.day);
}

/**
 * Current streak = consecutive days with a workout, ending today or
 * yesterday (so a streak isn't "broken" before the day is over).
 */
export async function getCurrentStreak(userId) {
  const days = await getTrainingDays(userId);
  if (!days.length) return 0;

  const oneDay = 86400000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const set = new Set(days);
  // Anchor on today if trained today, else yesterday, else streak is 0.
  let cursor = new Date(today);
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = new Date(today - oneDay).toISOString().slice(0, 10);

  if (set.has(todayStr)) {
    cursor = today;
  } else if (set.has(yesterdayStr)) {
    cursor = new Date(today - oneDay);
  } else {
    return 0;
  }

  let streak = 0;
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = new Date(cursor - oneDay);
  }
  return streak;
}

/** Longest streak ever achieved by the user. */
export async function getLongestStreak(userId) {
  const days = (await getTrainingDays(userId)).slice().reverse(); // oldest first
  if (!days.length) return 0;

  const oneDay = 86400000;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    if (Math.round((curr - prev) / oneDay) === 1) {
      current += 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
  }
  return longest;
}

/** Number of workouts in the current week (Mon-Sun). */
export async function getThisWeekCount(userId) {
  const [row] = await query(
    `SELECT COUNT(*) AS count
     FROM workouts
     WHERE user_id = :userId
       AND YEARWEEK(performed_at, 1) = YEARWEEK(CURDATE(), 1)`,
    { userId }
  );
  return Number(row.count) || 0;
}

/** Workout volume per day for the last N days (for charts). */
export async function getVolumeTrend(userId, days = 30) {
  return query(
    `SELECT DATE(w.performed_at) AS date,
            ROUND(COALESCE(SUM(CASE WHEN s.reps IS NOT NULL AND s.weight_kg IS NOT NULL
                                    THEN s.reps * s.weight_kg ELSE 0 END), 0)) AS volume,
            COUNT(DISTINCT w.id) AS workouts
     FROM workouts w
     LEFT JOIN workout_exercises we ON we.workout_id = w.id
     LEFT JOIN workout_sets s ON s.workout_exercise_id = we.id
     WHERE w.user_id = :userId
       AND w.performed_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
     GROUP BY DATE(w.performed_at)
     ORDER BY date ASC`,
    { userId, days }
  );
}

/** Count of workouts per ISO week for the last N weeks (for charts). */
export async function getWeeklyFrequency(userId, weeks = 8) {
  return query(
    `SELECT YEARWEEK(performed_at, 1) AS yearweek,
            MIN(DATE(performed_at)) AS weekStart,
            COUNT(*) AS workouts
     FROM workouts
     WHERE user_id = :userId
       AND performed_at >= DATE_SUB(CURDATE(), INTERVAL :weeks WEEK)
     GROUP BY YEARWEEK(performed_at, 1)
     ORDER BY yearweek ASC`,
    { userId, weeks }
  );
}

/** Personal records per exercise (top estimated 1RM and best set). */
export async function getPersonalRecords(userId) {
  return query(
    `SELECT e.id AS exerciseId, e.name AS exerciseName, e.metric_type AS metricType,
            MAX(s.weight_kg) AS maxWeight,
            MAX(s.reps) AS maxReps,
            MAX(s.distance_m) AS maxDistance,
            MAX(s.duration_sec) AS maxDuration,
            ROUND(MAX(CASE WHEN s.reps IS NOT NULL AND s.weight_kg IS NOT NULL
                           THEN s.weight_kg * (1 + s.reps / 30.0) ELSE NULL END), 1) AS estimatedOneRm
     FROM workout_sets s
     JOIN workout_exercises we ON we.id = s.workout_exercise_id
     JOIN workouts w ON w.id = we.workout_id
     JOIN exercises e ON e.id = we.exercise_id
     WHERE w.user_id = :userId
     GROUP BY e.id, e.name, e.metric_type
     ORDER BY e.name ASC`,
    { userId }
  );
}

/** Muscle group distribution (set counts) for the last N days. */
export async function getMuscleSplit(userId, days = 30) {
  return query(
    `SELECT e.muscle_group AS muscleGroup, COUNT(s.id) AS sets
     FROM workout_sets s
     JOIN workout_exercises we ON we.id = s.workout_exercise_id
     JOIN workouts w ON w.id = we.workout_id
     JOIN exercises e ON e.id = we.exercise_id
     WHERE w.user_id = :userId
       AND w.performed_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
     GROUP BY e.muscle_group
     ORDER BY sets DESC`,
    { userId, days }
  );
}

/** A combined summary used by the dashboard and gamification. */
export async function getSummary(userId) {
  const [totals, currentStreak, longestStreak, thisWeek] = await Promise.all([
    getTotals(userId),
    getCurrentStreak(userId),
    getLongestStreak(userId),
    getThisWeekCount(userId),
  ]);
  return { ...totals, currentStreak, longestStreak, thisWeek };
}
