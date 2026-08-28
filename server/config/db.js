const mongoose = require('mongoose');
const env = require('./env');

// Cache the connection promise across serverless warm invocations.
// This prevents spawning a new connection on every request.
let cached = global._mongooseConnection;

if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000, // fail fast if Mongo is unreachable
        socketTimeoutMS: 45000,
      })
      .then((conn) => {
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // allow retry on next invocation
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error; // let caller handle — never call process.exit in serverless
  }

  return cached.conn;
};

module.exports = connectDB;
