import { query } from '../../db/pool.js';
import ApiError from '../../utils/ApiError.js';
import * as stats from '../stats/stats.service.js';

const DEFAULT_UNITS = {
  workouts_per_week: 'workouts',
  target_weight: 'kg',
  total_volume: 'kg',
  streak_days: 'days',
};

/** Build the live context used to evaluate goal progress. */
async function buildContext(userId) {
  const summary = await stats.getSummary(userId);
  const metrics = await query(
    `SELECT weight_kg FROM body_metrics WHERE user_id = :userId ORDER BY recorded_on ASC`,
    { userId }
  );
  const [user] = await query('SELECT weight_kg FROM users WHERE id = :userId', { userId });

  return {
    thisWeek: summary.thisWeek,
    totalVolume: summary.totalVolume,
    currentStreak: summary.currentStreak,
    currentWeight: Number(user?.weight_kg) || (metrics.at(-1)?.weight_kg ?? null),
    baselineWeight: metrics.length ? Number(metrics[0].weight_kg) : null,
  };
}

/** Compute current value + progress percentage for a goal. */
function evaluate(goal, ctx) {
  const target = Number(goal.target_value);
  let current = Number(goal.current_value);
  let progress = 0;

  switch (goal.type) {
    case 'workouts_per_week':
      current = ctx.thisWeek;
      progress = target > 0 ? current / target : 0;
      break;
    case 'total_volume':
      current = ctx.totalVolume;
      progress = target > 0 ? current / target : 0;
      break;
    case 'streak_days':
      current = ctx.currentStreak;
      progress = target > 0 ? current / target : 0;
      break;
    case 'target_weight': {
      current = ctx.currentWeight ?? current;
      const baseline = ctx.baselineWeight ?? current;
      if (baseline === target) {
        progress = 1;
      } else {
        // Works for both losing (baseline > target) and gaining directions.
        progress = (baseline - current) / (baseline - target);
      }
      break;
    }
    default:
      progress = 0;
  }

  progress = Math.max(0, Math.min(1, progress));
  return { current, progressPct: Math.round(progress * 100) };
}

function mapGoal(goal, evald) {
  return {
    id: goal.id,
    type: goal.type,
    title: goal.title,
    targetValue: Number(goal.target_value),
    currentValue: Number(evald.current.toFixed(2)),
    progressPct: evald.progressPct,
    unit: goal.unit,
    status: evald.progressPct >= 100 ? 'completed' : goal.status,
    dueDate: goal.due_date,
    createdAt: goal.created_at,
  };
}

export async function list(userId) {
  const goals = await query('SELECT * FROM goals WHERE user_id = :userId ORDER BY created_at DESC', {
    userId,
  });
  const ctx = await buildContext(userId);

  const mapped = [];
  for (const goal of goals) {
    const evald = evaluate(goal, ctx);
    // Persist progress so the stored value stays meaningful between reads.
    if (Number(goal.current_value) !== evald.current || (evald.progressPct >= 100 && goal.status === 'active')) {
      await query(
        `UPDATE goals SET current_value = :current,
           status = IF(:done AND status = 'active', 'completed', status)
         WHERE id = :id`,
        { current: evald.current, done: evald.progressPct >= 100 ? 1 : 0, id: goal.id }
      );
    }
    mapped.push(mapGoal(goal, evald));
  }
  return mapped;
}

export async function create(userId, data) {
  const result = await query(
    `INSERT INTO goals (user_id, type, title, target_value, unit, due_date)
     VALUES (:userId, :type, :title, :target, :unit, :dueDate)`,
    {
      userId,
      type: data.type,
      title: data.title,
      target: data.targetValue,
      unit: data.unit || DEFAULT_UNITS[data.type] || '',
      dueDate: data.dueDate || null,
    }
  );
  const [goal] = await query('SELECT * FROM goals WHERE id = :id', { id: result.insertId });
  const ctx = await buildContext(userId);
  return mapGoal(goal, evaluate(goal, ctx));
}

export async function update(userId, id, data) {
  const [existing] = await query('SELECT * FROM goals WHERE id = :id AND user_id = :userId', {
    id,
    userId,
  });
  if (!existing) throw ApiError.notFound('Goal not found');

  const fields = [];
  const params = { id };
  const map = { title: 'title', targetValue: 'target_value', status: 'status', dueDate: 'due_date' };
  for (const [key, column] of Object.entries(map)) {
    if (data[key] !== undefined) {
      fields.push(`${column} = :${key}`);
      params[key] = data[key];
    }
  }
  if (!fields.length) throw ApiError.badRequest('No valid fields to update');

  await query(`UPDATE goals SET ${fields.join(', ')} WHERE id = :id`, params);
  const [goal] = await query('SELECT * FROM goals WHERE id = :id', { id });
  const ctx = await buildContext(userId);
  return mapGoal(goal, evaluate(goal, ctx));
}

export async function remove(userId, id) {
  const result = await query('DELETE FROM goals WHERE id = :id AND user_id = :userId', { id, userId });
  if (result.affectedRows === 0) throw ApiError.notFound('Goal not found');
}
