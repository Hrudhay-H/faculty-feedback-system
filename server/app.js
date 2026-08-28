const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const AppError = require('./utils/AppError');
const errorMiddleware = require('./middleware/errorMiddleware');
const mongoSanitize = require('./middleware/mongoSanitize');


// Import routes
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');

const app = express();

// Trust proxy (required for express-rate-limit on Vercel/behind reverse proxies)
app.set('trust proxy', 1);

// 1. Security HTTP Headers
app.use(helmet());

// 2. CORS Configuration
// Dynamically allow requests from localhost or Vercel deployments
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      // Parse custom origins from env
      const allowedOrigins = (env.CORS_ORIGIN || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

      const isAllowed = 
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.endsWith('.vercel.app');

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin '${origin}' is not allowed`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
  })
);

// Explicitly handle OPTIONS preflight requests globally
app.options('*', cors());

// 3. General API Rate Limiter (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', apiLimiter);

// 4. JSON & URLencoded Body Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize);


// 5. Mount API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);

// Root route for base URL
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Faculty Feedback System API!'
  });
});

// 6. Catch-all for undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 7. Centralized Error Middleware
app.use(errorMiddleware);

module.exports = app;
