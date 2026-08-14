/**
 * Centralized error handling.
 * - AppError: throw this for expected failures (bad input, not found, ...).
 * - asyncHandler: wraps async route handlers so thrown/rejected errors reach
 *   the error middleware instead of crashing the process.
 * - errorHandler: Express error middleware that responds with JSON.
 */

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ msg: err.message });
  }
  // Mongoose validation / cast errors are client mistakes, not 500s.
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({ msg: err.message });
  }
  if (err && err.name === 'CastError') {
    return res.status(400).json({ msg: 'Invalid id format' });
  }
  console.error(err);
  return res.status(500).json({ msg: 'Server error' });
};

module.exports = { AppError, asyncHandler, errorHandler };
