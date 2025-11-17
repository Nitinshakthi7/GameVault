// Import mongoose library
const mongoose = require('mongoose');

// Define Game Schema (structure of game document in database)
const gameSchema = new mongoose.Schema(
    {
        // Game title
        title: {
            type: String,
            required: [true, 'Game title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters']
        },
        
        // Gaming platform
        platform: {
            type: String,
            required: [true, 'Platform is required'],
            enum: {
                values: ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Multi-platform'],
                message: '{VALUE} is not a valid platform'
            }
        },
        
        // Game genre
        genre: {
            type: String,
            required: [true, 'Genre is required'],
            enum: {
                values: [
                    'RPG', 
                    'FPS', 
                    'Strategy', 
                    'Racing', 
                    'Adventure', 
                    'Sports', 
                    'Puzzle', 
                    'Simulation', 
                    'Horror', 
                    'Fighting', 
                    'Action'
                ],
                message: '{VALUE} is not a valid genre'
            }
        },
        
        // Release year
        year: {
            type: Number,
            required: [true, 'Release year is required'],
            min: [1980, 'Year cannot be before 1980'],
            max: [2025, 'Year cannot be after 2025']
        },
        
        // Game rating (0 to 5)
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: [0, 'Rating must be at least 0'],
            max: [5, 'Rating cannot exceed 5']
        },
        
        // Game description
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters']
        },
        
        // Developer name (optional)
        developer: {
            type: String,
            trim: true,
            maxlength: [100, 'Developer name cannot exceed 100 characters']
        },
        
        // Publisher name (optional)
        publisher: {
            type: String,
            trim: true,
            maxlength: [100, 'Publisher name cannot exceed 100 characters']
        },
        
        // Poster image URL (optional)
        posterUrl: {
            type: String,
            trim: true,
            maxlength: [300, 'Poster URL cannot exceed 300 characters']
        },
        
        // User who added this game
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        
        // Creation timestamp
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

// Create Game model from schema
const Game = mongoose.model('Game', gameSchema);

// Export Game model
module.exports = Game;
