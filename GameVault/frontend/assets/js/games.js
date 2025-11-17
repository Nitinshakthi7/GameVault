/**
 * Games Module
 * Handles game listing, adding, updating, and deleting
 */

// ===== ADD GAME PAGE =====
if (document.getElementById('addGameForm')) {
    const addGameForm = document.getElementById('addGameForm');
    const submitBtn = document.getElementById('submitBtn');
    
    addGameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        
        // Get form data
        const gameData = {
            title: document.getElementById('title').value.trim(),
            platform: document.getElementById('platform').value,
            genre: document.getElementById('genre').value,
            year: parseInt(document.getElementById('year').value),
            rating: parseFloat(document.getElementById('rating').value),
            description: document.getElementById('description').value.trim(),
            developer: document.getElementById('developer').value.trim() || undefined,
            publisher: document.getElementById('publisher').value.trim() || undefined,
            posterUrl: document.getElementById('posterUrl').value.trim() || undefined
        };
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding Game...';
        
        try {
            await API.addGame(gameData);
            showNotification('Game added successfully!', 'success');
            
            // Redirect to games page
            setTimeout(() => {
                window.location.href = './view-games.html';
            }, 1500);
            
        } catch (error) {
            showNotification(error.message || 'Failed to add game', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Game';
        }
    });
}

// ===== UPDATE GAME PAGE =====
if (document.getElementById('updateGameForm')) {
    const updateGameForm = document.getElementById('updateGameForm');
    const updateBtn = document.getElementById('updateBtn');
    const loadingState = document.getElementById('loadingState');
    
    // Get game ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');
    
    if (!gameId) {
        showNotification('No game ID provided', 'error');
        setTimeout(() => {
            window.location.href = './view-games.html';
        }, 2000);
    } else {
        // Load game data
        loadGameData(gameId);
    }
    
    async function loadGameData(id) {
        try {
            const response = await API.getGameById(id);
            const game = response.game;
            
            // Populate form
            document.getElementById('gameId').value = game._id;
            document.getElementById('title').value = game.title;
            document.getElementById('platform').value = game.platform;
            document.getElementById('genre').value = game.genre;
            document.getElementById('year').value = game.year;
            document.getElementById('rating').value = game.rating;
            document.getElementById('description').value = game.description;
            document.getElementById('developer').value = game.developer || '';
            document.getElementById('publisher').value = game.publisher || '';
            document.getElementById('posterUrl').value = game.posterUrl || '';
            
            // Show form, hide loading
            loadingState.style.display = 'none';
            updateGameForm.style.display = 'flex';
            
        } catch (error) {
            showNotification(error.message || 'Failed to load game data', 'error');
            setTimeout(() => {
                window.location.href = './view-games.html';
            }, 2000);
        }
    }
    
    updateGameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const gameId = document.getElementById('gameId').value;
        
        // Get updated form data
        const gameData = {
            title: document.getElementById('title').value.trim(),
            platform: document.getElementById('platform').value,
            genre: document.getElementById('genre').value,
            year: parseInt(document.getElementById('year').value),
            rating: parseFloat(document.getElementById('rating').value),
            description: document.getElementById('description').value.trim(),
            developer: document.getElementById('developer').value.trim() || undefined,
            publisher: document.getElementById('publisher').value.trim() || undefined,
            posterUrl: document.getElementById('posterUrl').value.trim() || undefined
        };
        
        // Disable submit button
        updateBtn.disabled = true;
        updateBtn.textContent = 'Updating Game...';
        
        try {
            await API.updateGame(gameId, gameData);
            showNotification('Game updated successfully!', 'success');
            
            // Redirect to games page
            setTimeout(() => {
                window.location.href = './view-games.html';
            }, 1500);
            
        } catch (error) {
            showNotification(error.message || 'Failed to update game', 'error');
            updateBtn.disabled = false;
            updateBtn.textContent = 'Update Game';
        }
    });
}

