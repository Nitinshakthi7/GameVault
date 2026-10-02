const { loadEnv } = require('./config/env');
const connectDB = require('./config/db');
const createApp = require('./app');

async function main() {
    const env = loadEnv();
    try {
        await connectDB();
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
    createApp().listen(env.port, () => {
        console.log(`GameVault API listening on http://localhost:${env.port} (provider: ${env.provider})`);
    });
}

main();
