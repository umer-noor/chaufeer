/**
 * Simple in-memory rate limiter (best-effort on serverless).
 * keyFn(req) -> string
 */
const buckets = new Map();

const rateLimit = ({
  windowMs = 15 * 60 * 1000,
  max = 20,
  keyFn = (req) => req.ip || "unknown",
  message = "Too many requests. Please try again later.",
} = {}) => {
  return (req, res, next) => {
    const key = String(keyFn(req));
    const now = Date.now();
    let entry = buckets.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    return next();
  };
};

module.exports = rateLimit;
