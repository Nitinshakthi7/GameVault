import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAnalytics } from '../api/endpoints.js';
import { useAsync } from '../hooks/useAsync.js';
import { useBarFill, useStaggerIn } from '../hooks/useAnime.js';
import { usePageTitle } from '../hooks/useMisc.js';
import { CountUp } from '../components/Progress.jsx';
import ErrorPanel from '../components/ErrorPanel.jsx';
import { TilesSkeleton } from '../components/Skeleton.jsx';
import { STATUS_LABELS } from '../lib/constants.js';
import { formatMinutes } from '../lib/format.js';

function BarList({ title, rows, valueLabel, colorFor }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="panel" aria-labelledby={`bl-${title}`} data-stagger>
      <h2 id={`bl-${title}`}>{title}</h2>
      {rows.length === 0 ? (
        <p className="muted">Not enough data yet.</p>
      ) : (
        <ul className="bars">
          {rows.map((r) => (
            <li key={r.name}>
              <div className="bar-head">
                <span className="bar-name">{r.name}</span>
                <span className="bar-val">{valueLabel(r)}</span>
              </div>
              <div className="bar-track" role="img" aria-label={`${r.name}: ${valueLabel(r)}`}>
                <div
                  className="bar-fill"
                  data-bar
                  data-pct={(r.value / max) * 100}
                  style={{ width: `${(r.value / max) * 100}%`, ...(colorFor ? { background: colorFor(r) } : null) }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const toRows = (list = []) => list.map((x) => ({ name: x.name, value: x.minutes, minutes: x.minutes, games: x.games }));
const topLabel = (r) => `${formatMinutes(r.minutes)} · ${r.games} game${r.games === 1 ? '' : 's'}`;

export default function Analytics() {
  usePageTitle('Analytics');
  const { data, error, loading, reload } = useAsync(getAnalytics, []);
  const ref = useRef(null);
  useStaggerIn(ref, data);
  useBarFill(ref, data);

  if (error && !data) return <ErrorPanel error={error} onRetry={reload} what="load your analytics" />;

  const empty = data && data.totalMinutes === 0 && data.gamesCompleted === 0 && Object.values(data.statusBreakdown || {}).every((v) => !v);
  const statusRows = data
    ? Object.entries(data.statusBreakdown || {})
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: STATUS_LABELS[k] || k, key: k, value: v, count: v }))
        .sort((a, b) => b.value - a.value)
    : [];

  return (
    <div ref={ref}>
      <header className="page-head">
        <h1>Analytics</h1>
        <p className="muted">How you play, in numbers.</p>
      </header>

      {loading && !data ? (
        <TilesSkeleton count={5} />
      ) : (
        data && (
          <>
            <div className="stat-grid">
              <div className="stat-tile" data-stagger>
                <span className="stat-label">Total hours</span>
                <CountUp value={data.totalMinutes / 60} format={(v) => `${Math.round(v * 10) / 10}h`} className="stat-value" />
              </div>
              <div className="stat-tile" data-stagger>
                <span className="stat-label">Completed</span>
                <CountUp value={data.gamesCompleted} className="stat-value" />
              </div>
              <div className="stat-tile" data-stagger>
                <span className="stat-label">Abandoned</span>
                <CountUp value={data.gamesAbandoned} className="stat-value" />
              </div>
              <div className="stat-tile" data-stagger>
                <span className="stat-label">Average rating</span>
                {data.ratedCount ? (
                  <>
                    <CountUp value={data.averageRating} format={(v) => `${(Math.round(v * 10) / 10).toFixed(1)}/10`} className="stat-value" />
                    <span className="stat-sub">{data.ratedCount} rated</span>
                  </>
                ) : (
                  <>
                    <span className="stat-value">-</span>
                    <span className="stat-sub">No ratings yet</span>
                  </>
                )}
              </div>
              <div className="stat-tile" data-stagger>
                <span className="stat-label">Avg. days to complete</span>
                {data.averageCompletionDays != null ? (
                  <CountUp value={data.averageCompletionDays} format={(v) => `${Math.round(v * 10) / 10}d`} className="stat-value" />
                ) : (
                  <>
                    <span className="stat-value">-</span>
                    <span className="stat-sub">Needs completed games</span>
                  </>
                )}
              </div>
            </div>

            {empty && (
              <div className="empty" data-stagger>
                <p>Add games and log play sessions to see your stats here.</p>
                <Link to="/search" className="btn btn-primary">Find games</Link>
              </div>
            )}

            <div className="analytics-grid">
              <BarList
                title="Library by status"
                rows={statusRows}
                valueLabel={(r) => `${r.count}`}
                colorFor={(r) => `var(--st-${statusRows.find((s) => s.name === r.name)?.key})`}
              />
              <BarList title="Top genres" rows={toRows(data.topGenres)} valueLabel={topLabel} />
              <BarList title="Top platforms" rows={toRows(data.topPlatforms)} valueLabel={topLabel} />
              <BarList title="Top developers" rows={toRows(data.topDevelopers)} valueLabel={topLabel} />
              <BarList title="Top franchises" rows={toRows(data.topFranchises)} valueLabel={topLabel} />
            </div>
          </>
        )
      )}
    </div>
  );
}
