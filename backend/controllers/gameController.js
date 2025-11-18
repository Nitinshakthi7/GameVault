// This file holds all the main logic for handling requests related to games.
// Each function here is a "controller" that takes a request, does something, and sends a response.

// We need our database models to find, create, or update data.
const Game = require('../models/Game');
const User = require('../models/User');

// We also need our validation helper functions.
const { validatePlatform, validateGenre, validateYear, validateRating } = require('../validators/gameValidator');

// ========================================
// GAME CRUD OPERATIONS
// ========================================

// @desc    Get all games added by the currently logged-in user
// @route   GET /api/games
exports.getAllUserGames = async (req, res) => {
    try {
        // Find all games in the database where the 'addedBy' field matches the logged-in user's ID.
        // The `req.user._id` is available because our 'protect' middleware added it to the request.
        const games = await Game.find({ addedBy: req.user._id })
            .populate('addedBy', 'username') // Replace the user's ID with their username.
            .sort({ createdAt: -1 }); // Sort the games to show the newest ones first.
        
        // Send a success response with the list of games.
        res.status(200).json({
            success: true,
            count: games.length,
            games: games
        });
        
    } catch (error) {
        // If an error occurs (e.g., database connection issue), send a server error response.
        console.error('Get User Games Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch games for this user'
        });
    }
};

// @desc    Get a single game by its ID
// @route   GET /api/games/:id
exports.getGameById = async (req, res) => {
    try {
        // Find a single game document using the ID from the URL parameter (req.params.id).
        const game = await Game.findById(req.params.id)
            .populate('addedBy', 'username');
        
        // If no game is found with that ID, send a 404 Not Found error.
        if (!game) {
            return res.status(404).json({
                success: false,
                message: 'Game not found'
            });
        }
        
        // If the game is found, send it back in the response.
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
};

// @desc    Add a new game to the library
// @route   POST /api/games
exports.addGame = async (req, res) => {
    try {
        // Get the game details from the JSON body of the request.
        const { title, platform, genre, year, rating, description, developer, publisher, posterUrl } = req.body;
        
        // Perform validation checks before creating the game.
        if (!title || !platform || !genre || !year || !rating || !description) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }
        
        if (!validatePlatform(platform)) {
            return res.status(400).json({ success: false, message: 'Invalid platform' });
        }
        
        if (!validateGenre(genre)) {
            return res.status(400).json({ success: false, message: 'Invalid genre' });
        }
        
        if (!validateYear(year)) {
            return res.status(400).json({ success: false, message: 'Year must be between 1980 and 2025' });
        }
        
        if (!validateRating(rating)) {
            return res.status(400).json({ success: false, message: 'Rating must be between 0 and 5' });
        }
        
        // If all validation passes, create a new game object.
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
            addedBy: req.user._id // Link the game to the logged-in user.
        });
        
        // Save the new game to the database.
        await newGame.save();
        
        // Send a 201 Created response with the new game's data.
        res.status(201).json({
            success: true,
            message: 'Game added successfully',
            game: newGame
        });
        
    } catch (error) {
        // This will catch any database-level validation errors (e.g., from the Mongoose schema).
        console.error('Add Game Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to add game'
        });
    }
};

// @desc    Add multiple games at once
// @route   POST /api/games/bulk
exports.addBulkGames = async (req, res) => {
    try {
        // Expect an array of game objects in the request body.
        const games = req.body.games;

        if (!Array.isArray(games) || games.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a non-empty "games" array'
            });
        }

        // We'll build a list of valid games to insert.
        const gamesToInsert = [];

        // Loop through each game provided and validate it.
        for (const gameData of games) {
            const { title, platform, genre, year, rating, description, developer, publisher, posterUrl } = gameData;

            if (!title || !platform || !genre || !year || !rating || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Each game must include title, platform, genre, year, rating, and description'
                });
            }

            // If any game in the list is invalid, we stop the whole process.
            if (!validatePlatform(platform)) return res.status(400).json({ success: false, message: `Invalid platform for game: ${title}` });
            if (!validateGenre(genre)) return res.status(400).json({ success: false, message: `Invalid genre for game: ${title}` });
            if (!validateYear(year)) return res.status(400).json({ success: false, message: `Year must be between 1980 and 2025 for game: ${title}` });
            if (!validateRating(rating)) return res.status(400).json({ success: false, message: `Rating must be between 0 and 5 for game: ${title}` });

            // If the game is valid, add it to our list with the user's ID.
            gamesToInsert.push({ ...gameData, addedBy: req.user._id });
        }

        // Use `insertMany` to add all valid games to the database in one go.
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
};

