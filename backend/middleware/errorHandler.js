const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Error logging function
const logError = (error, req) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || null,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      status: error.status || 500
    },
    body: req.body,
    params: req.params,
    query: req.query
  };

  const logFile = path.join(logsDir, `errors-${new Date().toISOString().split('T')[0]}.log`);
  const logLine = JSON.stringify(logEntry) + '\n';

  // Write error log asynchronously
  fs.appendFile(logFile, logLine, (err) => {
    if (err) {
      console.error('Failed to write error log:', err);
    }
  });
};

// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  logError(err, req);

  // Default error response
  let error = {
    success: false,
    message: 'Internal Server Error',
    status: 500,
    timestamp: new Date().toISOString()
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Express-validator validation errors
    error.status = 400;
    error.message = 'Validation failed';
    error.errors = err.errors || err.details;
  } else if (err.name === 'MulterError') {
    // Multer file upload errors
    error.status = 400;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        error.message = 'File size too large. Maximum size is 5MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        error.message = 'Too many files uploaded. Maximum is 5 files.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        error.message = 'Unexpected file field.';
        break;
      default:
        error.message = `File upload error: ${err.message}`;
    }
  } else if (err.name === 'JsonWebTokenError') {
    // JWT errors
    error.status = 401;
    error.message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    // JWT expiration errors
    error.status = 401;
    error.message = 'Authentication token has expired.';
  } else if (err.name === 'CastError') {
    // MongoDB/Database cast errors
    error.status = 400;
    error.message = 'Invalid data format.';
  } else if (err.code === 'ER_DUP_ENTRY') {
    // MySQL duplicate entry errors
    error.status = 409;
    error.message = 'Duplicate entry. This resource already exists.';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    // MySQL foreign key errors
    error.status = 400;
    error.message = 'Referenced resource does not exist.';
  } else if (err.status) {
    // Custom status codes
    error.status = err.status;
    error.message = err.message;
  } else if (err.message) {
    // Generic error with custom message
    error.message = err.message;
  }

  // Don't expose stack trace in production
  if (process.env.NODE_ENV !== 'production') {
    error.stack = err.stack;
  }

  // Handle specific HTTP status codes
  const statusMessages = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };

  error.errorType = statusMessages[error.status] || 'Unknown Error';

  // Send error response
  res.status(error.status).json(error);
};

// Async error wrapper for route handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
const notFoundHandler = (req, res) => {
  const error = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
    status: 404,
    timestamp: new Date().toISOString(),
    errorType: 'Not Found'
  };

  // Log 404 errors
  logError(new Error(error.message), req);

  res.status(404).json(error);
};

// Development error handler (with stack traces)
const developmentErrorHandler = (err, req, res, next) => {
  logError(err, req);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message,
    error: err,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
};

// Production error handler (no stack traces)
const productionErrorHandler = (err, req, res, next) => {
  logError(err, req);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
};

// Rate limit error handler
const rateLimitHandler = (req, res) => {
  const error = {
    success: false,
    message: 'Too many requests. Please try again later.',
    status: 429,
    timestamp: new Date().toISOString(),
    errorType: 'Too Many Requests',
    retryAfter: 60 // seconds
  };

  // Log rate limit violations
  logError(new Error('Rate limit exceeded'), req);

  res.status(429).set('Retry-After', '60').json(error);
};

// Validation error handler
const validationErrorHandler = (errors) => {
  const formattedErrors = errors.array().map(error => ({
    field: error.path || error.param,
    message: error.msg,
    value: error.value,
    location: error.location
  }));

  return {
    success: false,
    message: 'Validation failed',
    status: 400,
    errors: formattedErrors,
    timestamp: new Date().toISOString(),
    errorType: 'Validation Error'
  };
};

// Security error handler
const securityErrorHandler = (req, res, message = 'Security violation detected') => {
  const error = {
    success: false,
    message: message,
    status: 403,
    timestamp: new Date().toISOString(),
    errorType: 'Security Error'
  };

  // Log security violations
  logError(new Error(message), req);

  res.status(403).json(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  developmentErrorHandler,
  productionErrorHandler,
  rateLimitHandler,
  validationErrorHandler,
  securityErrorHandler,
  logError
};
