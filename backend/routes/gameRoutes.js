// Import required packages
const express = require('express');

// Import models
const Game = require('../models/Game');
const User = require('../models/User');

// Import authentication middleware
const { protect } = require('../middleware/authMiddleware');

// Import validators
const { validatePlatform, validateGenre, validateYear, validateRating } = require('../validators/gameValidator');

// Create router
const router = express.Router();

// ========================================
// GAME CRUD OPERATIONS
// ========================================

// @route   GET /api/games
// @desc    Get all games
// @access  Protected
router.get('/', protect, async (req, res) => {
    try {
        // Find all games and populate addedBy field with username
        const games = await Game.find()
            .populate('addedBy', 'username')
            .sort({ createdAt: -1 }); // Sort by newest first
        
        res.status(200).json({
            success: true,
            count: games.length,
            games: games
        });
        
    } catch (error) {
        console.error('Get All Games Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch games'
        });
    }
});

// @route   GET /api/games/:id
// @desc    Get single game by ID
// @access  Protected
router.get('/:id', protect, async (req, res) => {
    try {
        // Find game by ID
        const game = await Game.findById(req.params.id)
            .populate('addedBy', 'username');
        
        // Check if game exists
        if (!game) {
            return res.status(404).json({
                success: false,
                message: 'Game not found'
            });
        }
        
        res.status(200).json({
            success: true,
            game: game
        });
        
    } catch (error) {
        console.error('Get Game Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch game'
        });
    }
});

// @route   POST /api/games
// @desc    Add new game
// @access  Protected
router.post('/', protect, async (req, res) => {
    try {
        // Get data from request body
        const { title, platform, genre, year, rating, description, developer, publisher, posterUrl } = req.body;
        
        // Basic validation
        if (!title || !platform || !genre || !year || !rating || !description) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        
        // Validate platform
        if (!validatePlatform(platform)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid platform'
            });
        }
        
        // Validate genre
        if (!validateGenre(genre)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid genre'
            });
        }
        
        // Validate year
        if (!validateYear(year)) {
            return res.status(400).json({
                success: false,
                message: 'Year must be between 1980 and 2025'
            });
        }
        
        // Validate rating
        if (!validateRating(rating)) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 0 and 5'
            });
        }
        
        // Create new game
        const newGame = new Game({
            title,
            platform,
            genre,
            year,
            rating,
            description,
            developer,
            publisher,
            posterUrl,
            addedBy: req.user._id // Get user ID from auth middleware
        });
        
        // Save game to database
        await newGame.save();
        
        // Send success response
        res.status(201).json({
            success: true,
            message: 'Game added successfully',
            game: newGame
        });
        
    } catch (error) {
        console.error('Add Game Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to add game'
        });
    }
});

// @route   POST /api/games/bulk
// @desc    Add multiple games at once
// @access  Protected
router.post('/bulk', protect, async (req, res) => {
    try {
        // Expect an array of games in the request body
        const games = req.body.games;

        // Basic validation for input format
        if (!Array.isArray(games) || games.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a non-empty "games" array'
            });
        }

        // Prepare list of game objects to insert
        const gamesToInsert = [];

        for (const gameData of games) {
            const { title, platform, genre, year, rating, description, developer, publisher, posterUrl } = gameData;

            // Check required fields for each game
            if (!title || !platform || !genre || !year || !rating || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Each game must include title, platform, genre, year, rating, and description'
                });
            }

            // Validate main fields using the same simple validators
            if (!validatePlatform(platform)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid platform for game: ${title}`
                });
            }

            if (!validateGenre(genre)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid genre for game: ${title}`
                });
            }

            if (!validateYear(year)) {
                return res.status(400).json({
                    success: false,
                    message: `Year must be between 1980 and 2025 for game: ${title}`
                });
            }

            if (!validateRating(rating)) {
                return res.status(400).json({
                    success: false,
                    message: `Rating must be between 0 and 5 for game: ${title}`
                });
            }

            // Push cleaned game data with addedBy field
            gamesToInsert.push({
                title,
                platform,
                genre,
                year,
                rating,
                description,
                developer,
                publisher,
                posterUrl,
                addedBy: req.user._id
            });
        }

        // Insert all games in one operation
        const createdGames = await Game.insertMany(gamesToInsert);

        return res.status(201).json({
            success: true,
            message: 'Games added successfully',
            count: createdGames.length,
            games: createdGames
        });
    } catch (error) {
        console.error('Bulk Add Games Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to add games in bulk'
        });
    }
});

