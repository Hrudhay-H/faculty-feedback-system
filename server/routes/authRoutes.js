const express = require('express');
const { loginSchema, login, getMe } = require('../controllers/authController');
const { validateBody } = require('../middleware/validationMiddleware');
const authenticate = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

// Strict rate limiter for authentication endpoints: max 5 login requests per 15 minutes (100 in dev/test)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100,
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const router = express.Router();

router.post('/login', loginLimiter, validateBody(loginSchema), login);
router.get('/me', authenticate, getMe);

// Stateless logout endpoint — client handles token disposal.
// This endpoint exists for spec compliance and to allow future token blocklisting.
router.post('/logout', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful',
    data: {}
  });
});

module.exports = router;
