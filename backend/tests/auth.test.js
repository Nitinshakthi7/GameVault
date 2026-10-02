const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startApp, stopApp, registerUser } = require('./helpers');

let api;
before(async () => { api = await startApp(); });
after(stopApp);

test('register logs the user in and /me works', async () => {
    const u = await registerUser(api, 'alice');
    const me = await api.get('/api/auth/me').set(u.auth);
    assert.equal(me.status, 200);
    assert.equal(me.body.data.username, 'alice');
    assert.equal(me.body.data.password, undefined);
});

test('register validates input and rejects duplicates', async () => {
    const bad = await api.post('/api/auth/register').send({ username: 'ab', email: 'nope', password: 'short' });
    assert.equal(bad.status, 400);
    assert.equal(bad.body.code, 'VALIDATION_ERROR');
    const dup = await api.post('/api/auth/register').send({ username: 'alice', email: 'alice@example.com', password: 'Password123' });
    assert.equal(dup.status, 409);
    assert.equal(dup.body.code, 'CONFLICT');
});

test('accepts long TLDs in emails', async () => {
    const res = await api.post('/api/auth/register').send({ username: 'longtld', email: 'a@site.photography', password: 'Password123' });
    assert.equal(res.status, 201);
});

test('login succeeds and fails with a generic message', async () => {
    const ok = await api.post('/api/auth/login').send({ email: 'alice@example.com', password: 'Password123' });
    assert.equal(ok.status, 200);
    assert.ok(ok.body.data.token);
    const bad = await api.post('/api/auth/login').send({ email: 'alice@example.com', password: 'wrongpass1' });
    assert.equal(bad.status, 401);
    assert.equal(bad.body.message, 'Invalid email or password');
});

test('NoSQL operator injection in login is rejected', async () => {
    const res = await api.post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    assert.equal(res.status, 400);
});

test('protected routes require a valid token', async () => {
    assert.equal((await api.get('/api/library')).status, 401);
    assert.equal((await api.get('/api/library').set('Authorization', 'Bearer junk')).status, 401);
});

test('logout-all invalidates existing tokens', async () => {
    const u = await registerUser(api);
    assert.equal((await api.post('/api/auth/logout-all').set(u.auth)).status, 200);
    assert.equal((await api.get('/api/auth/me').set(u.auth)).status, 401);
});

test('password reset flow', async () => {
    const u = await registerUser(api, 'resetme');
    const unknown = await api.post('/api/auth/forgot-password').send({ email: 'ghost@example.com' });
    assert.equal(unknown.status, 200);
    const f = await api.post('/api/auth/forgot-password').send({ email: 'resetme@example.com' });
    assert.equal(f.status, 200);
    assert.equal(f.body.message, unknown.body.message);
    const token = new URL(f.body.data.resetUrl).searchParams.get('token');

    const r = await api.post('/api/auth/reset-password').send({ token, password: 'NewPassword456' });
    assert.equal(r.status, 200);
    // old token invalidated, token single-use, new password works
    assert.equal((await api.get('/api/auth/me').set(u.auth)).status, 401);
    assert.equal((await api.post('/api/auth/reset-password').send({ token, password: 'Another789' })).status, 400);
    assert.equal((await api.post('/api/auth/login').send({ email: 'resetme@example.com', password: 'NewPassword456' })).status, 200);
});
