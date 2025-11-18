/**
 * Collection Module
 * Handles user's game collection
 */

if (document.getElementById('collectionGrid')) {
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
                    <button class="btn btn-secondary" onclick="removeFromCollection('${game._id}')">❌ Remove from Collection</button>
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
                    <button class="btn-icon btn-delete" onclick="removeFromCollection('${game._id}')">
                        ❌ Remove from Collection
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
