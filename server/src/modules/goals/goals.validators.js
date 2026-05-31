import { z } from 'zod';

export const createGoalSchema = z.object({
  type: z.enum(['workouts_per_week', 'target_weight', 'total_volume', 'streak_days']),
  title: z.string().trim().min(2).max(120),
  targetValue: z.coerce.number().positive().max(10000000),
  unit: z.string().trim().max(20).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dueDate must be YYYY-MM-DD').optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  targetValue: z.coerce.number().positive().max(10000000).optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
