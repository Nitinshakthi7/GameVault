const dotenv = require('dotenv');
dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET'];

function loadEnv({ strict = true } = {}) {
    const missing = required.filter((k) => !process.env[k]);
    if (strict && missing.length) {
        console.error(`Missing required environment variables: ${missing.join(', ')}. See backend/.env.example`);
        process.exit(1);
    }
    return {
        port: Number(process.env.PORT) || 5000,
        nodeEnv: process.env.NODE_ENV || 'development',
        isProd: process.env.NODE_ENV === 'production',
        corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5500')
            .split(',').map((s) => s.trim()).filter(Boolean),
        provider: process.env.GAME_PROVIDER || (process.env.RAWG_API_KEY ? 'rawg' : 'mock'),
        appUrl: process.env.APP_URL || 'http://localhost:5173',
        serveFrontend: process.env.SERVE_FRONTEND === 'true',
    };
}

module.exports = { loadEnv };
