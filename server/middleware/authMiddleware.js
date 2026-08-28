const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const env = require('../config/env');

/**
 * Middleware to authenticate requests using JSON Web Tokens (JWT).
 * Binds decoded user object to req.user if verification succeeds.
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Extract Bearer token from authorization headers
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to access this resource.', 401));
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Session expired! Please log in again.', 401));
      }
      return next(new AppError('Invalid token! Please log in again.', 401));
    }

    // 3. Check if target user profile exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The account belonging to this token no longer exists.', 401));
    }

    // 4. Grant access and bind credentials to request context
    req.user = {
      id: currentUser._id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role
    };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authenticate;
