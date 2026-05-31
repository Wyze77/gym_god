import { Router } from 'express';
import auth from '../../middleware/auth.js';
import { validate } from '../../utils/validate.js';
import { updateProfileSchema, bodyMetricSchema } from './users.validators.js';
import * as controller from './users.controller.js';

const router = Router();

router.use(auth); // every route below requires authentication

router.patch('/me', validate(updateProfileSchema), controller.updateProfile);
router.get('/me/metrics', controller.getBodyMetrics);
router.post('/me/metrics', validate(bodyMetricSchema), controller.addBodyMetric);

export default router;
