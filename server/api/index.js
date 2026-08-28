const connectDB = require('../config/db');
const app = require('../app');

// Connect to DB once (Vercel serverless reuses connections)
connectDB();

// Export the Express app as a Vercel serverless handler
// Do NOT call app.listen() — Vercel manages the HTTP lifecycle
module.exports = app;
