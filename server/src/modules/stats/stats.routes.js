import { Router } from 'express';
import auth from '../../middleware/auth.js';
import * as controller from './stats.controller.js';

const router = Router();

router.use(auth);

router.get('/dashboard', controller.dashboard);
router.get('/progress', controller.progress);

export default router;
