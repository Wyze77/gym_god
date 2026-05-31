import { Router } from 'express';
import auth from '../../middleware/auth.js';
import * as controller from './gamification.controller.js';

const router = Router();

router.use(auth);

router.get('/badges', controller.listBadges);
router.get('/level', controller.getLevel);

export default router;
