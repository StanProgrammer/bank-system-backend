/**
 * Simple in-memory login rate limiter (sliding window, keyed by IP).
 * Prevents brute-force password guessing. Dev-grade: resets on server restart.
 */

const buckets = new Map();

const DEFAULT_LIMIT = 20;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

const clientIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';

function rateLimit({ limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS } = {}) {
  return (req, res, next) => {
    const key = clientIp(req);
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now - bucket.startedAt > windowMs) {
      buckets.set(key, { startedAt: now, count: 1 });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > limit) {
      const retryAfterSec = Math.ceil((bucket.startedAt + windowMs - now) / 1000);
      return res
        .status(429)
        .set('Retry-After', String(retryAfterSec))
        .json({ msg: `Too many attempts. Try again in ${retryAfterSec}s.` });
    }
    next();
  };
}

module.exports = rateLimit;
