// Import required packages
const express = require('express');

// This file defines the API endpoints. It's like a table of contents for our API.
// It maps a URL and HTTP method (like GET or POST) to a specific controller function.

// Import the controller functions
const {
    getAllUserGames,
    getGameById,
    addGame,
    addBulkGames,
    updateGame,
    deleteGame,
    getGamesByPlatform,
    getGamesByGenre,
    getTopRatedGames,
    getUserCollection,
    addGameToCollection,
    removeGameFromCollection,
    getUserWishlist,
    addGameToWishlist,
    removeGameFromWishlist
} = require('../controllers/gameController');

// Import authentication middleware
const { protect } = require('../middleware/authMiddleware');

// Create router
const router = express.Router();

// ========================================
// GAME CRUD OPERATIONS
// ========================================

// The 'protect' middleware runs before the controller function to ensure the user is logged in.
router.route('/')
    .get(protect, getAllUserGames)
    .post(protect, addGame);

router.route('/bulk')
    .post(protect, addBulkGames);

router.route('/:id')
    .get(protect, getGameById)
    .put(protect, updateGame)
    .delete(protect, deleteGame);

// ========================================
// FILTER OPERATIONS
// ========================================

router.get('/platform/:platform', protect, getGamesByPlatform);
router.get('/genre/:genre', protect, getGamesByGenre);
router.get('/top-rated', protect, getTopRatedGames);

// ========================================
// USER COLLECTION OPERATIONS
// ========================================

router.route('/user/collection')
    .get(protect, getUserCollection)
    .post(protect, addGameToCollection);

router.route('/user/collection/:gameId')
    .delete(protect, removeGameFromCollection);

// ========================================
// WISHLIST OPERATIONS
// ========================================

router.route('/user/wishlist')
    .get(protect, getUserWishlist)
    .post(protect, addGameToWishlist);

router.route('/user/wishlist/:gameId')
    .delete(protect, removeGameFromWishlist);

// Export router
module.exports = router;
