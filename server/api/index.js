const connectDB = require('../config/db');
const app = require('../app');

// Wrap the Express app to ensure DB is connected before handling each request.
// connectDB() uses connection caching, so this is cheap on warm invocations.
module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    res.status(503).json({ success: false, message: 'Database unavailable. Please try again.' });
    return;
  }
  return app(req, res);
};
