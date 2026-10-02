const PlaySession = require('../models/PlaySession');
const UserGame = require('../models/UserGame');
const AppError = require('../utils/AppError');
const { asyncHandler, created, ok, parsePagination, paginated } = require('../utils/helpers');
const serialize = require('../utils/serialize');
const { recomputePlaytime } = require('../services/sessionService');

const minutesBetween = (a, b) => Math.max(1, Math.round((b - a) / 60000));

exports.list = asyncHandler(async (req, res) => {
    const { userGameId, from, to } = req.validQuery;
    const { page, limit, skip } = parsePagination(req.validQuery, 30);
    const filter = { user: req.user._id };
    if (userGameId) filter.userGame = userGameId;
    if (from || to) {
        filter.startedAt = {};
        if (from) filter.startedAt.$gte = from;
        if (to) filter.startedAt.$lte = to;
    }
    const [total, rows] = await Promise.all([
        PlaySession.countDocuments(filter),
        PlaySession.find(filter).populate('game', 'title coverImage').sort({ startedAt: -1 }).skip(skip).limit(limit),
    ]);
    paginated(res, rows.map(serialize.session), page, limit, total);
});

exports.create = asyncHandler(async (req, res) => {
    const { userGameId, startedAt, endedAt, platform, notes } = req.body;
    const ug = await UserGame.findOne({ _id: userGameId, user: req.user._id });
    if (!ug) throw AppError.notFound('Library entry not found');
    const durationMinutes = req.body.durationMinutes ?? minutesBetween(startedAt, endedAt);
    const s = await PlaySession.create({
        user: req.user._id, userGame: ug._id, game: ug.game,
        startedAt, endedAt, durationMinutes, platform: platform || ug.platform, notes,
    });
    await recomputePlaytime(ug._id);
    created(res, serialize.session(s), 'Play session recorded');
});

exports.update = asyncHandler(async (req, res) => {
    const s = await PlaySession.findOne({ _id: req.params.id, user: req.user._id });
    if (!s) throw AppError.notFound('Play session not found');
    const b = req.body;
    ['startedAt', 'endedAt', 'platform', 'notes'].forEach((k) => { if (b[k] !== undefined) s[k] = b[k]; });
    if (b.durationMinutes !== undefined) s.durationMinutes = b.durationMinutes;
    else if (s.endedAt && (b.startedAt !== undefined || b.endedAt !== undefined)) {
        s.durationMinutes = minutesBetween(s.startedAt, s.endedAt);
    }
    if (s.endedAt && s.endedAt <= s.startedAt) throw AppError.badRequest('End time must be after start time');
    await s.save();
    await recomputePlaytime(s.userGame);
    ok(res, serialize.session(s));
});

exports.remove = asyncHandler(async (req, res) => {
    const s = await PlaySession.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!s) throw AppError.notFound('Play session not found');
    await recomputePlaytime(s.userGame);
    res.status(204).end();
});
