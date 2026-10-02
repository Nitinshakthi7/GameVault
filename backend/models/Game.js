const mongoose = require('mongoose');

// One global record per game; users relate to it through UserGame / Wishlist.
const gameSchema = new mongoose.Schema({
    provider: { type: String, required: true, enum: ['rawg', 'mock', 'legacy'] },
    externalId: { type: String, required: true },
    externalUrl: String,
    slug: String,
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    releaseDate: Date,
    releaseYear: Number,
    developers: [String],
    publishers: [String],
    genres: [String],
    tags: [String],
    platforms: [String],
    platformFamilies: [String],
    franchises: [String],
    coverImage: String,
    backgroundImage: String,
    screenshots: [String],
    externalRating: { type: Number, min: 0, max: 5 },
    metacritic: Number,
    website: String,
    lastSyncedAt: Date,
}, { timestamps: true });

gameSchema.index({ provider: 1, externalId: 1 }, { unique: true });
gameSchema.index({ slug: 1 });
gameSchema.index({ title: 'text' });
gameSchema.index({ genres: 1 });
gameSchema.index({ platformFamilies: 1 });
gameSchema.index({ developers: 1 });

gameSchema.pre('save', function setYear(next) {
    if (this.releaseDate) this.releaseYear = this.releaseDate.getUTCFullYear();
    next();
});

module.exports = mongoose.model('Game', gameSchema);
