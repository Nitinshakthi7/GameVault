// Runs the API against a throwaway in-memory MongoDB (no database setup needed).
//   npm run dev:memory     (data is lost when the process stops)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-memory-secret';
process.env.GAME_PROVIDER = process.env.GAME_PROVIDER || 'mock';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const connectDB = require('../config/db');
const createApp = require('../app');

(async () => {
    const mongod = await MongoMemoryServer.create();
    await connectDB(mongod.getUri());
    await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
    const port = Number(process.env.PORT) || 5000;
    createApp().listen(port, () => console.log(`GameVault API (in-memory DB, mock provider) on http://localhost:${port}`));
})();
