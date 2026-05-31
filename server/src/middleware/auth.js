import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import ApiError from '../utils/ApiError.js';

/**
 * Protects routes by requiring a valid Bearer JWT.
 * On success attaches { id, email } to req.user.
 */
export default function auth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(ApiError.unauthorized('Authentication token missing'));
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}
