// Global error handling middleware
// This catches all errors thrown in the application

const errorMiddleware = (err, req, res, next) => {
    // Get status code from error or default to 500
    const statusCode = err.statusCode || 500;
    
    // Log error to console for debugging
    console.error('Error:', err.message);
    
    // Send error response to client
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        // Include stack trace only in development mode
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

// Export error middleware
module.exports = errorMiddleware;
