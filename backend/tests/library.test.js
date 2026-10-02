const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startApp, stopApp, registerUser, addMockGame } = require('./helpers');

let api;
let u;
before(async () => { api = await startApp(); u = await registerUser(api, 'libuser'); });
after(stopApp);

test('search returns metadata, flags library state', async () => {
    const res = await api.get('/api/games/search').query({ q: 'cyberpunk 2077' }).set(u.auth);
    assert.equal(res.status, 200);
    assert.equal(res.body.data[0].title, 'Cyberpunk 2077');
    assert.equal(res.body.data[0].inLibrary, false);
    assert.equal((await api.get('/api/games/search').query({ q: '' }).set(u.auth)).status, 400);
});

test('external details are normalized and persisted', async () => {
    const res = await api.get('/api/games/external/mock/m-cyberpunk-2077').set(u.auth);
    assert.equal(res.status, 200);
    const g = res.body.data;
    assert.ok(g.id);
    assert.deepEqual(g.developers, ['CD PROJEKT RED']);
    assert.ok(g.platformFamilies.includes('PlayStation') && g.platformFamilies.includes('Xbox') && g.platformFamilies.includes('PC'));
    assert.equal(g.releaseYear, 2020);
});

test('add to library, duplicate -> 409, search shows inLibrary', async () => {
    const ug = await addMockGame(api, u, 'm-cyberpunk-2077');
    assert.equal(ug.status, 'backlog');
    const dup = await api.post('/api/library').set(u.auth).send({ provider: 'mock', externalId: 'm-cyberpunk-2077' });
    assert.equal(dup.status, 409);
    assert.equal(dup.body.details.existingId, ug.id);
    const s = await api.get('/api/games/search').query({ q: 'cyberpunk' }).set(u.auth);
    assert.equal(s.body.data[0].inLibrary, true);
    assert.equal(s.body.data[0].userGameId, ug.id);
});

test('status side effects and history', async () => {
    const ug = (await api.get('/api/library').set(u.auth)).body.data[0];
    const playing = await api.patch(`/api/library/${ug.id}`).set(u.auth).send({ status: 'playing' });
    assert.equal(playing.status, 200);
    assert.ok(playing.body.data.startedAt);
    const done = await api.patch(`/api/library/${ug.id}`).set(u.auth).send({ status: 'completed', personalRating: 9 });
    assert.ok(done.body.data.completedAt);
    assert.equal(done.body.data.progress, 100);
    assert.deepEqual(done.body.data.statusHistory.map((h) => h.status), ['backlog', 'playing', 'completed']);
    const bad = await api.patch(`/api/library/${ug.id}`).set(u.auth).send({ personalRating: 11 });
    assert.equal(bad.status, 400);
});