// @route   PUT /api/games/:id
// @desc    Update game
// @access  Protected
router.put('/:id', protect, async (req, res) => {
    try {
        // Find game by ID
        const game = await Game.findById(req.params.id);
        
        // Check if game exists
        if (!game) {
            return res.status(404).json({
                success: false,
                message: 'Game not found'
            });
        }
        
        // Get update data from request body
        const { title, platform, genre, year, rating, description, developer, publisher, posterUrl } = req.body;
        
        // Validate if provided
        if (platform && !validatePlatform(platform)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid platform'
            });
        }
        
        if (genre && !validateGenre(genre)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid genre'
            });
        }
        
        if (year && !validateYear(year)) {
            return res.status(400).json({
                success: false,
                message: 'Year must be between 1980 and 2025'
            });
        }
        
        if (rating && !validateRating(rating)) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 0 and 5'
            });
        }
        
        // Update game fields
        if (title) game.title = title;
        if (platform) game.platform = platform;
        if (genre) game.genre = genre;
        if (year) game.year = year;
        if (rating) game.rating = rating;
        if (description) game.description = description;
        if (developer) game.developer = developer;
        if (publisher) game.publisher = publisher;
        if (posterUrl !== undefined) game.posterUrl = posterUrl;
        
        // Save updated game
        await game.save();
        
        res.status(200).json({
            success: true,
            message: 'Game updated successfully',
            game: game
        });
        
    } catch (error) {
        console.error('Update Game Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update game'
        });
    }
});

// @route   DELETE /api/games/:id
// @desc    Delete game
// @access  Protected
router.delete('/:id', protect, async (req, res) => {
    try {
        // Find and delete game by ID
        const game = await Game.findByIdAndDelete(req.params.id);
        
        // Check if game exists
        if (!game) {
            return res.status(404).json({
                success: false,
                message: 'Game not found'
            });
        }
        
        // Also remove game from all users' collections and wishlists
        await User.updateMany(
            {},
            {
                $pull: {
                    ownedGames: req.params.id,
                    wishlist: req.params.id
                }
            }
        );
        
        res.status(200).json({
            success: true,
            message: 'Game deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete Game Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to delete game'
        });
    }
});

// ========================================
// FILTER OPERATIONS
// ========================================

// @route   GET /api/games/platform/:platform
// @desc    Get games by platform
// @access  Protected
router.get('/platform/:platform', protect, async (req, res) => {
    try {
        const platform = req.params.platform;
        
        // Find games with matching platform
        const games = await Game.find({ platform: platform })
            .populate('addedBy', 'username')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: games.length,
            games: games
        });
        
    } catch (error) {
        console.error('Filter by Platform Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to filter games by platform'
        });
    }
});

// @route   GET /api/games/genre/:genre
// @desc    Get games by genre
// @access  Protected
router.get('/genre/:genre', protect, async (req, res) => {
    try {
        const genre = req.params.genre;
        
        // Find games with matching genre
        const games = await Game.find({ genre: genre })
            .populate('addedBy', 'username')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: games.length,
            games: games
        });
        
    } catch (error) {
        console.error('Filter by Genre Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to filter games by genre'
        });
    }
});

// @route   GET /api/games/top-rated
// @desc    Get top-rated games (rating >= 4.5)
// @access  Protected
router.get('/top-rated', protect, async (req, res) => {
    try {
        // Find games with rating >= 4.5
        const games = await Game.find({ rating: { $gte: 4.5 } })
            .populate('addedBy', 'username')
            .sort({ rating: -1, createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: games.length,
            games: games
        });
        
    } catch (error) {
        console.error('Top Rated Games Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch top-rated games'
        });
    }
});

// ========================================
// USER COLLECTION OPERATIONS
// ========================================

// @route   GET /api/games/user/collection
// @desc    Get user's collection
// @access  Protected
router.get('/user/collection', protect, async (req, res) => {
    try {
        // Find user and populate ownedGames
        const user = await User.findById(req.user._id)
            .populate({
                path: 'ownedGames',
                populate: { path: 'addedBy', select: 'username' }
            });
        
        res.status(200).json({
            success: true,
            count: user.ownedGames.length,
            games: user.ownedGames
        });
        
    } catch (error) {
        console.error('Get Collection Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch collection'
        });
    }
});

