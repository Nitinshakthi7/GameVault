/**
 * Wishlist Module
 * Handles user's game wishlist
 */

if (document.getElementById('wishlistGrid')) {
    loadWishlist();
    
    async function loadWishlist() {
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');
        const wishlistGrid = document.getElementById('wishlistGrid');
        
        // Show loading
        loadingState.style.display = 'flex';
        emptyState.style.display = 'none';
        wishlistGrid.style.display = 'none';
        
        try {
            const response = await API.getUserWishlist();
            const games = response.games || [];
            
            // Hide loading after 1 second minimum
            setTimeout(() => {
                loadingState.style.display = 'none';
                
                // Update stats
                document.getElementById('wishlistCount').textContent = games.length;
                
                // Display games
                displayWishlist(games);
            }, 1000);
            
        } catch (error) {
            // Hide loading after 1 second even on error
            setTimeout(() => {
                loadingState.style.display = 'none';
                showNotification(error.message || 'Failed to load wishlist', 'error');
                emptyState.style.display = 'flex';
            }, 1000);
        }
    }
    
    function displayWishlist(games) {
        const wishlistGrid = document.getElementById('wishlistGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (games.length === 0) {
            wishlistGrid.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }
        
        emptyState.style.display = 'none';
        wishlistGrid.style.display = 'grid';
        wishlistGrid.innerHTML = '';
        
        games.forEach(game => {
            const gameCard = createWishlistCard(game);
            wishlistGrid.appendChild(gameCard);
        });
    }
    
    function createWishlistCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card';
        
        card.innerHTML = `
            <div class="game-card-header">
                <div class="game-card-platform">${game.platform}</div>
                <h3 class="game-card-title-overlay">${game.title}</h3>
            </div>
            ${game.posterUrl ? `
            <div class="game-card-poster">
                <img src="${game.posterUrl}" alt="${game.title} poster" class="game-poster-image" loading="lazy" />
            </div>` : ''}
            <div class="game-card-body">
                <div class="game-card-meta">
                    <span>🎮 ${game.genre}</span>
                    <span>📅 ${game.year}</span>
                </div>
                <div class="game-card-rating">
                    <span class="rating-stars">${generateStars(game.rating)}</span>
                    <span class="rating-value">${game.rating.toFixed(1)}</span>
                </div>
                <p class="game-card-description">${game.description}</p>
                ${game.developer ? `<p style="font-size: 0.875rem; color: var(--text-muted);">Developer: ${game.developer}</p>` : ''}
                <div class="game-card-actions">
                    <button class="btn btn-icon" onclick="moveToCollection('${game._id}')">
                        📚 Move to Collection
                    </button>
                    <button class="btn btn-icon btn-delete" onclick="removeFromWishlist('${game._id}')">
                        ❌ Remove from Wishlist
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
}

// Move to collection (remove from wishlist and add to collection)
async function moveToCollection(gameId) {
    try {
        await API.addToCollection(gameId);
        await API.removeFromWishlist(gameId);
        
        showNotification('Moved to your collection!', 'success');
        
        // Reload page
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        showNotification(error.message || 'Failed to move to collection', 'error');
    }
}

// Remove from wishlist
async function removeFromWishlist(gameId) {
    if (!confirmAction('Remove this game from your wishlist?')) {
        return;
    }
    
    try {
        await API.removeFromWishlist(gameId);
        showNotification('Removed from wishlist!', 'success');
        
        // Reload page
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        showNotification(error.message || 'Failed to remove from wishlist', 'error');
    }
}
