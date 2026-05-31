import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import exercisesRoutes from '../modules/exercises/exercises.routes.js';
import workoutsRoutes from '../modules/workouts/workouts.routes.js';
import goalsRoutes from '../modules/goals/goals.routes.js';
import statsRoutes from '../modules/stats/stats.routes.js';
import gamificationRoutes from '../modules/gamification/gamification.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fitsync-api', time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/exercises', exercisesRoutes);
router.use('/workouts', workoutsRoutes);
router.use('/goals', goalsRoutes);
router.use('/stats', statsRoutes);
router.use('/gamification', gamificationRoutes);

export default router;
