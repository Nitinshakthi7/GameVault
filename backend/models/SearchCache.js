const mongoose = require('mongoose');

const searchCacheSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    results: mongoose.Schema.Types.Mixed,
    expiresAt: { type: Date, required: true },
});
searchCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SearchCache', searchCacheSchema);
