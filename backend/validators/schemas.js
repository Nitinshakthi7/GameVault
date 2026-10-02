const { z } = require('zod');
const { STATUSES, OWNERSHIP } = require('../models/UserGame');

// ---------- primitives ----------
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const idParams = z.object({ id: objectId });

const optNum = (schema = z.number()) =>
    z.preprocess((v) => (v === undefined || v === '' ? undefined : Number(v)), schema.optional());

const dateField = z.preprocess((v) => {
    if (v === null || v === undefined || v === '') return v === '' ? null : v;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d;
}, z.date().nullable());

const text = (max) => z.string().max(max);
const csv = z.preprocess(
    (v) => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : v),
    z.array(z.string()).optional(),
);

const paging = { page: optNum(z.number().int().min(1)), limit: optNum(z.number().int().min(1).max(100)) };

// ---------- auth ----------
const register = z.object({
    username: z.string().trim().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers and underscores'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});
const login = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email address'), password: z.string().min(1).max(128) });
const forgot = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email address') });
const reset = z.object({ token: z.string().min(10).max(200), password: z.string().min(8, 'Password must be at least 8 characters').max(128) });

// ---------- games ----------
const providerName = z.enum(['rawg', 'mock']);
const searchQuery = z.object({ q: z.string().trim().min(1, 'Enter a game title to search').max(100), page: paging.page });
const externalParams = z.object({ provider: providerName, externalId: z.string().min(1).max(64) });

const gameRef = {
    gameId: objectId.optional(),
    provider: providerName.optional(),
    externalId: z.string().min(1).max(64).optional(),
};
const hasGameRef = (v) => !!v.gameId || (!!v.provider && !!v.externalId);
const refMsg = { message: 'Provide gameId, or provider and externalId' };

// ---------- library ----------
const status = z.enum(STATUSES);
const libraryAdd = z.object({
    ...gameRef,
    status: status.optional(),
    platform: text(50).optional(),
    ownershipType: z.enum(OWNERSHIP).optional(),
}).refine(hasGameRef, refMsg);

const libraryPatch = z.object({
    status: status.optional(),
    personalRating: z.number().int().min(1).max(10).nullable().optional(),
    platform: text(50).optional(),
    ownershipType: z.enum(OWNERSHIP).optional(),
    progress: z.number().min(0).max(100).optional(),
    notes: text(2000).optional(),
    review: text(5000).optional(),
    startedAt: dateField.optional(),
    completedAt: dateField.optional(),
    purchasePrice: z.number().min(0).nullable().optional(),
    purchaseCurrency: text(5).optional(),
    purchaseDate: dateField.optional(),
    baseMinutes: z.number().int().min(0).max(1000000).optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });

const SORTS = ['title', 'releaseDate', 'rating', 'personalRating', 'playtime', 'recentlyAdded', 'recentlyPlayed'];
const libraryQuery = z.object({
    status: csv.pipe(z.array(status).optional()),
    platform: z.string().max(60).optional(),
    genre: z.string().max(60).optional(),
    developer: z.string().max(100).optional(),
    publisher: z.string().max(100).optional(),
    franchise: z.string().max(100).optional(),
    yearFrom: optNum(z.number().int()),
    yearTo: optNum(z.number().int()),
    minRating: optNum(z.number().min(1).max(10)),
    maxRating: optNum(z.number().min(1).max(10)),
    minPlaytime: optNum(z.number().min(0)),
    maxPlaytime: optNum(z.number().min(0)),
    completion: z.enum(['completed', 'in_progress', 'not_started']).optional(),
    ownershipType: z.enum(OWNERSHIP).optional(),
    q: z.string().trim().max(100).optional(),
    sort: z.enum(SORTS).optional(),
    order: z.enum(['asc', 'desc']).optional(),
    ...paging,
});
const toWishlistBody = z.object({ priority: z.enum(['low', 'medium', 'high']).optional() });

// ---------- wishlist ----------
const priority = z.enum(['low', 'medium', 'high']);
const wishlistAdd = z.object({
    ...gameRef,
    desiredPlatform: text(50).optional(),
    targetPrice: z.number().min(0).nullable().optional(),
    priority: priority.optional(),
    notes: text(1000).optional(),
}).refine(hasGameRef, refMsg);
const wishlistPatch = z.object({
    desiredPlatform: text(50).optional(),
    targetPrice: z.number().min(0).nullable().optional(),
    currentPrice: z.number().min(0).nullable().optional(),
    priority: priority.optional(),
    notes: text(1000).optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });
const wishlistQuery = z.object({ sort: z.enum(['priority', 'recentlyAdded']).optional(), ...paging });
const moveToLibraryBody = z.object({
    status: status.optional(), platform: text(50).optional(), ownershipType: z.enum(OWNERSHIP).optional(),
});

// ---------- play sessions ----------
const FUTURE_SKEW_MS = 5 * 60 * 1000;
const notFuture = (d) => d.getTime() <= Date.now() + FUTURE_SKEW_MS;
const startedAt = dateField.pipe(z.date({ message: 'Start time is required' })).refine(notFuture, 'Start time cannot be in the future');

const sessionCreate = z.object({
    userGameId: objectId,
    startedAt,
    endedAt: dateField.optional(),
    durationMinutes: z.number().int().min(1).max(1440).optional(),
    platform: text(50).optional(),
    notes: text(1000).optional(),
}).refine((v) => v.durationMinutes !== undefined || v.endedAt, { message: 'Provide durationMinutes or endedAt', path: ['durationMinutes'] })
    .refine((v) => !v.endedAt || v.endedAt > v.startedAt, { message: 'End time must be after start time', path: ['endedAt'] });

const sessionPatch = z.object({
    startedAt: startedAt.optional(),
    endedAt: dateField.optional(),
    durationMinutes: z.number().int().min(1).max(1440).optional(),
    platform: text(50).optional(),
    notes: text(1000).optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });

const sessionQuery = z.object({
    userGameId: objectId.optional(),
    from: dateField.optional(),
    to: dateField.optional(),
    ...paging,
});

module.exports = {
    idParams, register, login, forgot, reset, searchQuery, externalParams, libraryAdd, libraryPatch, libraryQuery,
    toWishlistBody, wishlistAdd, wishlistPatch, wishlistQuery, moveToLibraryBody, sessionCreate, sessionPatch, sessionQuery,
};