test('filters, sorting and pagination', async () => {
    await addMockGame(api, u, 'm-witcher-3', 'backlog');
    await addMockGame(api, u, 'm-forza-horizon-5', 'owned');
    await addMockGame(api, u, 'm-hades', 'playing');

    const all = await api.get('/api/library').query({ sort: 'title', order: 'asc' }).set(u.auth);
    assert.equal(all.body.meta.total, 4);
    assert.deepEqual(all.body.data.map((i) => i.game.title),
        ['Cyberpunk 2077', 'Forza Horizon 5', 'Hades', 'The Witcher 3: Wild Hunt']);

    const byStatus = await api.get('/api/library').query({ status: 'backlog,playing' }).set(u.auth);
    assert.equal(byStatus.body.meta.total, 2);
    const byGenre = await api.get('/api/library').query({ genre: 'Racing' }).set(u.auth);
    assert.equal(byGenre.body.data[0].game.title, 'Forza Horizon 5');
    const byDev = await api.get('/api/library').query({ developer: 'CD PROJEKT RED' }).set(u.auth);
    assert.equal(byDev.body.meta.total, 2);
    const byYear = await api.get('/api/library').query({ yearFrom: 2020, yearTo: 2021 }).set(u.auth);
    assert.equal(byYear.body.meta.total, 3);
    const byPlatform = await api.get('/api/library').query({ platform: 'Nintendo' }).set(u.auth);
    assert.equal(byPlatform.body.meta.total, 2); // Witcher 3 + Hades
    const byRating = await api.get('/api/library').query({ minRating: 8 }).set(u.auth);
    assert.equal(byRating.body.meta.total, 1);
    const byCompletion = await api.get('/api/library').query({ completion: 'completed' }).set(u.auth);
    assert.equal(byCompletion.body.meta.total, 1);
    const search = await api.get('/api/library').query({ q: 'witch' }).set(u.auth);
    assert.equal(search.body.meta.total, 1);

    const page = await api.get('/api/library').query({ limit: 2, page: 2, sort: 'title', order: 'asc' }).set(u.auth);
    assert.equal(page.body.data.length, 2);
    assert.equal(page.body.meta.totalPages, 2);

    const byRelease = await api.get('/api/library').query({ sort: 'releaseDate', order: 'asc' }).set(u.auth);
    assert.equal(byRelease.body.data[0].game.title, 'The Witcher 3: Wild Hunt');

    const injected = await api.get('/api/library').query('status[$ne]=x').set(u.auth);
    assert.equal(injected.status, 400);

    const facets = await api.get('/api/library/facets').set(u.auth);
    assert.ok(facets.body.data.genres.includes('Racing'));
});

test('users cannot see or modify each other\'s data', async () => {
    const other = await registerUser(api, 'intruder');
    const mine = (await api.get('/api/library').set(u.auth)).body.data[0];
    assert.equal((await api.get(`/api/library/${mine.id}`).set(other.auth)).status, 404);
    assert.equal((await api.patch(`/api/library/${mine.id}`).set(other.auth).send({ notes: 'x' })).status, 404);
    assert.equal((await api.delete(`/api/library/${mine.id}`).set(other.auth)).status, 404);
    assert.equal((await api.get('/api/library').set(other.auth)).body.meta.total, 0);
});

test('wishlist <-> library moves', async () => {
    const w = await api.post('/api/wishlist').set(u.auth).send({ provider: 'mock', externalId: 'm-elden-ring', targetPrice: 1999, priority: 'high' });
    assert.equal(w.status, 201);
    assert.equal((await api.post('/api/wishlist').set(u.auth).send({ provider: 'mock', externalId: 'm-elden-ring' })).status, 409);
    assert.equal((await api.post('/api/wishlist').set(u.auth).send({ provider: 'mock', externalId: 'm-hades' })).status, 409); // already in library

    const list = await api.get('/api/wishlist').query({ sort: 'priority' }).set(u.auth);
    assert.equal(list.body.meta.total, 1);
    const upd = await api.patch(`/api/wishlist/${w.body.data.id}`).set(u.auth).send({ notes: 'on sale?' });
    assert.equal(upd.body.data.notes, 'on sale?');

    const moved = await api.post(`/api/wishlist/${w.body.data.id}/move-to-library`).set(u.auth).send({});
    assert.equal(moved.status, 201);
    assert.equal(moved.body.data.status, 'owned');
    assert.equal((await api.get('/api/wishlist').set(u.auth)).body.meta.total, 0);

    const back = await api.post(`/api/library/${moved.body.data.id}/to-wishlist`).set(u.auth).send({});
    assert.equal(back.status, 201);
    assert.equal((await api.get('/api/wishlist').set(u.auth)).body.meta.total, 1);
    assert.equal((await api.delete(`/api/wishlist/${back.body.data.id}`).set(u.auth)).status, 204);
});

test('delete library entry', async () => {
    const ug = await addMockGame(api, u, 'm-celeste');
    assert.equal((await api.delete(`/api/library/${ug.id}`).set(u.auth)).status, 204);
    assert.equal((await api.get(`/api/library/${ug.id}`).set(u.auth)).status, 404);
});
