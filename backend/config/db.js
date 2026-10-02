const mongoose = require('mongoose');

// NOTE: all user input is validated with zod into primitives before it reaches a query,
// so operator injection ({"$gt": ""}) is rejected at the validation layer.
async function connectDB(uri = process.env.MONGODB_URI) {
    await mongoose.connect(uri);
    if (process.env.NODE_ENV !== 'test') console.log('Connected to MongoDB');
}

module.exports = connectDB;
