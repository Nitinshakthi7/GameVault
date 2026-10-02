const mongoose = require('mongoose');
const PlaySession = require('../models/PlaySession');
const UserGame = require('../models/UserGame');

// playtimeMinutes = baseMinutes (hours entered manually) + sum of recorded sessions.
async function recomputePlaytime(userGameId) {
    const ug = await UserGame.findById(userGameId);
    if (!ug) return null;
    const [agg] = await PlaySession.aggregate([
        { $match: { userGame: new mongoose.Types.ObjectId(String(userGameId)) } },
        { $group: { _id: null, minutes: { $sum: '$durationMinutes' }, count: { $sum: 1 }, last: { $max: '$startedAt' } } },
    ]);
    ug.sessionCount = agg ? agg.count : 0;
    ug.playtimeMinutes = (ug.baseMinutes || 0) + (agg ? agg.minutes : 0);
    ug.lastPlayedAt = agg ? agg.last : undefined;
    await ug.save();
    return ug;
}

module.exports = { recomputePlaytime };
