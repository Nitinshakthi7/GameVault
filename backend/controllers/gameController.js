const Game = require('../models/Game');
const AppError = require('../utils/AppError');
const { asyncHandler, ok, pageMeta } = require('../utils/helpers');
const serialize = require('../utils/serialize');
const gameService = require('../services/gameService');

exports.search = asyncHandler(async (req, res) => {
    const { q, page = 1 } = req.validQuery;
    const { data, total, pageSize } = await gameService.searchGames(req.user._id, q, page);
    res.json({ success: true, data, meta: pageMeta(page, pageSize, total) });
});

exports.external = asyncHandler(async (req, res) => {
    const game = await gameService.ensureGame(req.params.provider, req.params.externalId);
    ok(res, serialize.game(game));
});

exports.getById = asyncHandler(async (req, res) => {
    const game = await Game.findById(req.params.id);
    if (!game) throw AppError.notFound('Game not found');
    ok(res, serialize.game(game));
});
