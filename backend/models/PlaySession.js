const mongoose = require('mongoose');

const playSessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userGame: { type: mongoose.Schema.Types.ObjectId, ref: 'UserGame', required: true },
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    startedAt: { type: Date, required: true },
    endedAt: Date,
    durationMinutes: { type: Number, required: true, min: 1, max: 1440 },
    platform: String,
    notes: { type: String, maxlength: 1000, default: '' },
}, { timestamps: true });

playSessionSchema.index({ user: 1, startedAt: -1 });
playSessionSchema.index({ userGame: 1, startedAt: -1 });

module.exports = mongoose.model('PlaySession', playSessionSchema);
