import { Router } from 'express';
import auth from '../../middleware/auth.js';
import { validate } from '../../utils/validate.js';
import { createGoalSchema, updateGoalSchema } from './goals.validators.js';
import * as controller from './goals.controller.js';

const router = Router();

router.use(auth);

router.get('/', controller.list);
router.post('/', validate(createGoalSchema), controller.create);
router.patch('/:id', validate(updateGoalSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
