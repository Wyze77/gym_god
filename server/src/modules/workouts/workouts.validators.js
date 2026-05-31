import { z } from 'zod';

const setSchema = z.object({
  reps: z.coerce.number().int().min(0).max(1000).optional(),
  weightKg: z.coerce.number().min(0).max(1000).optional(),
  durationSec: z.coerce.number().int().min(0).max(86400).optional(),
  distanceM: z.coerce.number().int().min(0).max(1000000).optional(),
  completed: z.coerce.boolean().optional(),
});

const exerciseEntrySchema = z.object({
  exerciseId: z.coerce.number().int().positive(),
  notes: z.string().max(255).optional(),
  sets: z.array(setSchema).min(1, 'Each exercise needs at least one set'),
});

export const createWorkoutSchema = z.object({
  title: z.string().trim().min(1).max(120).default('Workout'),
  notes: z.string().trim().max(500).optional(),
  performedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?$/)).optional(),
  durationMin: z.coerce.number().int().min(0).max(1440).optional(),
  exercises: z.array(exerciseEntrySchema).min(1, 'Add at least one exercise'),
});

export const listWorkoutsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
