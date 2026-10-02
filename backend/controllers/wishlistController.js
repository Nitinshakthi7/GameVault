const Wishlist = require('../models/Wishlist');
const UserGame = require('../models/UserGame');
const AppError = require('../utils/AppError');
const { asyncHandler, created, ok, parsePagination, paginated } = require('../utils/helpers');
const serialize = require('../utils/serialize');
const { resolveGame } = require('../services/gameService');
const lib = require('../services/libraryService');

const PRIORITY_RANK = { high: 3, medium: 2, low: 1 };

exports.list = asyncHandler(async (req, res) => {
    const { sort = 'recentlyAdded' } = req.validQuery;
    const { page, limit, skip } = parsePagination(req.validQuery);
    const filter = { user: req.user._id };
    const total = await Wishlist.countDocuments(filter);
    let rows;
    if (sort === 'priority') {
        // priority is a string enum; rank in memory (wishlists are small)
        const all = await Wishlist.find(filter).populate('game').sort({ createdAt: -1 });
        all.sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]);
        rows = all.slice(skip, skip + limit);
    } else {
        rows = await Wishlist.find(filter).populate('game').sort({ createdAt: -1 }).skip(skip).limit(limit);
    }
    paginated(res, rows.map(serialize.wishlist), page, limit, total);
});

exports.add = asyncHandler(async (req, res) => {
    const game = await resolveGame(req.body);
    if (await UserGame.exists({ user: req.user._id, game: game._id })) {
        throw AppError.conflict('This game is already in your library.');
    }
    if (await Wishlist.exists({ user: req.user._id, game: game._id })) {
        throw AppError.conflict('This game is already on your wishlist.');
    }
    const { desiredPlatform, targetPrice, priority, notes } = req.body;
    const entry = await Wishlist.create({ user: req.user._id, game: game._id, desiredPlatform, targetPrice, priority, notes });
    created(res, serialize.wishlist(await entry.populate('game')), 'Added to wishlist');
});

exports.update = asyncHandler(async (req, res) => {
    const entry = await Wishlist.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { $set: req.body }, { new: true, runValidators: true })
        .populate('game');
    if (!entry) throw AppError.notFound('Wishlist entry not found');
    ok(res, serialize.wishlist(entry));
});

exports.remove = asyncHandler(async (req, res) => {
    const r = await Wishlist.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!r) throw AppError.notFound('Wishlist entry not found');
    res.status(204).end();
});

exports.moveToLibrary = asyncHandler(async (req, res) => {
    const ug = await lib.moveWishlistToLibrary(req.user._id, req.params.id, req.body);
    created(res, serialize.userGame(ug), 'Moved to library');
});
