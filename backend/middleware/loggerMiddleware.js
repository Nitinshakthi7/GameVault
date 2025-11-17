// Simple request logger middleware
// Logs all incoming HTTP requests to the console

const loggerMiddleware = (req, res, next) => {
    // Get current timestamp
    const timestamp = new Date().toISOString();
    
    // Log request method, URL, and timestamp
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    
    // Continue to next middleware
    next();
};

// Export logger middleware
module.exports = loggerMiddleware;
