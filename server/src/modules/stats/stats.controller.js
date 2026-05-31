import asyncHandler from '../../utils/asyncHandler.js';
import { query } from '../../db/pool.js';
import * as stats from './stats.service.js';
import * as gamification from '../gamification/gamification.service.js';

/** Dashboard: a single call that powers the home screen. */
export const dashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [user] = await query(
    'SELECT name, xp, level, fitness_goal AS fitnessGoal FROM users WHERE id = :id',
    { id: userId }
  );
  const summary = await stats.getSummary(userId);
  const levelInfo = gamification.levelFromXp(Number(user.xp) || 0);

  const recentWorkouts = await query(
    `SELECT w.id, w.title, w.performed_at AS performedAt, w.duration_min AS durationMin,
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
     LIMIT 5`,
    { userId }
  );

  const badges = await gamification.listBadgesForUser(userId);
  const earnedBadges = badges.filter((b) => b.earned);
  const nextBadge = badges.find((b) => !b.earned) || null;
  const volumeTrend = await stats.getVolumeTrend(userId, 14);

  res.status(200).json({
    user,
    summary,
    level: levelInfo,
    recentWorkouts,
    volumeTrend,
    badges: {
      earnedCount: earnedBadges.length,
      total: badges.length,
      recent: earnedBadges.slice(0, 4),
      next: nextBadge,
    },
  });
});

/** Progress page: all chart-ready datasets. */
export const progress = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const [volumeTrend, weeklyFrequency, muscleSplit, personalRecords, bodyMetrics, summary] =
    await Promise.all([
      stats.getVolumeTrend(userId, 30),
      stats.getWeeklyFrequency(userId, 8),
      stats.getMuscleSplit(userId, 30),
      stats.getPersonalRecords(userId),
      query(
        `SELECT recorded_on AS recordedOn, weight_kg AS weightKg, body_fat_pct AS bodyFatPct
         FROM body_metrics WHERE user_id = :userId ORDER BY recorded_on ASC`,
        { userId }
      ),
      stats.getSummary(userId),
    ]);

  res.status(200).json({
    summary,
    volumeTrend,
    weeklyFrequency,
    muscleSplit,
    personalRecords,
    bodyMetrics,
  });
});
