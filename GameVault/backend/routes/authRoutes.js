// Import required packages
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import User model
const User = require('../models/User');

// Import validators
const { validateEmail, validateUsername, validatePassword } = require('../validators/userValidator');

// Create router
const router = express.Router();

// ========================================
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
// ========================================
router.post('/register', async (req, res) => {
    try {
        // Get data from request body
        const { username, email, password } = req.body;
        
        // Basic validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username, email, and password'
            });
        }
        
        // Validate username
        if (!validateUsername(username)) {
            return res.status(400).json({
                success: false,
                message: 'Username must be 3-20 characters long'
            });
        }
        
        // Validate email
        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }
        
        // Validate password
        if (!validatePassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }
        
        // Check if user already exists (by email)
        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }
        
        // Check if user already exists (by username)
        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            return res.status(400).json({
                success: false,
                message: 'Username already taken'
            });
        }
        
        // Hash password before saving to database
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });
        
        // Save user to database
        await newUser.save();
        
        // Send success response (no JWT for registration)
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email
            }
        });
        
    } catch (error) {
        console.error('Register Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// ========================================
// @route   POST /api/auth/login
// @desc    Login user and return JWT token
// @access  Public
// ========================================
router.post('/login', async (req, res) => {
    try {
        // Get data from request body
        const { email, password } = req.body;
        
        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        
        // Check if user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Compare provided password with hashed password in database
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        
        // Check if password matches
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Create JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email }, // Payload
            process.env.JWT_SECRET,              // Secret key
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // Expiry time
        );
        
        // Send success response with token
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
        
    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Export router
module.exports = router;
