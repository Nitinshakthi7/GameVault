process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.GAME_PROVIDER = 'mock';

const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const connectDB = require('../config/db');
const createApp = require('../app');

let mongod;

async function startApp() {
    mongod = await MongoMemoryServer.create();
    await connectDB(mongod.getUri());
    await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
    return request(createApp());
}

async function stopApp() {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
}

let counter = 0;
async function registerUser(api, name) {
    counter += 1;
    const username = name || `user${counter}_${Date.now() % 100000}`;
    const res = await api.post('/api/auth/register').send({
        username, email: `${username}@example.com`, password: 'Password123',
    });
    if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
    return { token: res.body.data.token, user: res.body.data.user, auth: { Authorization: `Bearer ${res.body.data.token}` } };
}

// Add a mock game to a user's library and return the user-game payload.
async function addMockGame(api, u, externalId, status = 'backlog') {
    const res = await api.post('/api/library').set(u.auth).send({ provider: 'mock', externalId, status });
    if (res.status !== 201) throw new Error(`add failed: ${res.status} ${JSON.stringify(res.body)}`);
    return res.body.data;
}

module.exports = { startApp, stopApp, registerUser, addMockGame };