// @route   POST /api/games/user/collection
// @desc    Add game to user's collection
// @access  Protected
router.post('/user/collection', protect, async (req, res) => {
    try {
        const { gameId } = req.body;
        
        // Validate gameId
        if (!gameId) {
            return res.status(400).json({
                success: false,
                message: 'Game ID is required'
            });
        }
        
        // Check if game exists
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({
                success: false,
                message: 'Game not found'
            });
        }
        
        // Find user
        const user = await User.findById(req.user._id);
        
        // Check if game is already in collection
        if (user.ownedGames.includes(gameId)) {
            return res.status(400).json({
                success: false,
                message: 'Game already in your collection'
            });
        }
        
        // Add game to collection
        user.ownedGames.push(gameId);
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'Game added to collection'
        });
        
    } catch (error) {
        console.error('Add to Collection Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to add game to collection'
        });
    }
});

// @route   DELETE /api/games/user/collection/:gameId
// @desc    Remove game from user's collection
// @access  Protected
router.delete('/user/collection/:gameId', protect, async (req, res) => {
    try {
        const gameId = req.params.gameId;
        
        // Find user and remove game from collection
        const user = await User.findById(req.user._id);
        
        // Check if game is in collection
        if (!user.ownedGames.includes(gameId)) {
            return res.status(400).json({
                success: false,
                message: 'Game not in your collection'
            });
        }
        
        // Remove game from collection
        user.ownedGames = user.ownedGames.filter(
            id => id.toString() !== gameId
        );
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'Game removed from collection'
        });
        
    } catch (error) {
        console.error('Remove from Collection Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to remove game from collection'
        });
    }
});

// ========================================
// WISHLIST OPERATIONS
// ========================================

// @route   GET /api/games/user/wishlist
// @desc    Get user's wishlist
// @access  Protected
router.get('/user/wishlist', protect, async (req, res) => {
    try {
        // Find user and populate wishlist
        const user = await User.findById(req.user._id)
            .populate({
                path: 'wishlist',
                populate: { path: 'addedBy', select: 'username' }
            });
        
        res.status(200).json({
            success: true,
            count: user.wishlist.length,
            games: user.wishlist
        });
        
    } catch (error) {
        console.error('Get Wishlist Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wishlist'
        });
    }
});

// @route   POST /api/games/user/wishlist
// @desc    Add game to user's wishlist
// @access  Protected
router.post('/user/wishlist', protect, async (req, res) => {
    try {
        const { gameId } = req.body;
        
        // Validate gameId
        if (!gameId) {
            return res.status(400).json({
                success: false,
                message: 'Game ID is required'
            });
        }
        
        // Check if game exists
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({
                success: false,
                message: 'Game not found'
            });
        }
        
        // Find user
        const user = await User.findById(req.user._id);
        
        // Check if game is already in wishlist
        if (user.wishlist.includes(gameId)) {
            return res.status(400).json({
                success: false,
                message: 'Game already in your wishlist'
            });
        }
        
        // Add game to wishlist
        user.wishlist.push(gameId);
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'Game added to wishlist'
        });
        
    } catch (error) {
        console.error('Add to Wishlist Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to add game to wishlist'
        });
    }
});

// @route   DELETE /api/games/user/wishlist/:gameId
// @desc    Remove game from user's wishlist
// @access  Protected
router.delete('/user/wishlist/:gameId', protect, async (req, res) => {
    try {
        const gameId = req.params.gameId;
        
        // Find user and remove game from wishlist
        const user = await User.findById(req.user._id);
        
        // Check if game is in wishlist
        if (!user.wishlist.includes(gameId)) {
            return res.status(400).json({
                success: false,
                message: 'Game not in your wishlist'
            });
        }
        
        // Remove game from wishlist
        user.wishlist = user.wishlist.filter(
            id => id.toString() !== gameId
        );
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'Game removed from wishlist'
        });
        
    } catch (error) {
        console.error('Remove from Wishlist Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to remove game from wishlist'
        });
    }
});

// Export router
module.exports = router;
