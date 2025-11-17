/**
 * API Communication Module
 * Handles all HTTP requests to the backend
 */

const API_BASE_URL = 'http://localhost:5000/api';

// API Helper Functions
const API = {
    // Helper function to get auth token from localStorage
    getToken: () => {
        return localStorage.getItem('token');
    },

    // Helper function to create headers with auth token
    getHeaders: (includeAuth = true) => {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (includeAuth) {
            const token = API.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        return headers;
    },

    // Generic fetch wrapper with error handling
    request: async (url, options = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, options);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // ===== AUTH ENDPOINTS =====
    
    // Register new user
    register: async (userData) => {
        return await API.request('/auth/register', {
            method: 'POST',
            headers: API.getHeaders(false),
            body: JSON.stringify(userData)
        });
    },

    // Login user
    login: async (credentials) => {
        return await API.request('/auth/login', {
            method: 'POST',
            headers: API.getHeaders(false),
            body: JSON.stringify(credentials)
        });
    },

    // ===== GAMES ENDPOINTS =====
    
    // Get all games
    // Get all games in the entire database (for public browsing, etc.)
    getAllGames: async () => {
        return await API.request('/games/all', { // Changed endpoint to be more specific
            method: 'GET',
            headers: API.getHeaders()
        });
    },

    // Get all games added by the current user
    getUserGames: async () => {
        return await API.request('/games', {
            method: 'GET',
            headers: API.getHeaders()
        });
    },

    // Get single game by ID
    getGameById: async (gameId) => {
        return await API.request(`/games/${gameId}`, {
            method: 'GET',
            headers: API.getHeaders()
        });
    },

    // Add new game
    addGame: async (gameData) => {
        return await API.request('/games', {
            method: 'POST',
            headers: API.getHeaders(),
            body: JSON.stringify(gameData)
        });
    },

    // Update game
    updateGame: async (gameId, gameData) => {
        return await API.request(`/games/${gameId}`, {
            method: 'PUT',
            headers: API.getHeaders(),
            body: JSON.stringify(gameData)
        });
    },

    // Delete game
    deleteGame: async (gameId) => {
        return await API.request(`/games/${gameId}`, {
            method: 'DELETE',
            headers: API.getHeaders()
        });
    },

    // ===== FILTER ENDPOINTS =====
    
    // Filter by platform
    getGamesByPlatform: async (platform) => {
        return await API.request(`/games/platform/${platform}`, {
            method: 'GET',
            headers: API.getHeaders()
        });
    },

    // Filter by genre
    getGamesByGenre: async (genre) => {
        return await API.request(`/games/genre/${genre}`, {
            method: 'GET',
            headers: API.getHeaders()
        });
    },

    // Get top rated games
    getTopRatedGames: async () => {
        return await API.request('/games/top-rated', {
            method: 'GET',
            headers: API.getHeaders()
        });
    },

    // ===== USER COLLECTION ENDPOINTS =====
    
    // Get user's collection
    getUserCollection: async () => {
        return await API.request('/games/user/collection', {
            method: 'GET',
            headers: API.getHeaders()
        });
    },

    // Add game to collection
    addToCollection: async (gameId) => {
        return await API.request('/games/user/collection', {
            method: 'POST',
            headers: API.getHeaders(),
            body: JSON.stringify({ gameId })
        });
    },

    // Remove game from collection
    removeFromCollection: async (gameId) => {
        return await API.request(`/games/user/collection/${gameId}`, {
            method: 'DELETE',
            headers: API.getHeaders()
        });
    },

    // ===== WISHLIST ENDPOINTS =====
    
    // Get user's wishlist
    getUserWishlist: async () => {
        return await API.request('/games/user/wishlist', {
            method: 'GET',
            headers: API.getHeaders()
        });
    },

    // Add game to wishlist
    addToWishlist: async (gameId) => {
        return await API.request('/games/user/wishlist', {
            method: 'POST',
            headers: API.getHeaders(),
            body: JSON.stringify({ gameId })
        });
    },

    // Remove game from wishlist
    removeFromWishlist: async (gameId) => {
        return await API.request(`/games/user/wishlist/${gameId}`, {
            method: 'DELETE',
            headers: API.getHeaders()
        });
    }
};