// ===== VIEW GAMES PAGE =====
if (document.getElementById('gamesGrid')) {
    let allGames = [];
    let currentFilter = { platform: '', genre: '', topRated: false };

    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const gamesGrid = document.getElementById('gamesGrid'); // fallback, not used normally
    const gamesSections = document.getElementById('gamesSections');

    const detailOverlay = document.getElementById('gameDetailOverlay');
    const detailBackdrop = document.getElementById('gameDetailBackdrop');
    const detailContent = document.getElementById('gameDetailContent');
    const detailClose = document.getElementById('gameDetailClose');

    // Load all games on page load
    loadGames();

    // Filter handlers
    document.getElementById('platformFilter').addEventListener('change', (e) => {
        currentFilter.platform = e.target.value;
        currentFilter.topRated = false;
        applyFilters();
    });

    document.getElementById('genreFilter').addEventListener('change', (e) => {
        currentFilter.genre = e.target.value;
        currentFilter.topRated = false;
        applyFilters();
    });

    document.getElementById('topRatedBtn').addEventListener('click', () => {
        currentFilter.platform = '';
        currentFilter.genre = '';
        currentFilter.topRated = true;

        // Reset dropdowns
        document.getElementById('platformFilter').value = '';
        document.getElementById('genreFilter').value = '';

        applyFilters();
    });

    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        currentFilter = { platform: '', genre: '', topRated: false };

        // Reset dropdowns
        document.getElementById('platformFilter').value = '';
        document.getElementById('genreFilter').value = '';

        displayGames(allGames);
    });

    // Detail overlay close handlers
    function closeDetail() {
        detailOverlay.style.display = 'none';
        detailContent.classList.remove('open');
    }

    detailClose.addEventListener('click', closeDetail);
    detailBackdrop.addEventListener('click', closeDetail);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && detailOverlay.style.display === 'flex') {
            closeDetail();
        }
    });

    async function loadGames() {
        // Show loading
        loadingState.style.display = 'flex';
        emptyState.style.display = 'none';
        gamesSections.style.display = 'none';
        gamesGrid.style.display = 'none';

        try {
            // Fetch games for the currently logged-in user instead of all games.
            // This is the key change to make the library user-specific.
            const response = await API.getUserGames();
            allGames = response.games || []; // The endpoint should return a user's games

            // Sort all games A-Z by title for initial display
            allGames.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

            // Hide loading after 1 second minimum
            setTimeout(() => {
                loadingState.style.display = 'none';
                displayGames(allGames);
            }, 1000);

        } catch (error) {
            // Hide loading after 1 second even on error
            setTimeout(() => {
                loadingState.style.display = 'none';
                showNotification(error.message || 'Failed to load games', 'error');
                emptyState.style.display = 'flex';
            }, 1000);
        }
    }

    function applyFilters() {
        let filteredGames = [...allGames];

        if (currentFilter.platform) {
            filteredGames = filteredGames.filter(game => game.platform === currentFilter.platform);
        }

        if (currentFilter.genre) {
            filteredGames = filteredGames.filter(game => game.genre === currentFilter.genre);
        }

        if (currentFilter.topRated) {
            filteredGames = filteredGames.filter(game => game.rating >= 4.5);
        }

        // Always show filtered results A-Z by title
        filteredGames.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

        displayGames(filteredGames);
    }

    function displayGames(games) {
        // If no games, show empty state
        if (!games || games.length === 0) {
            gamesSections.style.display = 'none';
            gamesGrid.style.display = 'none'; // Hide the grid
            gamesGrid.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        gamesSections.style.display = 'none'; // We won't use the genre sections
        gamesSections.innerHTML = '';
        gamesGrid.style.display = 'grid'; // Show the main grid
        gamesGrid.innerHTML = ''; // Clear the grid before adding new games

        // A simple loop to go through each game and add it to the grid
        games.forEach(game => {
            // Create a card for the game
            const gameCard = createGameCard(game);
            // Add the card to our grid
            gamesGrid.appendChild(gameCard);
        });
    }

    function openGameDetail(game) {
        // Build detail layout (poster + full info)
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
                    <button class="btn btn-primary" onclick="addToCollection('${game._id}')">📚 Add to Collection</button>
                    <button class="btn btn-secondary" onclick="addToWishlist('${game._id}')">🎯 Add to Wishlist</button>
                    <button class="btn btn-secondary" onclick="editGame('${game._id}')">✏️ Edit</button>
                    <button class="btn btn-secondary" onclick="deleteGame('${game._id}')">🗑️ Delete</button>
                </div>
            </div>
        `;

        // Re-bind close button inside replaced content
        const newClose = detailContent.querySelector('#gameDetailClose');
        newClose.addEventListener('click', () => {
            detailOverlay.style.display = 'none';
        });

        detailOverlay.style.display = 'flex';
    }

    function createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card';

        const developer = game.developer || 'Unknown developer';

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
                <div class="game-card-actions">
                    <button class="btn-icon" data-action="collection">📚 Collection</button>
                    <button class="btn-icon" data-action="wishlist">🎯 Wishlist</button>
                </div>
            </div>
        `;

        // Open detailed view when clicking the card (Netflix-style)
        card.addEventListener('click', () => {
            openGameDetail(game);
        });

        // Wire up action buttons without triggering card click
        const collectionBtn = card.querySelector('[data-action="collection"]');
        const wishlistBtn = card.querySelector('[data-action="wishlist"]');

        if (collectionBtn) {
            collectionBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                addToCollection(game._id);
            });
        }

        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                addToWishlist(game._id);
            });
        }

        return card;
    }
}

// Game Action Functions (Global scope for onclick handlers)
function editGame(gameId) {
    window.location.href = `./update-game.html?id=${gameId}`;
}

async function deleteGame(gameId) {
    if (!confirmAction('Are you sure you want to delete this game?')) {
        return;
    }
    
    try {
        await API.deleteGame(gameId);
        showNotification('Game deleted successfully!', 'success');
        
        // Reload page
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        showNotification(error.message || 'Failed to delete game', 'error');
    }
}

async function addToCollection(gameId) {
    try {
        await API.addToCollection(gameId);
        showNotification('Added to your collection!', 'success');
    } catch (error) {
        showNotification(error.message || 'Failed to add to collection', 'error');
    }
}

async function addToWishlist(gameId) {
    try {
        await API.addToWishlist(gameId);
        showNotification('Added to your wishlist!', 'success');
    } catch (error) {
        showNotification(error.message || 'Failed to add to wishlist', 'error');
    }
}
