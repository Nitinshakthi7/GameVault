// Convert Mongoose docs / aggregation rows into API shapes (id instead of _id).
const idOf = (v) => (v && v._id ? String(v._id) : v ? String(v) : v);
const plain = (d) => (d && d.toObject ? d.toObject() : d);
const isPopulated = (g) => g && typeof g === 'object' && g.title !== undefined;

const game = (g) => {
    if (!g) return null;
    const { _id, __v, lastSyncedAt, createdAt, updatedAt, ...rest } = plain(g);
    return { id: String(_id), ...rest };
};

const gameCard = (g) => g && ({
    id: idOf(g), title: g.title, coverImage: g.coverImage, backgroundImage: g.backgroundImage,
    releaseDate: g.releaseDate, genres: g.genres || [], platforms: g.platforms || [],
    developers: g.developers || [], externalRating: g.externalRating,
});

const userGame = (ug, { fullGame = false } = {}) => {
    const o = plain(ug);
    const out = {
        id: String(o._id), status: o.status, statusHistory: o.statusHistory, personalRating: o.personalRating ?? null,
        baseMinutes: o.baseMinutes, playtimeMinutes: o.playtimeMinutes, sessionCount: o.sessionCount,
        lastPlayedAt: o.lastPlayedAt, platform: o.platform, ownershipType: o.ownershipType, progress: o.progress,
        startedAt: o.startedAt, completedAt: o.completedAt, purchasePrice: o.purchasePrice,
        purchaseCurrency: o.purchaseCurrency, purchaseDate: o.purchaseDate, notes: o.notes, review: o.review,
        createdAt: o.createdAt,
    };
    out.game = isPopulated(o.game) ? (fullGame ? game(o.game) : gameCard(o.game)) : idOf(o.game);
    return out;
};

const libraryItem = (ug) => {
    const o = userGame(ug);
    ['statusHistory', 'notes', 'review', 'baseMinutes', 'purchasePrice', 'purchaseCurrency',
        'purchaseDate', 'startedAt', 'sessionCount'].forEach((k) => delete o[k]);
    return o;
};

const wishlist = (w) => {
    const o = plain(w);
    return {
        id: String(o._id), desiredPlatform: o.desiredPlatform, targetPrice: o.targetPrice, currentPrice: o.currentPrice,
        lowestPrice: o.lowestPrice, currency: o.currency, priority: o.priority, notes: o.notes, createdAt: o.createdAt,
        game: isPopulated(o.game) ? gameCard(o.game) : idOf(o.game),
    };
};

const session = (s) => {
    const o = plain(s);
    return {
        id: String(o._id), userGameId: idOf(o.userGame), startedAt: o.startedAt, endedAt: o.endedAt,
        durationMinutes: o.durationMinutes, platform: o.platform, notes: o.notes,
        game: isPopulated(o.game) ? { id: idOf(o.game), title: o.game.title, coverImage: o.game.coverImage } : undefined,
    };
};

const user = (u) => ({ id: String(u._id), username: u.username, email: u.email, createdAt: u.createdAt });

module.exports = { game, gameCard, userGame, libraryItem, wishlist, session, user };
