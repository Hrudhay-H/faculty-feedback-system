const AppError = require('../utils/AppError');

/**
 * Middleware factory to validate request body against a Zod schema.
 * Rejects with 400 Bad Request if validation fails.
 */
const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const formattedErrors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message
    }));
    return next(new AppError('Validation Error', 400, formattedErrors));
  }
  // Bind parsed data (with defaults/coercions if any)
  req.body = result.data;
  next();
};

module.exports = {
  validateBody
};
