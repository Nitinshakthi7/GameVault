// Simple validation functions for user data

// Validate email format
const validateEmail = (email) => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
};

// Validate username
const validateUsername = (username) => {
    // Username must be 3-20 characters, alphanumeric
    if (username.length < 3 || username.length > 20) {
        return false;
    }
    return true;
};

// Validate password
const validatePassword = (password) => {
    // Password must be at least 6 characters
    if (password.length < 6) {
        return false;
    }
    return true;
};

// Export validation functions
module.exports = {
    validateEmail,
    validateUsername,
    validatePassword
};
