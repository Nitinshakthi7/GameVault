/**
 * Authentication Module
 * Handles user registration, login, logout, and protected page access
 */

// Check if user is logged in
function isLoggedIn() {
    const token = localStorage.getItem('token');
    return token !== null;
}

// Get current user info from token (basic decode)
function getCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
        // Basic JWT decode (payload is the middle part)
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    window.location.href = './login.html';
}

// Protect page - redirect to login if not authenticated
function protectPage() {
    if (!isLoggedIn()) {
        window.location.href = './login.html';
        return false;
    }
    return true;
}

// Handle Register Form
if (document.getElementById('registerForm')) {
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.getElementById('registerBtn');
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear all previous errors
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
        
        // Get form data
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        let hasError = false;
        
        if (username.length < 3) {
            showError('username', 'Username must be at least 3 characters');
            hasError = true;
        }
        
        if (!isValidEmail(email)) {
            showError('email', 'Please enter a valid email address');
            hasError = true;
        }
        
        if (password.length < 6) {
            showError('password', 'Password must be at least 6 characters');
            hasError = true;
        }
        
        if (password !== confirmPassword) {
            showError('confirmPassword', 'Passwords do not match');
            hasError = true;
        }
        
        if (hasError) return;
        
        // Disable button and show loading
        registerBtn.disabled = true;
        registerBtn.textContent = 'Creating Account...';
        
        try {
            // Call API
            const response = await API.register({ username, email, password });
            
            // Show success message
            showMessage('Registration successful! Redirecting to login...', 'success');
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = './login.html';
            }, 2000);
            
        } catch (error) {
            showMessage(error.message || 'Registration failed. Please try again.', 'error');
            registerBtn.disabled = false;
            registerBtn.textContent = 'Create Account';
        }
    });
}

// Handle Login Form
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear all previous errors
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
        
        // Get form data
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Validation
        let hasError = false;
        
        if (!isValidEmail(email)) {
            showError('email', 'Please enter a valid email address');
            hasError = true;
        }
        
        if (password.length < 6) {
            showError('password', 'Password must be at least 6 characters');
            hasError = true;
        }
        
        if (hasError) return;
        
        // Disable button and show loading
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
        
        try {
            // Call API
            const response = await API.login({ email, password });
            
            // Store token
            localStorage.setItem('token', response.token);
            
            // Show success message
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to games page after 1 second
            setTimeout(() => {
                window.location.href = './view-games.html';
            }, 1000);
            
        } catch (error) {
            showMessage(error.message || 'Login failed. Please check your credentials.', 'error');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });
}

// Logout button handler
if (document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
}

// Utility Functions

function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = field.parentElement.querySelector('.error-message');
    
    field.classList.add('error');
    errorElement.textContent = message;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showMessage(message, type) {
    // Remove any existing message
    const existingMessage = document.querySelector('.message-box');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageBox = document.createElement('div');
    messageBox.className = `message-box message-${type}`;
    messageBox.textContent = message;
    
    // Insert at top of form
    const form = document.querySelector('.auth-form');
    form.insertBefore(messageBox, form.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        messageBox.remove();
    }, 5000);
}

// Protect pages that require authentication
if (document.body.classList.contains('protected-page')) {
    protectPage();
}
