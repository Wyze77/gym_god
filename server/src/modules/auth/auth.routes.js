import { Router } from 'express';
import auth from '../../middleware/auth.js';
import { validate } from '../../utils/validate.js';
import { registerSchema, loginSchema } from './auth.validators.js';
import * as controller from './auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.get('/me', auth, controller.me);

export default router;
