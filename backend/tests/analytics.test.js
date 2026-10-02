const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startApp, stopApp, registerUser, addMockGame } = require('./helpers');

let api;
let u;
before(async () => { api = await startApp(); u = await registerUser(api, 'statsuser'); });
after(stopApp);

const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();

test('empty account returns zeroed dashboard and analytics', async () => {
    const d = await api.get('/api/dashboard').set(u.auth);
    assert.equal(d.status, 200);
    assert.deepEqual(d.body.data.overview, { total: 0, completed: 0, playing: 0, backlog: 0, wishlist: 0, totalPlaytimeMinutes: 0 });
    const a = await api.get('/api/analytics/overview').set(u.auth);
    assert.equal(a.body.data.totalMinutes, 0);
    assert.equal(a.body.data.averageRating, null);
});

test('dashboard and analytics reflect the full flow', async () => {
    const cp = await addMockGame(api, u, 'm-cyberpunk-2077', 'backlog');
    await addMockGame(api, u, 'm-hades', 'playing');
    await addMockGame(api, u, 'm-celeste', 'dropped');
    await api.post('/api/wishlist').set(u.auth).send({ provider: 'mock', externalId: 'm-elden-ring' });

    await api.patch(`/api/library/${cp.id}`).set(u.auth).send({ status: 'playing' });
    await api.post('/api/play-sessions').set(u.auth).send({ userGameId: cp.id, startedAt: hoursAgo(3), durationMinutes: 134 });
    await api.patch(`/api/library/${cp.id}`).set(u.auth).send({ status: 'completed', personalRating: 9 });

    const d = (await api.get('/api/dashboard').set(u.auth)).body.data;
    assert.deepEqual(d.overview, { total: 3, completed: 1, playing: 1, backlog: 0, wishlist: 1, totalPlaytimeMinutes: 134 });
    assert.equal(d.recentlyCompleted[0].game.title, 'Cyberpunk 2077');
    assert.equal(d.continuePlaying[0].game.title, 'Hades');
    assert.equal(d.recentlyAdded.length, 3);

    const a = (await api.get('/api/analytics/overview').set(u.auth)).body.data;
    assert.equal(a.totalMinutes, 134);
    assert.equal(a.gamesCompleted, 1);
    assert.equal(a.gamesAbandoned, 1);
    assert.equal(a.averageRating, 9);
    assert.equal(a.ratedCount, 1);
    assert.equal(a.statusBreakdown.dropped, 1);
    assert.equal(a.topGenres[0].minutes, 134);
    assert.ok(['Action', 'RPG'].includes(a.topGenres[0].name));
    assert.equal(a.topDevelopers[0].name, 'CD PROJEKT RED');
    assert.ok(a.averageCompletionDays !== undefined);
});

test('health endpoint', async () => {
    const h = await api.get('/api/health');
    assert.equal(h.body.status, 'ok');
    assert.equal(h.body.db, 'up');
    assert.equal(h.body.provider, 'mock');
});

test('unknown API route returns JSON 404', async () => {
    const r = await api.get('/api/nope');
    assert.equal(r.status, 404);
    assert.equal(r.body.code, 'NOT_FOUND');
});
