// Simple validation functions for game data

// Valid platforms
const validPlatforms = ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Multi-platform'];

// Valid genres
const validGenres = [
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
];

// Validate platform
const validatePlatform = (platform) => {
    return validPlatforms.includes(platform);
};

// Validate genre
const validateGenre = (genre) => {
    return validGenres.includes(genre);
};

// Validate year
const validateYear = (year) => {
    return year >= 1980 && year <= 2025;
};

// Validate rating
const validateRating = (rating) => {
    return rating >= 0 && rating <= 5;
};

// Export validation functions
module.exports = {
    validatePlatform,
    validateGenre,
    validateYear,
    validateRating,
    validPlatforms,
    validGenres
};
