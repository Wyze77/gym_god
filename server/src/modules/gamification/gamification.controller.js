import asyncHandler from '../../utils/asyncHandler.js';
import { query } from '../../db/pool.js';
import * as gamification from './gamification.service.js';

export const listBadges = asyncHandler(async (req, res) => {
  const badges = await gamification.listBadgesForUser(req.user.id);
  const earnedCount = badges.filter((b) => b.earned).length;
  res.status(200).json({ badges, earnedCount, total: badges.length });
});

export const getLevel = asyncHandler(async (req, res) => {
  const [user] = await query('SELECT xp FROM users WHERE id = :id', { id: req.user.id });
  res.status(200).json(gamification.levelFromXp(Number(user.xp) || 0));
});
