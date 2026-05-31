import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  heightCm: z.coerce.number().min(50).max(280).optional(),
  weightKg: z.coerce.number().min(20).max(400).optional(),
  fitnessGoal: z
    .enum(['lose_weight', 'build_muscle', 'stay_fit', 'gain_strength', 'improve_endurance'])
    .optional(),
});

export const bodyMetricSchema = z.object({
  recordedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'recordedOn must be YYYY-MM-DD')
    .optional(),
  weightKg: z.coerce.number().min(20).max(400),
  bodyFatPct: z.coerce.number().min(1).max(70).optional(),
  notes: z.string().max(255).optional(),
});
