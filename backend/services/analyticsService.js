const UserGame = require('../models/UserGame');
const Wishlist = require('../models/Wishlist');
const { libraryItem } = require('../utils/serialize');

const DONE = ['completed', 'mastered'];
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

const withGame = (q) => q.populate('game', 'title coverImage backgroundImage releaseDate genres platforms developers externalRating');

async function dashboard(userId) {
    const [byStatus, wishlistCount] = await Promise.all([
        UserGame.aggregate([
            { $match: { user: userId } },
            { $group: { _id: '$status', n: { $sum: 1 }, minutes: { $sum: '$playtimeMinutes' } } },
        ]),
        Wishlist.countDocuments({ user: userId }),
    ]);
    const count = (...s) => byStatus.filter((r) => s.includes(r._id)).reduce((a, r) => a + r.n, 0);
    const overview = {
        total: count(...byStatus.map((r) => r._id)),
        completed: count(...DONE),
        playing: count('playing'),
        backlog: count('backlog'),
        wishlist: wishlistCount,
        totalPlaytimeMinutes: byStatus.reduce((a, r) => a + r.minutes, 0),
    };

    const [continuePlaying, backlogItems, recentlyAdded, recentlyCompleted] = await Promise.all([
        withGame(UserGame.find({ user: userId, status: 'playing' }).sort({ lastPlayedAt: -1, updatedAt: -1 }).limit(6)),
        withGame(UserGame.find({ user: userId, status: 'backlog' }).sort({ createdAt: 1 }).limit(5)),
        withGame(UserGame.find({ user: userId }).sort({ createdAt: -1 }).limit(6)),
        withGame(UserGame.find({ user: userId, status: { $in: DONE } }).sort({ completedAt: -1 }).limit(6)),
    ]);

    return {
        overview,
        continuePlaying: continuePlaying.map(libraryItem),
        backlogSnapshot: { count: overview.backlog, items: backlogItems.map(libraryItem) },
        recentlyAdded: recentlyAdded.map(libraryItem),
        recentlyCompleted: recentlyCompleted.map(libraryItem),
    };
}

function top(map) {
    return [...map.entries()]
        .map(([name, v]) => ({ name, minutes: v.minutes, games: v.games }))
        .sort((a, b) => b.minutes - a.minutes || b.games - a.games || a.name.localeCompare(b.name))
        .slice(0, 5);
}

async function overview(userId) {
    const rows = await UserGame.find({ user: userId }).populate('game', 'genres platforms developers franchises').lean();

    const statusBreakdown = {};
    let totalMinutes = 0;
    let ratingSum = 0;
    let ratedCount = 0;
    let completionDaysSum = 0;
    let completionDaysN = 0;
    const genres = new Map();
    const platforms = new Map();
    const developers = new Map();
    const franchises = new Map();
    const bump = (map, name, minutes) => {
        const cur = map.get(name) || { minutes: 0, games: 0 };
        cur.minutes += minutes;
        cur.games += 1;
        map.set(name, cur);
    };

    rows.forEach((r) => {
        statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
        totalMinutes += r.playtimeMinutes || 0;
        if (r.personalRating) { ratingSum += r.personalRating; ratedCount += 1; }
        if (DONE.includes(r.status) && r.startedAt && r.completedAt) {
            completionDaysSum += Math.max(0, (new Date(r.completedAt) - new Date(r.startedAt)) / 86400000);
            completionDaysN += 1;
        }
        const g = r.game || {};
        const m = r.playtimeMinutes || 0;
        (g.genres || []).forEach((x) => bump(genres, x, m));
        (g.developers || []).forEach((x) => bump(developers, x, m));
        (g.franchises || []).forEach((x) => bump(franchises, x, m));
        if (r.platform) bump(platforms, r.platform, m);
        else (g.platforms || []).slice(0, 1).forEach((x) => bump(platforms, x, m));
    });

    return {
        totalMinutes,
        gamesCompleted: (statusBreakdown.completed || 0) + (statusBreakdown.mastered || 0),
        gamesAbandoned: statusBreakdown.dropped || 0,
        averageRating: ratedCount ? round(ratingSum / ratedCount) : null,
        ratedCount,
        averageCompletionDays: completionDaysN ? round(completionDaysSum / completionDaysN, 1) : null,
        statusBreakdown,
        topGenres: top(genres),
        topPlatforms: top(platforms),
        topDevelopers: top(developers),
        topFranchises: top(franchises),
    };
}

module.exports = { dashboard, overview };
