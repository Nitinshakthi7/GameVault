// Import required packages
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes - checks if user has valid JWT token
const protect = async (req, res, next) => {
    let token;
    
    try {
        // Check if Authorization header exists and starts with 'Bearer'
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            // Extract token from header (format: "Bearer TOKEN")
            token = req.headers.authorization.split(' ')[1];
            
            // Verify token using JWT secret
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Find user by ID from token payload (exclude password)
            req.user = await User.findById(decoded.id).select('-password');
            
            // If user not found
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // User is authenticated, proceed to next middleware/route
            next();
            
        } else {
            // No token provided
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token provided'
            });
        }
    } catch (error) {
        console.error('Auth Middleware Error:', error.message);
        
        // Token is invalid or expired
        return res.status(401).json({
            success: false,
            message: 'Not authorized, token failed'
        });
    }
};

// Export middleware
module.exports = { protect };
