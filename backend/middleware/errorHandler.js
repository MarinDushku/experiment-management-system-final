// Global error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        message: 'Validation Error',
        errors: messages
      });
    }
    
    // Mongoose duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate field value entered',
        field: Object.keys(err.keyValue)[0]
      });
    }
    
    // JWT error
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token'
      });
    }
    
    // JWT expired error
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired'
      });
    }
    
    // Default server error
    res.status(500).json({
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  };
  
  module.exports = errorHandler;