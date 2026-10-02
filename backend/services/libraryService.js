const mongoose = require('mongoose');
const UserGame = require('../models/UserGame');
const Wishlist = require('../models/Wishlist');
const PlaySession = require('../models/PlaySession');
const AppError = require('../utils/AppError');
const { resolveGame } = require('./gameService');
const { recomputePlaytime } = require('./sessionService');

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function addToLibrary(userId, input) {
    const game = await resolveGame(input);
    const existing = await UserGame.findOne({ user: userId, game: game._id });
    if (existing) throw AppError.conflict('This game is already in your library.', { existingId: String(existing._id) });

    const status = input.status || 'backlog';
    const now = new Date();
    const ug = await UserGame.create({
        user: userId,
        game: game._id,
        status,
        statusHistory: [{ status, at: now }],
        platform: input.platform,
        ownershipType: input.ownershipType || 'digital',
        ...(status === 'playing' && { startedAt: now }),
        ...(['completed', 'mastered'].includes(status) && { completedAt: now, progress: 100 }),
    });
    await Wishlist.deleteOne({ user: userId, game: game._id });
    return ug.populate('game');
}

async function updateUserGame(userId, id, patch) {
    const ug = await UserGame.findOne({ _id: id, user: userId });
    if (!ug) throw AppError.notFound('Library entry not found');

    if (patch.status && patch.status !== ug.status) {
        ug.status = patch.status;
        ug.statusHistory.push({ status: patch.status, at: new Date() });
        if (patch.status === 'playing' && !ug.startedAt && patch.startedAt === undefined) ug.startedAt = new Date();
        if (['completed', 'mastered'].includes(patch.status)) {
            if (!ug.completedAt && patch.completedAt === undefined) ug.completedAt = new Date();
            if (patch.progress === undefined) ug.progress = 100;
        }
    }
    const direct = ['personalRating', 'platform', 'ownershipType', 'progress', 'notes', 'review', 'startedAt',
        'completedAt', 'purchasePrice', 'purchaseCurrency', 'purchaseDate'];
    direct.forEach((k) => { if (patch[k] !== undefined) ug[k] = patch[k]; });

    if (patch.baseMinutes !== undefined) {
        ug.baseMinutes = patch.baseMinutes;
        await ug.save();
        await recomputePlaytime(ug._id);
    } else {
        await ug.save();
    }
    return UserGame.findById(ug._id).populate('game');
}

async function removeFromLibrary(userId, id) {
    const ug = await UserGame.findOneAndDelete({ _id: id, user: userId });
    if (!ug) throw AppError.notFound('Library entry not found');
    await PlaySession.deleteMany({ userGame: ug._id });
}

async function moveToWishlist(userId, id, { priority } = {}) {
    const ug = await UserGame.findOne({ _id: id, user: userId });
    if (!ug) throw AppError.notFound('Library entry not found');
    const entry = await Wishlist.findOneAndUpdate(
        { user: userId, game: ug.game },
        { $setOnInsert: { user: userId, game: ug.game, priority: priority || 'medium' } },
        { upsert: true, new: true },
    );
    await removeFromLibrary(userId, id);
    return entry.populate('game');
}

async function moveWishlistToLibrary(userId, wishlistId, opts = {}) {
    const w = await Wishlist.findOne({ _id: wishlistId, user: userId });
    if (!w) throw AppError.notFound('Wishlist entry not found');
    return addToLibrary(userId, {
        gameId: String(w.game),
        status: opts.status || 'owned',
        platform: opts.platform || w.desiredPlatform,
        ownershipType: opts.ownershipType,
    });
}

const SORTS = {
    title: 'game.title', releaseDate: 'game.releaseDate', rating: 'game.externalRating',
    personalRating: 'personalRating', playtime: 'playtimeMinutes',
    recentlyAdded: 'createdAt', recentlyPlayed: 'lastPlayedAt',
};

