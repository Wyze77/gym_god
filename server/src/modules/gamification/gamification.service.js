import { query } from '../../db/pool.js';
import * as stats from '../stats/stats.service.js';

/** XP needed to reach a given level (simple, predictable curve). */
export function xpForLevel(level) {
  // Level 1 starts at 0; each level needs 250 more XP than the last band.
  return Math.round(125 * (level - 1) * level);
}

/** Derive level + progress from a raw XP value. */
export function levelFromXp(xp) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level += 1;
  const currentFloor = xpForLevel(level);
  const nextFloor = xpForLevel(level + 1);
  return {
    level,
    xp,
    xpIntoLevel: xp - currentFloor,
    xpForNextLevel: nextFloor - currentFloor,
    nextLevelAt: nextFloor,
  };
}

/** Add XP to a user and recompute their level. Returns level info. */
export async function addXp(userId, amount) {
  const [user] = await query('SELECT xp FROM users WHERE id = :id', { id: userId });
  const newXp = (Number(user.xp) || 0) + amount;
  const info = levelFromXp(newXp);
  await query('UPDATE users SET xp = :xp, level = :level WHERE id = :id', {
    xp: newXp,
    level: info.level,
    id: userId,
  });
  return info;
}

/**
 * Evaluate all badge definitions against the user's current stats and
 * award any newly-earned badges. Returns the list of newly awarded badges.
 */
export async function evaluateBadges(userId) {
  const summary = await stats.getSummary(userId);
  const [{ level }] = await query('SELECT level FROM users WHERE id = :id', { id: userId });

  const metricValue = {
    total_workouts: summary.totalWorkouts,
    streak_days: Math.max(summary.currentStreak, summary.longestStreak),
    total_volume: summary.totalVolume,
    distinct_exercises: summary.distinctExercises,
    level,
  };

  const badges = await query('SELECT * FROM badges');
  const earned = await query(
    'SELECT badge_id FROM user_badges WHERE user_id = :userId',
    { userId }
  );
  const earnedIds = new Set(earned.map((r) => r.badge_id));

  const newlyAwarded = [];
  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;
    const value = metricValue[badge.criteria_type] ?? 0;
    if (value >= badge.criteria_value) {
      await query(
        `INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (:userId, :badgeId)`,
        { userId, badgeId: badge.id }
      );
      newlyAwarded.push({
        code: badge.code,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        tier: badge.tier,
      });
    }
  }
  return newlyAwarded;
}

/** All badges with an "earned" flag and earned timestamp for the user. */
export async function listBadgesForUser(userId) {
  const rows = await query(
    `SELECT b.id, b.code, b.name, b.description, b.icon, b.tier,
            b.criteria_type AS criteriaType, b.criteria_value AS criteriaValue,
            ub.earned_at AS earnedAt
     FROM badges b
     LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = :userId
     ORDER BY (ub.earned_at IS NULL), b.criteria_value ASC`,
    { userId }
  );
  return rows.map((r) => ({ ...r, earned: r.earnedAt != null }));
}
