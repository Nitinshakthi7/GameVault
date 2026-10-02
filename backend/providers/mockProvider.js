const fixtures = require('./fixtures/mockGames.json');
const AppError = require('../utils/AppError');
const { normalizeMock } = require('./normalize');

// Offline provider for tests, the smoke script and development without an API key.
module.exports = {
    name: 'mock',
    async search(q, page = 1) {
        const terms = String(q).toLowerCase().split(/\s+/).filter(Boolean);
        const matches = fixtures.filter((g) => terms.every((t) => g.title.toLowerCase().includes(t)));
        const pageSize = 20;
        const slice = matches.slice((page - 1) * pageSize, page * pageSize);
        return {
            results: slice.map((g) => {
                const n = normalizeMock(g);
                return {
                    provider: 'mock', externalId: n.externalId, title: n.title,
                    releaseDate: g.releaseDate || null, coverImage: n.coverImage || null,
                    platforms: n.platforms, genres: n.genres, externalRating: n.externalRating ?? null,
                };
            }),
            total: matches.length,
            pageSize,
        };
    },
    async getDetails(externalId) {
        const g = fixtures.find((x) => String(x.externalId) === String(externalId));
        if (!g) throw AppError.notFound('Game not found in the external database.');
        return normalizeMock(g);
    },
};
