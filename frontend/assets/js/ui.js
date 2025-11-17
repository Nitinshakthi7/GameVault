/**
 * UI Module
 * Handles common UI interactions across the website
 */

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
            }
        });
    }
});

// Show/Hide Loading State
function showLoading(containerId = 'loadingState') {
    const loadingState = document.getElementById(containerId);
    if (loadingState) {
        loadingState.style.display = 'flex';
    }
}

function hideLoading(containerId = 'loadingState') {
    const loadingState = document.getElementById(containerId);
    if (loadingState) {
        loadingState.style.display = 'none';
    }
}

// Show/Hide Empty State
function showEmptyState(containerId = 'emptyState') {
    const emptyState = document.getElementById(containerId);
    if (emptyState) {
        emptyState.style.display = 'flex';
    }
}

function hideEmptyState(containerId = 'emptyState') {
    const emptyState = document.getElementById(containerId);
    if (emptyState) {
        emptyState.style.display = 'none';
    }
}

// Show Content Container
function showContent(containerId) {
    const content = document.getElementById(containerId);
    if (content) {
        content.style.display = 'grid';
    }
}

// Generate Star Rating HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '⭐';
    }
    
    if (halfStar) {
        stars += '⭐';
    }
    
    for (let i = 0; i < emptyStars; i++) {
        stars += '☆';
    }
    
    return stars;
}

// Show Notification Toast
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '0.5rem',
        backgroundColor: type === 'success' ? 'var(--success)' : 
                         type === 'error' ? 'var(--error)' : 
                         'var(--neon-blue)',
        color: 'white',
        fontWeight: '600',
        boxShadow: 'var(--shadow-lg)',
        zIndex: '9999',
        animation: 'slideInRight 0.3s ease-out'
    });
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Confirm Dialog
function confirmAction(message) {
    return confirm(message);
}

// Format Date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}
