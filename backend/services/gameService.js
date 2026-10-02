const Game = require('../models/Game');
const SearchCache = require('../models/SearchCache');
const UserGame = require('../models/UserGame');
const Wishlist = require('../models/Wishlist');
const AppError = require('../utils/AppError');
const { getProvider } = require('../providers');

const SEARCH_TTL_MS = 24 * 60 * 60 * 1000;
const STALE_MS = 7 * 24 * 60 * 60 * 1000;

async function searchGames(userId, q, page = 1) {
    const provider = getProvider();
    const key = `${provider.name}:${q.trim().toLowerCase()}:${page}`;
    let cached = await SearchCache.findOne({ key, expiresAt: { $gt: new Date() } }).lean();
    if (!cached) {
        const fresh = await provider.search(q.trim(), page); // throws PROVIDER_UNAVAILABLE on failure
        await SearchCache.updateOne(
            { key },
            { $set: { results: fresh, expiresAt: new Date(Date.now() + SEARCH_TTL_MS) } },
            { upsert: true },
        );
        cached = { results: fresh };
    }
    const { results, total, pageSize } = cached.results;

    // Mark which results the user already has.
    const ids = results.map((r) => r.externalId);
    const games = await Game.find({ provider: provider.name, externalId: { $in: ids } }, '_id externalId').lean();
    const byExt = new Map(games.map((g) => [g.externalId, String(g._id)]));
    const gameIds = games.map((g) => g._id);
    const [owned, wished] = gameIds.length
        ? await Promise.all([
            UserGame.find({ user: userId, game: { $in: gameIds } }, 'game').lean(),
            Wishlist.find({ user: userId, game: { $in: gameIds } }, 'game').lean(),
        ])
        : [[], []];
    const ownedBy = new Map(owned.map((u) => [String(u.game), String(u._id)]));
    const wishedSet = new Set(wished.map((w) => String(w.game)));

    const data = results.map((r) => {
        const gid = byExt.get(r.externalId);
        return {
            ...r,
            inLibrary: !!(gid && ownedBy.has(gid)),
            userGameId: gid ? ownedBy.get(gid) : undefined,
            inWishlist: !!(gid && wishedSet.has(gid)),
        };
    });
    return { data, total, pageSize };
}

// Fetch (or refresh) a game's full metadata and persist it.
async function ensureGame(providerName, externalId) {
    const provider = getProvider(providerName);
    const existing = await Game.findOne({ provider: provider.name, externalId: String(externalId) });
    const fresh = existing && existing.lastSyncedAt && Date.now() - existing.lastSyncedAt.getTime() < STALE_MS;
    if (fresh) return existing;

    let details;
    try {
        details = await provider.getDetails(externalId);
    } catch (e) {
        if (existing && e.code === 'PROVIDER_UNAVAILABLE') return existing; // serve stale data
        throw e;
    }
    const doc = existing || new Game({ provider: provider.name, externalId: String(externalId) });
    doc.set({ ...details, lastSyncedAt: new Date() });
    await doc.save();
    return doc;
}

// Accepts { gameId } or { provider, externalId }.
async function resolveGame({ gameId, provider, externalId }) {
    if (gameId) {
        const g = await Game.findById(gameId);
        if (!g) throw AppError.notFound('Game not found');
        return g;
    }
    if (provider && externalId) return ensureGame(provider, externalId);
    throw AppError.badRequest('Provide gameId, or provider and externalId');
}

module.exports = { searchGames, ensureGame, resolveGame };
