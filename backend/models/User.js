// Import mongoose library
const mongoose = require('mongoose');

// Define User Schema (structure of user document in database)
const userSchema = new mongoose.Schema(
    {
        // Username field
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [20, 'Username cannot exceed 20 characters']
        },
        
        // Email field
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email'
            ]
        },
        
        // Password field (will be hashed before saving)
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters']
        },
        
        // Array of game IDs that user owns
        ownedGames: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Game' // Reference to Game model
            }
        ],
        
        // Array of game IDs in user's wishlist
        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Game' // Reference to Game model
            }
        ],
        
        // Timestamp when user was created
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        // Automatically add createdAt and updatedAt timestamps
        timestamps: true
    }
);

// Create User model from schema
const User = mongoose.model('User', userSchema);

// Export User model
module.exports = User;
