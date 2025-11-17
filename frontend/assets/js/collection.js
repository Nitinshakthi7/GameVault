/**
 * Collection Module
 * Handles user's game collection
 */

if (document.getElementById('collectionGrid')) {
    loadCollection();
    
    async function loadCollection() {
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');
        const collectionGrid = document.getElementById('collectionGrid');
        
        // Show loading
        loadingState.style.display = 'flex';
        emptyState.style.display = 'none';
        collectionGrid.style.display = 'none';
        
        try {
            const response = await API.getUserCollection();
            const games = response.games || [];
            
            // Hide loading after 1 second minimum
            setTimeout(() => {
                loadingState.style.display = 'none';
                
                // Update stats
                updateCollectionStats(games);
                
                // Display games
                displayCollection(games);
            }, 1000);
            
        } catch (error) {
            // Hide loading after 1 second even on error
            setTimeout(() => {
                loadingState.style.display = 'none';
                showNotification(error.message || 'Failed to load collection', 'error');
                emptyState.style.display = 'flex';
            }, 1000);
        }
    }
    
    function updateCollectionStats(games) {
        const totalGames = games.length;
        const avgRating = totalGames > 0 
            ? (games.reduce((sum, game) => sum + game.rating, 0) / totalGames).toFixed(1)
            : '0.0';
        
        document.getElementById('totalGames').textContent = totalGames;
        document.getElementById('avgRating').textContent = avgRating;
    }
    
    function displayCollection(games) {
        const collectionGrid = document.getElementById('collectionGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (games.length === 0) {
            collectionGrid.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }
        
        emptyState.style.display = 'none';
        collectionGrid.style.display = 'grid';
        collectionGrid.innerHTML = '';
        
        games.forEach(game => {
            const gameCard = createCollectionCard(game);
            collectionGrid.appendChild(gameCard);
        });
    }
    
    function createCollectionCard(game) {
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
                    <button class="btn btn-icon btn-delete" onclick="removeFromCollection('${game._id}')">
                        ❌ Remove from Collection
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
}

// Remove from collection
async function removeFromCollection(gameId) {
    if (!confirmAction('Remove this game from your collection?')) {
        return;
    }
    
    try {
        await API.removeFromCollection(gameId);
        showNotification('Removed from collection!', 'success');
        
        // Reload page
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        showNotification(error.message || 'Failed to remove from collection', 'error');
    }
}
