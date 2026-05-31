import { z } from 'zod';

export const listExercisesSchema = z.object({
  category: z.enum(['strength', 'cardio', 'core', 'mobility']).optional(),
  muscleGroup: z.string().trim().max(60).optional(),
  search: z.string().trim().max(120).optional(),
});

export const createExerciseSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum(['strength', 'cardio', 'core', 'mobility']).default('strength'),
  muscleGroup: z.string().trim().max(60).default('full_body'),
  equipment: z.string().trim().max(60).default('bodyweight'),
  metricType: z.enum(['reps_weight', 'reps', 'duration', 'distance']).default('reps_weight'),
  description: z.string().trim().max(500).optional(),
});
