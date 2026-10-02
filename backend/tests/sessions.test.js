const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startApp, stopApp, registerUser, addMockGame } = require('./helpers');

let api;
let u;
let ug;
before(async () => {
    api = await startApp();
    u = await registerUser(api, 'sessuser');
    ug = await addMockGame(api, u, 'm-celeste', 'playing');
});
after(stopApp);

const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();

test('sessions update playtime, count and lastPlayedAt', async () => {
    const a = await api.post('/api/play-sessions').set(u.auth).send({ userGameId: ug.id, startedAt: hoursAgo(5), durationMinutes: 90 });
    assert.equal(a.status, 201);
    const b = await api.post('/api/play-sessions').set(u.auth).send({ userGameId: ug.id, startedAt: hoursAgo(3), endedAt: hoursAgo(2) });
    assert.equal(b.status, 201);
    assert.equal(b.body.data.durationMinutes, 60);

    const detail = await api.get(`/api/library/${ug.id}`).set(u.auth);
    assert.equal(detail.body.data.playtimeMinutes, 150);
    assert.equal(detail.body.data.sessionCount, 2);
    assert.equal(detail.body.data.recentSessions.length, 2);
    assert.ok(detail.body.data.lastPlayedAt);

    const upd = await api.patch(`/api/play-sessions/${a.body.data.id}`).set(u.auth).send({ durationMinutes: 30 });
    assert.equal(upd.status, 200);
    assert.equal((await api.get(`/api/library/${ug.id}`).set(u.auth)).body.data.playtimeMinutes, 90);

    assert.equal((await api.delete(`/api/play-sessions/${b.body.data.id}`).set(u.auth)).status, 204);
    assert.equal((await api.get(`/api/library/${ug.id}`).set(u.auth)).body.data.playtimeMinutes, 30);
});

test('baseMinutes is included in playtime', async () => {
    const r = await api.patch(`/api/library/${ug.id}`).set(u.auth).send({ baseMinutes: 600 });
    assert.equal(r.status, 200);
    assert.equal(r.body.data.playtimeMinutes, 630);
});

test('session validation', async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const send = (body) => api.post('/api/play-sessions').set(u.auth).send({ userGameId: ug.id, ...body });
    assert.equal((await send({ startedAt: future, durationMinutes: 10 })).status, 400);
    assert.equal((await send({ startedAt: hoursAgo(2) })).status, 400);
    assert.equal((await send({ startedAt: hoursAgo(2), endedAt: hoursAgo(3) })).status, 400);
    assert.equal((await send({ startedAt: hoursAgo(2), durationMinutes: 0 })).status, 400);
    assert.equal((await send({ startedAt: 'not a date', durationMinutes: 5 })).status, 400);
});

test('cannot log sessions against another user\'s game', async () => {
    const other = await registerUser(api, 'sessintruder');
    const r = await api.post('/api/play-sessions').set(other.auth).send({ userGameId: ug.id, startedAt: hoursAgo(1), durationMinutes: 10 });
    assert.equal(r.status, 404);
});

test('history listing filters by game', async () => {
    const list = await api.get('/api/play-sessions').query({ userGameId: ug.id }).set(u.auth);
    assert.equal(list.status, 200);
    assert.equal(list.body.meta.total, 1);
    assert.equal(list.body.data[0].game.title, 'Celeste');
});

test('deleting a library entry removes its sessions', async () => {
    await api.delete(`/api/library/${ug.id}`).set(u.auth);
    const list = await api.get('/api/play-sessions').set(u.auth);
    assert.equal(list.body.meta.total, 0);
});
