const env = require('../config/env');

const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  // In production, suppress internal error details for 500s
  const isProduction = env.NODE_ENV === 'production';
  const message =
    isProduction && err.statusCode === 500
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  const response = {
    success: false,
    message,
    errors: err.errors || []
  };

  // Add stack trace in development only
  if (!isProduction) {
    response.stack = err.stack;
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    err.statusCode = 400;
    response.message = 'Validation Error';
    response.errors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message
    }));
  }

  // Handle Mongoose CastError (invalid ObjectId format)
  if (err.name === 'CastError') {
    err.statusCode = 400;
    response.message = 'Invalid Resource ID Format';
    response.errors = [
      {
        field: err.path,
        message: `Value "${err.value}" is not a valid identifier.`
      }
    ];
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401;
    response.message = 'Invalid authentication token. Please sign in again.';
  }

  if (err.name === 'TokenExpiredError') {
    err.statusCode = 401;
    response.message = 'Session has expired. Please sign in again.';
  }

  // Handle Mongoose Duplicate Key Errors (MongoDB code 11000)
  if (err.code === 11000) {
    err.statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    response.message = 'Duplicate Key Error';
    response.errors = [
      {
        field,
        message: `A record with this ${field} already exists.`
      }
    ];
  }

  res.status(err.statusCode).json({
    success: response.success,
    message: response.message,
    errors: response.errors,
    ...(response.stack && { stack: response.stack })
  });
};

module.exports = errorMiddleware;
