const mongoose = require('mongoose');

const STATUSES = ['owned', 'backlog', 'playing', 'completed', 'dropped', 'on_hold', 'replay', 'mastered'];
const OWNERSHIP = ['digital', 'physical', 'subscription', 'free', 'borrowed', 'other'];

const userGameSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    status: { type: String, enum: STATUSES, default: 'backlog' },
    statusHistory: [{ _id: false, status: String, at: { type: Date, default: Date.now } }],
    personalRating: { type: Number, min: 1, max: 10, default: null },
    baseMinutes: { type: Number, default: 0, min: 0 },
    playtimeMinutes: { type: Number, default: 0, min: 0 },
    sessionCount: { type: Number, default: 0 },
    lastPlayedAt: Date,
    platform: String,
    ownershipType: { type: String, enum: OWNERSHIP, default: 'digital' },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    startedAt: Date,
    completedAt: Date,
    purchasePrice: { type: Number, min: 0 },
    purchaseCurrency: { type: String, default: 'INR' },
    purchaseDate: Date,
    notes: { type: String, maxlength: 2000, default: '' },
    review: { type: String, maxlength: 5000, default: '' },
}, { timestamps: true });

userGameSchema.index({ user: 1, game: 1 }, { unique: true });
userGameSchema.index({ user: 1, status: 1 });
userGameSchema.index({ user: 1, createdAt: -1 });
userGameSchema.index({ user: 1, lastPlayedAt: -1 });
userGameSchema.index({ user: 1, completedAt: -1 });

module.exports = mongoose.model('UserGame', userGameSchema);
module.exports.STATUSES = STATUSES;
module.exports.OWNERSHIP = OWNERSHIP;
