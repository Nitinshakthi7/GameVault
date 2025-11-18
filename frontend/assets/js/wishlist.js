/**
 * Wishlist Module
 * Handles user's game wishlist
 */

if (document.getElementById('wishlistGrid')) {
    // Detail overlay elements (shared with All Games view)
    const detailOverlay = document.getElementById('gameDetailOverlay');
    const detailBackdrop = document.getElementById('gameDetailBackdrop');
    const detailContent = document.getElementById('gameDetailContent');

    function closeDetail() {
        if (!detailOverlay || !detailContent) return;
        detailOverlay.style.display = 'none';
        detailContent.classList.remove('open');
    }

    if (detailOverlay && detailBackdrop && detailContent) {
        const initialClose = document.getElementById('gameDetailClose');
        if (initialClose) {
            initialClose.addEventListener('click', closeDetail);
        }

        detailBackdrop.addEventListener('click', closeDetail);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && detailOverlay.style.display === 'flex') {
                closeDetail();
            }
        });
    }

    function openGameDetail(game) {
        if (!detailOverlay || !detailContent) return;

        const posterUrl = game.posterUrl || '';

        detailContent.innerHTML = `
            <button class="game-detail-close" id="gameDetailClose">&times;</button>
            <div class="game-detail-poster">
                ${posterUrl ? `<img src="${posterUrl}" alt="${game.title} poster" />` : ''}
            </div>
            <div class="game-detail-info">
                <h2 class="game-detail-title">${game.title}</h2>
                <div class="game-detail-meta">
                    <span><strong>Platform:</strong> ${game.platform}</span>
                    <span><strong>Genre:</strong> ${game.genre}</span>
                    <span><strong>Year:</strong> ${game.year}</span>
                    <span><strong>Rating:</strong> ${game.rating.toFixed(1)} / 5 (${generateStars(game.rating)})</span>
                    ${game.developer ? `<span><strong>Developer:</strong> ${game.developer}</span>` : ''}
                    ${game.publisher ? `<span><strong>Publisher:</strong> ${game.publisher}</span>` : ''}
                    <span><strong>Added by:</strong> ${game.addedBy?.username || 'Unknown'}</span>
                </div>
                <p class="game-detail-description">${game.description}</p>
                <div class="game-detail-actions">
                    <button class="btn btn-primary" onclick="moveToCollection('${game._id}')">📚 Move to Collection</button>
                    <button class="btn btn-secondary" onclick="removeFromWishlist('${game._id}')">❌ Remove from Wishlist</button>
                </div>
            </div>
        `;

        const newClose = detailContent.querySelector('#gameDetailClose');
        if (newClose) {
            newClose.addEventListener('click', closeDetail);
        }

        detailOverlay.style.display = 'flex';
        detailContent.classList.add('open');
    }

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

        const developer = game.developer || 'Unknown developer';

        // Match the Netflix-style card structure used in the All Games section
        card.innerHTML = `
            <div class="game-card-poster">
                ${game.posterUrl ? `
                    <img src="${game.posterUrl}" alt="${game.title} poster" class="game-poster-image" loading="lazy" />
                ` : ''}
                <div class="game-card-gradient"></div>
                <div class="game-card-header">
                    <h3 class="game-card-title-overlay">${game.title}</h3>
                </div>
            </div>
            <div class="game-card-body">
                <div class="game-card-meta">
                    <span class="game-card-developer">${developer}</span>
                    <div class="game-card-rating">
                        <span class="rating-stars">${generateStars(game.rating)}</span>
                        <span class="rating-value">${game.rating.toFixed(1)}</span>
                    </div>
                </div>
                <div class="game-card-meta">
                    <span>🎮 ${game.genre}</span>
                    <span>📅 ${game.year}</span>
                </div>
                <div class="game-card-actions">
                    <button class="btn-icon" onclick="moveToCollection('${game._id}')">
                        📚 Move to Collection
                    </button>
                    <button class="btn-icon btn-delete" onclick="removeFromWishlist('${game._id}')">
                        ❌ Remove from Wishlist
                    </button>
                </div>
            </div>
        `;

        // Open detailed view when clicking the card, but ignore action buttons
        card.addEventListener('click', (event) => {
            if (event.target.closest('.btn-icon')) {
                return;
            }
            openGameDetail(game);
        });

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
