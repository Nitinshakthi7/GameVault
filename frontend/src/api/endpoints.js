// One function per API endpoint. Single resources resolve to `data`;
// list endpoints resolve to `{ data, meta }`.
import { get, post, patch, del } from './client.js';

const data = (r) => r.data;
const list = (r) => ({ data: r.data || [], meta: r.meta || null });
const enc = encodeURIComponent;

// Health
export const getHealth = () => get('/health', { auth: false }).then((r) => r.data ?? r);

// Auth
export const register = (body) => post('/auth/register', body, { auth: false }).then(data);
export const login = (body) => post('/auth/login', body, { auth: false }).then(data);
export const logout = () => post('/auth/logout');
export const logoutAll = () => post('/auth/logout-all');
export const getMe = () => get('/auth/me').then(data);
export const forgotPassword = (email) => post('/auth/forgot-password', { email }, { auth: false }).then((r) => r.data ?? r);
export const resetPassword = (body) => post('/auth/reset-password', body, { auth: false });

// Games
export const searchGames = (params, opts) => get('/games/search', { params, ...opts }).then(list);
export const getExternalGame = (provider, externalId) =>
  get(`/games/external/${enc(provider)}/${enc(externalId)}`).then(data);
export const getGame = (id) => get(`/games/${enc(id)}`).then(data);

// Library
export const listLibrary = (params) => get('/library', { params }).then(list);
export const getLibraryFacets = () => get('/library/facets').then(data);
export const addToLibrary = (body) => post('/library', body).then(data);
export const getLibraryItem = (id) => get(`/library/${enc(id)}`).then(data);
export const updateLibraryItem = (id, body) => patch(`/library/${enc(id)}`, body).then(data);
export const removeFromLibrary = (id) => del(`/library/${enc(id)}`);
export const moveToWishlist = (id, body = {}) => post(`/library/${enc(id)}/to-wishlist`, body).then(data);

// Wishlist
export const listWishlist = (params) => get('/wishlist', { params }).then(list);
export const addToWishlist = (body) => post('/wishlist', body).then(data);
export const updateWishlistItem = (id, body) => patch(`/wishlist/${enc(id)}`, body).then(data);
export const removeFromWishlist = (id) => del(`/wishlist/${enc(id)}`);
export const moveToLibrary = (id, body = {}) => post(`/wishlist/${enc(id)}/move-to-library`, body).then(data);

// Play sessions
export const listSessions = (params) => get('/play-sessions', { params }).then(list);
export const createSession = (body) => post('/play-sessions', body).then(data);
export const updateSession = (id, body) => patch(`/play-sessions/${enc(id)}`, body).then(data);
export const deleteSession = (id) => del(`/play-sessions/${enc(id)}`);

// Dashboard & analytics
export const getDashboard = () => get('/dashboard').then(data);
export const getAnalytics = () => get('/analytics/overview').then(data);
