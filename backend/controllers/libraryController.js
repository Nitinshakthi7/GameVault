const UserGame = require('../models/UserGame');
const PlaySession = require('../models/PlaySession');
const AppError = require('../utils/AppError');
const { asyncHandler, ok, created, parsePagination, paginated } = require('../utils/helpers');
const serialize = require('../utils/serialize');
const lib = require('../services/libraryService');

exports.list = asyncHandler(async (req, res) => {
    const filters = req.validQuery;
    const { page, limit, skip } = parsePagination(filters);
    const { items, total } = await lib.queryLibrary(req.user._id, filters, { skip, limit });
    paginated(res, items.map(serialize.libraryItem), page, limit, total);
});

exports.facets = asyncHandler(async (req, res) => ok(res, await lib.libraryFacets(req.user._id)));

exports.add = asyncHandler(async (req, res) => {
    const ug = await lib.addToLibrary(req.user._id, req.body);
    created(res, serialize.userGame(ug), 'Added to library');
});

exports.get = asyncHandler(async (req, res) => {
    const ug = await UserGame.findOne({ _id: req.params.id, user: req.user._id }).populate('game');
    if (!ug) throw AppError.notFound('Library entry not found');
    const sessions = await PlaySession.find({ userGame: ug._id }).sort({ startedAt: -1 }).limit(20);
    const data = serialize.userGame(ug, { fullGame: true });
    data.recentSessions = sessions.map(serialize.session);
    data.stats = { sessionCount: ug.sessionCount, totalMinutes: ug.playtimeMinutes };
    ok(res, data);
});

exports.update = asyncHandler(async (req, res) => {
    const ug = await lib.updateUserGame(req.user._id, req.params.id, req.body);
    ok(res, serialize.userGame(ug, { fullGame: true }));
});

exports.remove = asyncHandler(async (req, res) => {
    await lib.removeFromLibrary(req.user._id, req.params.id);
    res.status(204).end();
});

exports.toWishlist = asyncHandler(async (req, res) => {
    const entry = await lib.moveToWishlist(req.user._id, req.params.id, req.body);
    created(res, serialize.wishlist(entry), 'Moved to wishlist');
});
