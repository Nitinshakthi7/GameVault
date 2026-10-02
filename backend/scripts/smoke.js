// End-to-end smoke test of the PRD "Definition of Done" flow against a running server.
//   BASE_URL=http://localhost:5000 npm run smoke
const BASE = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
let token;
let step = 0;

async function call(method, path, body) {
    const res = await fetch(`${BASE}/api${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: body ? JSON.stringify(body) : undefined,
    });
    const json = res.status === 204 ? null : await res.json().catch(() => null);
    return { status: res.status, body: json };
}

function check(name, cond, extra = '') {
    step += 1;
    if (!cond) {
        console.error(`FAIL ${step}. ${name} ${extra}`);
        process.exit(1);
    }
    console.log(`ok   ${step}. ${name}`);
}

(async () => {
    const health = await call('GET', '/health');
    check('health: db up', health.body?.db === 'up', JSON.stringify(health.body));

    const name = `smoke_${Date.now()}`;
    const reg = await call('POST', '/auth/register', { username: name, email: `${name}@example.com`, password: 'SmokeTest123' });
    check('register', reg.status === 201, JSON.stringify(reg.body));
    token = reg.body.data.token;

    const search = await call('GET', '/games/search?q=' + encodeURIComponent('Cyberpunk 2077'));
    check('search returns results', search.status === 200 && search.body.data.length > 0, JSON.stringify(search.body));
    const hit = search.body.data.find((g) => /cyberpunk/i.test(g.title)) || search.body.data[0];

    const ext = await call('GET', `/games/external/${hit.provider}/${hit.externalId}`);
    const g = ext.body?.data || {};
    check('metadata auto-populated (no manual entry)',
        ext.status === 200 && g.description && g.developers?.length && g.publishers?.length && g.genres?.length
        && g.platforms?.length && g.releaseDate && (hit.provider !== 'rawg' || g.coverImage), JSON.stringify(ext.body).slice(0, 300));

    const add = await call('POST', '/library', { provider: hit.provider, externalId: hit.externalId, status: 'backlog' });
    check('add to library as Backlog', add.status === 201 && add.body.data.status === 'backlog', JSON.stringify(add.body));
    const id = add.body.data.id;
    check('duplicate add -> 409', (await call('POST', '/library', { provider: hit.provider, externalId: hit.externalId })).status === 409);

    const playing = await call('PATCH', `/library/${id}`, { status: 'playing' });
    check('start playing sets startedAt', playing.body.data.startedAt);

    const sess = await call('POST', '/play-sessions', {
        userGameId: id, startedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), durationMinutes: 134,
    });
    check('record play session', sess.status === 201, JSON.stringify(sess.body));
    const detail = await call('GET', `/library/${id}`);
    check('playtime = 134 min', detail.body.data.playtimeMinutes === 134);

    const done = await call('PATCH', `/library/${id}`, { status: 'completed', personalRating: 9 });
    check('mark completed + rate 9', done.body.data.completedAt && done.body.data.personalRating === 9, JSON.stringify(done.body));

    const dash = await call('GET', '/dashboard');
    const d = dash.body.data;
    check('dashboard updated', d.overview.completed === 1 && d.overview.totalPlaytimeMinutes === 134
        && d.recentlyCompleted[0]?.id === id, JSON.stringify(d.overview));

    const an = await call('GET', '/analytics/overview');
    const a = an.body.data;
    check('analytics updated', a.totalMinutes === 134 && a.gamesCompleted === 1 && a.averageRating === 9
        && a.topGenres.length > 0, JSON.stringify(a));

    const lib = await call('GET', '/library?status=completed&sort=playtime');
    check('library filter + sort', lib.body.meta.total === 1);

    check('logout-all', (await call('POST', '/auth/logout-all')).status === 200);
    check('old token rejected', (await call('GET', '/auth/me')).status === 401);

    console.log(`\nAll ${step} smoke checks passed against ${BASE}`);
})().catch((e) => {
    console.error('Smoke test crashed:', e.message);
    process.exit(1);
});
