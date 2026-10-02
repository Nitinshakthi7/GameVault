const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const { loadEnv } = require('./config/env');
const { globalLimiter } = require('./middleware/rateLimiters');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const { getProvider } = require('./providers');

function createApp() {
    const env = loadEnv({ strict: false });
    const app = express();

    app.set('trust proxy', 1); // behind Render/other proxies
    app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
    app.use(cors({ origin: env.corsOrigins, credentials: false }));
    app.use(express.json({ limit: '100kb' }));
    app.use(loggerMiddleware);
    app.use('/api', globalLimiter);

    app.get('/api/health', (req, res) => {
        res.json({
            status: 'ok',
            db: mongoose.connection.readyState === 1 ? 'up' : 'down',
            provider: getProvider().name,
        });
    });

    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/games', require('./routes/gameRoutes'));
    app.use('/api/library', require('./routes/libraryRoutes'));
    app.use('/api/wishlist', require('./routes/wishlistRoutes'));
    app.use('/api/play-sessions', require('./routes/sessionRoutes'));
    app.use('/api', require('./routes/insightRoutes'));

    app.use('/api', (req, res) => {
        res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Route not found' });
    });

    // Single-origin production deploy: serve the built React app.
    const dist = path.join(__dirname, '..', 'frontend', 'dist');
    if (env.serveFrontend && fs.existsSync(dist)) {
        app.use(express.static(dist));
        app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
    } else {
        app.get('/', (req, res) => res.json({ success: true, message: 'GameVault API is running' }));
    }

    app.use(errorMiddleware);
    return app;
}

module.exports = createApp;
