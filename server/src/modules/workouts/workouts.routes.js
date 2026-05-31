import { Router } from 'express';
import auth from '../../middleware/auth.js';
import { validate } from '../../utils/validate.js';
import { createWorkoutSchema, listWorkoutsSchema } from './workouts.validators.js';
import * as controller from './workouts.controller.js';

const router = Router();

router.use(auth);

router.get('/', validate(listWorkoutsSchema, 'query'), controller.list);
router.get('/last', controller.getLast);
router.get('/:id', controller.getOne);
router.post('/', validate(createWorkoutSchema), controller.create);
router.delete('/:id', controller.remove);

export default router;
