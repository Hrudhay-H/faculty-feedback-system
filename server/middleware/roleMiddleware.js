const AppError = require('../utils/AppError');

/**
 * Middleware factory to authorize requests based on user roles.
 * Must be executed AFTER the authentication middleware.
 * Rejects with 403 Forbidden if user's role is not in the allowed list.
 */
const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  next();
};

module.exports = {
  requireRole
};
