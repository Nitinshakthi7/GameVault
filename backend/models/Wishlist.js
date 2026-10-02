const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    desiredPlatform: String,
    targetPrice: { type: Number, min: 0, default: null },
    currentPrice: { type: Number, min: 0, default: null },
    lowestPrice: { type: Number, min: 0, default: null },
    currency: { type: String, default: 'INR' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    notes: { type: String, maxlength: 1000, default: '' },
}, { timestamps: true });

wishlistSchema.index({ user: 1, game: 1 }, { unique: true });
wishlistSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);
