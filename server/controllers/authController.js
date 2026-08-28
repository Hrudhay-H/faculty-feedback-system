const zod = require('zod');
const authService = require('../services/authService');

// Zod schema to validate login body
const loginSchema = zod.object({
  email: zod
    .string({ required_error: 'Email is required' })
    .email({ message: 'Invalid email address format' }),
  password: zod
    .string({ required_error: 'Password is required' })
    .min(1, { message: 'Password is required' })
});

/**
 * Handle user credentials verification and issue tokens
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.loginUser(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetch authenticated profile information
 */
const getMe = async (req, res, next) => {
  try {
    const userProfile = await authService.getUserProfile(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      data: {
        user: userProfile
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  loginSchema,
  login,
  getMe
};
