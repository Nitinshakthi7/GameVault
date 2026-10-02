// Normalization layer: provider payload -> GameVault Game shape.

const stripHtml = (s = '') => String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

function platformFamily(name = '') {
    const n = name.toLowerCase();
    if (n.includes('playstation') || n.includes('ps vita') || n.includes('psp')) return 'PlayStation';
    if (n.includes('xbox')) return 'Xbox';
    if (n.includes('nintendo') || n.includes('switch') || n.includes('wii') || n.includes('game boy') || n.includes('3ds') || n.includes('ds')) return 'Nintendo';
    if (n === 'pc' || n.includes('windows') || n.includes('linux') || n.includes('macos') || n.includes('mac')) return 'PC';
    if (n.includes('ios') || n.includes('android')) return 'Mobile';
    return 'Other';
}

const families = (platforms) => [...new Set(platforms.map(platformFamily))];

function normalizeRawgCard(r) {
    const platforms = (r.platforms || []).map((p) => p.platform?.name).filter(Boolean);
    return {
        provider: 'rawg',
        externalId: String(r.id),
        title: r.name,
        releaseDate: r.released || null,
        coverImage: r.background_image || null,
        platforms,
        genres: (r.genres || []).map((g) => g.name),
        externalRating: typeof r.rating === 'number' ? r.rating : null,
    };
}

function normalizeRawgDetails(d, { screenshots = [] } = {}) {
    const platforms = (d.platforms || []).map((p) => p.platform?.name).filter(Boolean);
    return {
        provider: 'rawg',
        externalId: String(d.id),
        externalUrl: `https://rawg.io/games/${d.slug}`,
        slug: d.slug,
        title: d.name,
        description: stripHtml(d.description_raw || d.description || ''),
        releaseDate: d.released ? new Date(d.released) : undefined,
        developers: (d.developers || []).map((x) => x.name),
        publishers: (d.publishers || []).map((x) => x.name),
        genres: (d.genres || []).map((g) => g.name),
        tags: (d.tags || []).filter((t) => t.language === 'eng' || !t.language).slice(0, 15).map((t) => t.name),
        platforms,
        platformFamilies: families(platforms),
        franchises: d._franchise ? [d._franchise] : [],
        coverImage: d.background_image || undefined,
        backgroundImage: d.background_image_additional || d.background_image || undefined,
        screenshots: screenshots.slice(0, 8),
        externalRating: typeof d.rating === 'number' ? d.rating : undefined,
        metacritic: d.metacritic || undefined,
        website: d.website || undefined,
    };
}

// Mock fixtures are already close to our shape; fill derived fields.
function normalizeMock(g) {
    const platforms = g.platforms || [];
    return {
        provider: 'mock',
        externalId: String(g.externalId),
        externalUrl: g.externalUrl,
        slug: g.slug,
        title: g.title,
        description: g.description || '',
        releaseDate: g.releaseDate ? new Date(g.releaseDate) : undefined,
        developers: g.developers || [],
        publishers: g.publishers || [],
        genres: g.genres || [],
        tags: g.tags || [],
        platforms,
        platformFamilies: families(platforms),
        franchises: g.franchises || [],
        coverImage: g.coverImage || undefined,
        backgroundImage: g.backgroundImage || undefined,
        screenshots: g.screenshots || [],
        externalRating: g.externalRating,
        metacritic: g.metacritic,
        website: g.website,
    };
}

module.exports = { stripHtml, platformFamily, families, normalizeRawgCard, normalizeRawgDetails, normalizeMock };
