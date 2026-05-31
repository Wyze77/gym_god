import jwt from 'jsonwebtoken';
import config from '../config/env.js';

/** Sign a JWT for an authenticated user. */
export function signToken(user) {
  return jwt.sign({ email: user.email }, config.jwt.secret, {
    subject: String(user.id),
    expiresIn: config.jwt.expiresIn,
  });
}
