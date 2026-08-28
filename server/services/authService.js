const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const env = require('../config/env');

/**
 * Verifies email/password credentials and signs a new JWT session token.
 */
const loginUser = async (email, password) => {
  // 1. Fetch user including password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // 2. Verify hashed password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  // 3. Sign JWT token
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
      algorithm: 'HS256'
    }
  );

  // 4. Strip password out of user response object
  const userObject = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  return {
    token,
    user: userObject
  };
};

/**
 * Retrieves a user profile by ID.
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User profile not found', 404);
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
};

module.exports = {
  loginUser,
  getUserProfile
};
