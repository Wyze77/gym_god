import { Router } from 'express';
import auth from '../../middleware/auth.js';
import { validate } from '../../utils/validate.js';
import { listExercisesSchema, createExerciseSchema } from './exercises.validators.js';
import * as controller from './exercises.controller.js';

const router = Router();

router.use(auth);

router.get('/', validate(listExercisesSchema, 'query'), controller.list);
router.get('/:id', controller.getOne);
router.post('/', validate(createExerciseSchema), controller.create);

export default router;
