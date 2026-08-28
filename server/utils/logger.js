/**
 * logger.js — Sanitized structured logger
 *
 * Wraps console output. Strips sensitive fields (passwords, JWT tokens,
 * feedback comments, student emails) before writing to stdout/stderr.
 * Never logs raw request bodies that may contain credentials.
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'jwt',
  'secret',
  'comment',
  'ratings',
  'studentId',
  'studentEmail'
]);

function sanitize(obj, depth = 0) {
  if (depth > 5) return '[deep object]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // Mask Bearer tokens
    return obj.replace(/Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*/g, 'Bearer [REDACTED]');
  }
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((el) => sanitize(el, depth + 1));

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      cleaned[key] = '[REDACTED]';
    } else {
      cleaned[key] = sanitize(value, depth + 1);
    }
  }
  return cleaned;
}

const logger = {
  info: (...args) => console.log('[INFO]', ...args.map((a) => (typeof a === 'object' ? JSON.stringify(sanitize(a)) : a))),
  warn: (...args) => console.warn('[WARN]', ...args.map((a) => (typeof a === 'object' ? JSON.stringify(sanitize(a)) : a))),
  error: (message, err) => {
    const entry = { message };
    if (err) {
      entry.name = err.name;
      entry.msg = err.message;
      // Only include stack in development
      if (process.env.NODE_ENV !== 'production') {
        entry.stack = err.stack;
      }
    }
    console.error('[ERROR]', JSON.stringify(sanitize(entry)));
  }
};

module.exports = logger;