function buildLibraryPipeline(userId, f) {
    const own = { user: oid(userId) };
    if (f.status?.length) own.status = { $in: f.status };
    if (f.ownershipType) own.ownershipType = f.ownershipType;
    if (f.minRating !== undefined || f.maxRating !== undefined) {
        own.personalRating = {};
        if (f.minRating !== undefined) own.personalRating.$gte = f.minRating;
        if (f.maxRating !== undefined) own.personalRating.$lte = f.maxRating;
    }
    if (f.minPlaytime !== undefined || f.maxPlaytime !== undefined) {
        own.playtimeMinutes = {};
        if (f.minPlaytime !== undefined) own.playtimeMinutes.$gte = f.minPlaytime;
        if (f.maxPlaytime !== undefined) own.playtimeMinutes.$lte = f.maxPlaytime;
    }
    const and = [];
    if (f.completion === 'completed') and.push({ status: { $in: ['completed', 'mastered'] } });
    if (f.completion === 'in_progress') {
        and.push({ status: { $nin: ['completed', 'mastered'] } }, { $or: [{ status: 'playing' }, { playtimeMinutes: { $gt: 0 } }] });
    }
    if (f.completion === 'not_started') {
        and.push({ status: { $nin: ['completed', 'mastered'] } }, { playtimeMinutes: 0 }, { status: { $ne: 'playing' } });
    }
    if (and.length) own.$and = and;

    const game = {};
    const gameAnd = [];
    if (f.platform) gameAnd.push({ $or: [{ 'game.platforms': f.platform }, { 'game.platformFamilies': f.platform }, { platform: f.platform }] });
    if (f.genre) game['game.genres'] = f.genre;
    if (f.developer) game['game.developers'] = f.developer;
    if (f.publisher) game['game.publishers'] = f.publisher;
    if (f.franchise) game['game.franchises'] = f.franchise;
    if (f.yearFrom !== undefined || f.yearTo !== undefined) {
        game['game.releaseYear'] = {};
        if (f.yearFrom !== undefined) game['game.releaseYear'].$gte = f.yearFrom;
        if (f.yearTo !== undefined) game['game.releaseYear'].$lte = f.yearTo;
    }
    if (f.q) game['game.title'] = { $regex: escapeRegex(f.q), $options: 'i' };
    if (gameAnd.length) game.$and = gameAnd;

    const sortField = SORTS[f.sort || 'recentlyAdded'];
    const dir = (f.order || (['title'].includes(f.sort) ? 'asc' : 'desc')) === 'asc' ? 1 : -1;

    return [
        { $match: own },
        { $lookup: { from: 'games', localField: 'game', foreignField: '_id', as: 'game' } },
        { $unwind: '$game' },
        ...(Object.keys(game).length ? [{ $match: game }] : []),
        { $sort: { [sortField]: dir, _id: 1 } },
    ];
}

async function queryLibrary(userId, filters, { skip, limit }) {
    const base = buildLibraryPipeline(userId, filters);
    const [out] = await UserGame.aggregate([
        ...base,
        { $facet: { items: [{ $skip: skip }, { $limit: limit }], total: [{ $count: 'n' }] } },
    ]).collation({ locale: 'en', strength: 2 });
    return { items: out.items, total: out.total[0]?.n || 0 };
}

async function libraryFacets(userId) {
    const rows = await UserGame.find({ user: userId })
        .populate('game', 'genres platforms developers publishers franchises releaseYear').lean();
    const sets = { genres: new Set(), platforms: new Set(), developers: new Set(), publishers: new Set(), franchises: new Set(), years: new Set() };
    rows.forEach((r) => {
        const g = r.game || {};
        (g.genres || []).forEach((x) => sets.genres.add(x));
        (g.platforms || []).forEach((x) => sets.platforms.add(x));
        (g.developers || []).forEach((x) => sets.developers.add(x));
        (g.publishers || []).forEach((x) => sets.publishers.add(x));
        (g.franchises || []).forEach((x) => sets.franchises.add(x));
        if (g.releaseYear) sets.years.add(g.releaseYear);
    });
    const sorted = (s) => [...s].sort((a, b) => String(a).localeCompare(String(b)));
    return {
        genres: sorted(sets.genres), platforms: sorted(sets.platforms), developers: sorted(sets.developers),
        publishers: sorted(sets.publishers), franchises: sorted(sets.franchises),
        years: [...sets.years].sort((a, b) => b - a),
    };
}

module.exports = {
    addToLibrary, updateUserGame, removeFromLibrary, moveToWishlist, moveWishlistToLibrary,
    queryLibrary, libraryFacets,
};
