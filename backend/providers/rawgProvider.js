const AppError = require('../utils/AppError');
const { normalizeRawgCard, normalizeRawgDetails } = require('./normalize');

const BASE = 'https://api.rawg.io/api';
const TIMEOUT_MS = 8000;

async function rawgFetch(path, params = {}) {
    const key = process.env.RAWG_API_KEY;
    if (!key) throw AppError.provider('The game database is not configured (missing RAWG_API_KEY).');
    const url = new URL(BASE + path);
    url.searchParams.set('key', key);
    Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, v));
    let res;
    try {
        res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (e) {
        throw AppError.provider('The external game database did not respond.');
    }
    if (res.status === 404) throw AppError.notFound('Game not found in the external database.');
    if (!res.ok) throw AppError.provider(`The external game database returned an error (${res.status}).`);
    return res.json();
}

module.exports = {
    name: 'rawg',
    async search(q, page = 1) {
        const data = await rawgFetch('/games', { search: q, page, page_size: 20, search_precise: true });
        return { results: (data.results || []).map(normalizeRawgCard), total: data.count || 0, pageSize: 20 };
    },
    async getDetails(externalId) {
        const d = await rawgFetch(`/games/${encodeURIComponent(externalId)}`);
        // Optional extras - never fail the request if these error.
        const [series, shots] = await Promise.all([
            rawgFetch(`/games/${encodeURIComponent(externalId)}/game-series`, { page_size: 1 }).catch(() => null),
            rawgFetch(`/games/${encodeURIComponent(externalId)}/screenshots`).catch(() => null),
        ]);
        // RAWG has no franchise field; approximate from the series' shared title prefix when present.
        if (series && series.count > 0 && series.results?.[0]) {
            const a = d.name.toLowerCase();
            const b = series.results[0].name.toLowerCase();
            let i = 0;
            while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
            const prefix = d.name.slice(0, i).replace(/[\s:\-–]+$/, '').trim();
            if (prefix.length >= 4) d._franchise = prefix;
        }
        return normalizeRawgDetails(d, { screenshots: (shots?.results || []).map((s) => s.image) });
    },
};