// @desc    Update an existing game
// @route   PUT /api/games/:id
exports.updateGame = async (req, res) => {
    try {
        // First, find the game by its ID to make sure it exists.
        const game = await Game.findById(req.params.id);
        
        if (!game) {
            return res.status(404).json({ success: false, message: 'Game not found' });
        }
        
        // Get the new data from the request body.
        const { title, platform, genre, year, rating, description, developer, publisher, posterUrl } = req.body;
        
        // Validate any new data that was provided.
        if (platform && !validatePlatform(platform)) return res.status(400).json({ success: false, message: 'Invalid platform' });
        if (genre && !validateGenre(genre)) return res.status(400).json({ success: false, message: 'Invalid genre' });
        if (year && !validateYear(year)) return res.status(400).json({ success: false, message: 'Year must be between 1980 and 2025' });
        if (rating && !validateRating(rating)) return res.status(400).json({ success: false, message: 'Rating must be between 0 and 5' });
        
        // Update the game's fields only if a new value was provided.
        // This prevents accidentally clearing fields.
        if (title) game.title = title;
        if (platform) game.platform = platform;
        if (genre) game.genre = genre;
        if (year) game.year = year;
        if (rating) game.rating = rating;
        if (description) game.description = description;
        if (developer) game.developer = developer;
        if (publisher) game.publisher = publisher;
        if (posterUrl !== undefined) game.posterUrl = posterUrl;
        
        // Save the updated game document.
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
};

// @desc    Delete a game
// @route   DELETE /api/games/:id
exports.deleteGame = async (req, res) => {
    try {
        // Find the game by its ID and delete it in one step.
        const game = await Game.findByIdAndDelete(req.params.id);
        
        if (!game) {
            return res.status(404).json({ success: false, message: 'Game not found' });
        }
        
        // IMPORTANT: After deleting a game, we must also remove its ID from any user's
        // collection or wishlist to avoid broken references.
        await User.updateMany(
            {},
            { $pull: { ownedGames: req.params.id, wishlist: req.params.id } }
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
};

// ========================================
// FILTER OPERATIONS
// ========================================

// @desc    Get games filtered by platform
// @route   GET /api/games/platform/:platform
exports.getGamesByPlatform = async (req, res) => {
    try {
        const platform = req.params.platform;
        
        // Find all games where the 'platform' field matches the one from the URL.
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
};

// @desc    Get games filtered by genre
// @route   GET /api/games/genre/:genre
exports.getGamesByGenre = async (req, res) => {
    try {
        const genre = req.params.genre;
        
        // Find all games where the 'genre' field matches the one from the URL.
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
};

// @desc    Get top-rated games (rating >= 4.5)
// @route   GET /api/games/top-rated
exports.getTopRatedGames = async (req, res) => {
    try {
        // Use the MongoDB query operator `$gte` (greater than or equal to).
        const games = await Game.find({ rating: { $gte: 4.5 } })
            .populate('addedBy', 'username')
            .sort({ rating: -1, createdAt: -1 }); // Sort by highest rating first.
        
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
};

// ========================================
// USER COLLECTION & WISHLIST OPERATIONS
// ========================================

// @desc    Get the logged-in user's personal collection of games
// @route   GET /api/games/user/collection
exports.getUserCollection = async (req, res) => {
    try {
        // Find the user and then populate the 'ownedGames' field.
        // This replaces the array of game IDs with the full game documents.
        const user = await User.findById(req.user._id)
            .populate({
                path: 'ownedGames',
                populate: { path: 'addedBy', select: 'username' } // Also populate the user who added the game.
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
};

// @desc    Add a game to the user's collection
// @route   POST /api/games/user/collection
exports.addGameToCollection = async (req, res) => {
    try {
        const { gameId } = req.body;
        if (!gameId) return res.status(400).json({ success: false, message: 'Game ID is required' });
        
        const game = await Game.findById(gameId);
        if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
        
        const user = await User.findById(req.user._id);
        
        // Prevent adding duplicates.
        if (user.ownedGames.includes(gameId)) {
            return res.status(400).json({ success: false, message: 'Game already in your collection' });
        }
        
        user.ownedGames.push(gameId);
        await user.save();
        
        res.status(200).json({ success: true, message: 'Game added to collection' });
        
    } catch (error) {
        console.error('Add to Collection Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to add game to collection' });
    }
};

// @desc    Remove a game from the user's collection
// @route   DELETE /api/games/user/collection/:gameId
exports.removeGameFromCollection = async (req, res) => {
    try {
        const { gameId } = req.params;
        const user = await User.findById(req.user._id);
        
        // Use the $pull operator for a more efficient removal from the array.
        await user.updateOne({ $pull: { ownedGames: gameId } });
        
        res.status(200).json({ success: true, message: 'Game removed from collection' });
        
    } catch (error) {
        console.error('Remove from Collection Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to remove game from collection' });
    }
};

// @desc    Get the logged-in user's wishlist
// @route   GET /api/games/user/wishlist
exports.getUserWishlist = async (req, res) => {
    try {
        // This is identical to getting the collection, but for the 'wishlist' field.
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
        res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
    }
};

// @desc    Add a game to the user's wishlist
// @route   POST /api/games/user/wishlist
exports.addGameToWishlist = async (req, res) => {
    try {
        const { gameId } = req.body;
        if (!gameId) return res.status(400).json({ success: false, message: 'Game ID is required' });
        
        const game = await Game.findById(gameId);
        if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
        
        const user = await User.findById(req.user._id);
        
        if (user.wishlist.includes(gameId)) {
            return res.status(400).json({ success: false, message: 'Game already in your wishlist' });
        }
        
        user.wishlist.push(gameId);
        await user.save();
        
        res.status(200).json({ success: true, message: 'Game added to wishlist' });
        
    } catch (error) {
        console.error('Add to Wishlist Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to add game to wishlist' });
    }
};

// @desc    Remove a game from the user's wishlist
// @route   DELETE /api/games/user/wishlist/:gameId
exports.removeGameFromWishlist = async (req, res) => {
    try {
        const { gameId } = req.params;
        const user = await User.findById(req.user._id);

        // Use $pull to remove the game ID from the wishlist array.
        await user.updateOne({ $pull: { wishlist: gameId } });

        res.status(200).json({ success: true, message: 'Game removed from wishlist' });

    } catch (error) {
        console.error('Remove from Wishlist Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to remove game from wishlist' });
    }
};