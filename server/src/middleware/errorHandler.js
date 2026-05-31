import config from '../config/env.js';

/** 404 handler for unmatched routes. */
export function notFound(req, res) {
  res.status(404).json({
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
}

/**
 * Central error handler. Converts thrown errors (including ApiError and
 * common MySQL errors) into a consistent JSON shape.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  const details = err.details || undefined;

  // Friendly handling for duplicate key (e.g. email already used).
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'A record with these details already exists';
  }

  if (statusCode >= 500) {
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    error: {
      message,
      ...(details ? { details } : {}),
      ...(config.env === 'development' && statusCode >= 500
        ? { stack: err.stack }
        : {}),
    },
  });
}
