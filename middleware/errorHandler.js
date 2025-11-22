export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // MongoDB errors
  if (err.name === 'MongoServerError') {
    return res.status(500).json({
      success: false,
      error: 'Database error occurred',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication token expired',
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
};
