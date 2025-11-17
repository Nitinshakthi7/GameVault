// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');

// Import middleware
const errorMiddleware = require('./middleware/errorMiddleware');
const loggerMiddleware = require('./middleware/loggerMiddleware');

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();

// Get port from environment variable or use 5000 as default
const PORT = process.env.PORT || 5000;

// ========================================
// MIDDLEWARE
// ========================================

// Enable CORS (Cross-Origin Resource Sharing) so frontend can access backend
app.use(cors());

// Parse incoming JSON data in request body
app.use(express.json());

// Parse URL-encoded data (from forms)
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests (our custom middleware)
app.use(loggerMiddleware);

// ========================================
// ROUTES
// ========================================

// Health check route to test if server is running
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'GameVault API is running! 🎮'
    });
});

// Authentication routes (register, login)
app.use('/api/auth', authRoutes);

// Game routes (CRUD operations, filters, collection, wishlist)
app.use('/api/games', gameRoutes);

// Handle 404 - Route not found
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

// ========================================
// DATABASE CONNECTION & SERVER START
// ========================================

// Connect to MongoDB database
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB database');
        
        // Start the server only after database connection is successful
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1); // Exit the process if database connection fails
    });
