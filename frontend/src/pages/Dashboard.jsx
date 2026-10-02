import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api/endpoints.js';
import { useAsync } from '../hooks/useAsync.js';
import { useStaggerIn } from '../hooks/useAnime.js';
import { usePageTitle } from '../hooks/useMisc.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CountUp } from '../components/Progress.jsx';
import GameCard from '../components/GameCard.jsx';
import ErrorPanel from '../components/ErrorPanel.jsx';
import { CardGridSkeleton, TilesSkeleton } from '../components/Skeleton.jsx';
import { formatMinutes } from '../lib/format.js';

function Section({ title, action, children }) {
  return (
    <section className="section" aria-label={title}>
      <div className="section-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ text, cta = 'Find games to add', to = '/search' }) {
  return (
    <div className="empty">
      <p>{text}</p>
      <Link to={to} className="btn btn-ghost">{cta}</Link>
    </div>
  );
}

export default function Dashboard() {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(getDashboard, []);
  const ref = useRef(null);
  useStaggerIn(ref, data);

  if (error && !data) return <ErrorPanel error={error} onRetry={reload} what="load your dashboard" />;

  const o = data?.overview;
  const tiles = o
    ? [
        { label: 'Total games', value: o.total, to: '/library' },
        { label: 'Completed', value: o.completed, to: '/library?status=completed' },
        { label: 'Playing', value: o.playing, to: '/library?status=playing' },
        { label: 'Backlog', value: o.backlog, to: '/library?status=backlog' },
        { label: 'Wishlist', value: o.wishlist, to: '/wishlist' },
      ]
    : [];
  const totalLibrary = o ? o.total : 0;

  return (
    <div ref={ref}>
      <header className="page-head">
        <h1>Welcome back{user ? `, ${user.username}` : ''}</h1>
        <p className="muted">Here is where your library stands.</p>
      </header>

      {loading && !data ? (
        <>
          <TilesSkeleton />
          <CardGridSkeleton count={6} />
        </>
      ) : (
        data && (
          <>
            <div className="stat-grid">
              {tiles.map((t) => (
                <Link to={t.to} key={t.label} className="stat-tile" data-stagger>
                  <span className="stat-label">{t.label}</span>
                  <CountUp value={t.value} className="stat-value" />
                </Link>
              ))}
              <div className="stat-tile" data-stagger>
                <span className="stat-label">Total playtime</span>
                <CountUp value={o.totalPlaytimeMinutes} format={(v) => formatMinutes(v)} className="stat-value" />
              </div>
            </div>

            {totalLibrary === 0 && (
              <div className="empty empty-hero" data-stagger>
                <h2>Your vault is empty</h2>
                <p>Search for a game and add it to start tracking.</p>
                <Link to="/search" className="btn btn-primary">Search games</Link>
              </div>
            )}

            <Section title="Continue playing">
              {data.continuePlaying?.length ? (
                <div className="wide-grid">
                  {data.continuePlaying.map((it) => <GameCard key={it.id} item={it} variant="wide" />)}
                </div>
              ) : (
                <Empty text="Nothing in progress. Start a game from your backlog or find a new one." />
              )}
            </Section>

            <Section
              title={`Backlog snapshot${data.backlogSnapshot?.count ? ` (${data.backlogSnapshot.count})` : ''}`}
              action={data.backlogSnapshot?.count > 0 && <Link to="/library?status=backlog">View all</Link>}
            >
              {data.backlogSnapshot?.items?.length ? (
                <div className="game-list">
                  {data.backlogSnapshot.items.map((it) => <GameCard key={it.id} item={it} variant="list" />)}
                </div>
              ) : (
                <Empty text="Your backlog is clear." cta="Add something new" />
              )}
            </Section>

            <Section title="Recently added">
              {data.recentlyAdded?.length ? (
                <div className="game-grid">
                  {data.recentlyAdded.map((it) => <GameCard key={it.id} item={it} />)}
                </div>
              ) : (
                <Empty text="No games added yet." />
              )}
            </Section>

            <Section title="Recently completed">
              {data.recentlyCompleted?.length ? (
                <div className="game-grid">
                  {data.recentlyCompleted.map((it) => <GameCard key={it.id} item={it} />)}
                </div>
              ) : (
                <Empty text="Finish a game and it will show up here." cta="Browse your library" to="/library" />
              )}
            </Section>
          </>
        )
      )}
    </div>
  );
}
