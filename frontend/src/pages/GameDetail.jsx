import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  createSession,
  deleteSession,
  getLibraryItem,
  moveToWishlist,
  removeFromLibrary,
  updateLibraryItem,
  updateSession,
} from '../api/endpoints.js';
import { useAsync } from '../hooks/useAsync.js';
import { usePageTitle } from '../hooks/useMisc.js';
import { useToast } from '../components/Toast.jsx';
import Cover from '../components/Cover.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import StarRating from '../components/StarRating.jsx';
import { ProgressRing } from '../components/Progress.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';
import ErrorPanel from '../components/ErrorPanel.jsx';
import { PageSkeleton } from '../components/Skeleton.jsx';
import { OWNERSHIP_TYPES, STATUSES } from '../lib/constants.js';
import { errorText } from '../lib/errors.js';
import {
  formatDate,
  formatDateTime,
  formatMinutes,
  fromLocalInput,
  stripHtml,
  timeAgo,
  toDateInput,
  toLocalInput,
} from '../lib/format.js';

function SessionForm({ initial, platforms, onSubmit, onCancel, submitLabel, idPrefix }) {
  const [startedAt, setStartedAt] = useState(toLocalInput(initial?.startedAt));
  const [mode, setMode] = useState('duration');
  const [duration, setDuration] = useState(initial?.durationMinutes ? String(initial.durationMinutes) : '60');
  const [endedAt, setEndedAt] = useState(initial?.endedAt ? toLocalInput(initial.endedAt) : '');
  const [platform, setPlatform] = useState(initial?.platform || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const start = fromLocalInput(startedAt);
    if (!start) return setError('Enter when the session started.');
    const body = { startedAt: start };
    if (mode === 'duration') {
      const d = Math.round(Number(duration));
      if (!d || d < 1) return setError('Duration must be at least 1 minute.');
      body.durationMinutes = d;
    } else {
      const end = fromLocalInput(endedAt);
      if (!end) return setError('Enter when the session ended.');
      if (new Date(end) <= new Date(start)) return setError('The end time must be after the start time.');
      body.endedAt = end;
    }
    if (platform) body.platform = platform;
    if (notes.trim() || initial?.notes) body.notes = notes.trim();
    setBusy(true);
    try {
      await onSubmit(body);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="session-form" noValidate>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="field">
        <label htmlFor={`${idPrefix}-start`}>Started</label>
        <input id={`${idPrefix}-start`} type="datetime-local" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} required />
      </div>
      <fieldset className="field-group">
        <legend>Length</legend>
        <div className="seg">
          <label className="check"><input type="radio" name={`${idPrefix}-mode`} checked={mode === 'duration'} onChange={() => setMode('duration')} /><span>Duration</span></label>
          <label className="check"><input type="radio" name={`${idPrefix}-mode`} checked={mode === 'end'} onChange={() => setMode('end')} /><span>End time</span></label>
        </div>
        {mode === 'duration' ? (
          <div className="field">
            <label htmlFor={`${idPrefix}-dur`}>Duration (minutes)</label>
            <input id={`${idPrefix}-dur`} type="number" min="1" step="1" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
        ) : (
          <div className="field">
            <label htmlFor={`${idPrefix}-end`}>Ended</label>
            <input id={`${idPrefix}-end`} type="datetime-local" value={endedAt} onChange={(e) => setEndedAt(e.target.value)} />
          </div>
        )}
      </fieldset>
      <div className="field">
        <label htmlFor={`${idPrefix}-plat`}>Platform</label>
        <select id={`${idPrefix}-plat`} value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="">Not specified</option>
          {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-notes`}>Notes</label>
        <textarea id={`${idPrefix}-notes`} rows={2} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="form-actions">
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : submitLabel}</button>
      </div>
    </form>
  );
}

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: item, error, loading, reload, setData } = useAsync(() => getLibraryItem(id), [id]);
  const game = item?.game;
  usePageTitle(game?.title || 'Game');

  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState('');
  const [review, setReview] = useState('');
  const [purchase, setPurchase] = useState({ price: '', currency: '', date: '', base: '' });
  const [confirm, setConfirm] = useState(null); // 'remove' | 'wishlist' | { session }
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  // Sync each editable draft only when its own server value changes, so unsaved edits elsewhere survive.
  useEffect(() => setProgress(item?.progress ?? 0), [item?.progress]);
  useEffect(() => setNotes(item?.notes || ''), [item?.notes]);
  useEffect(() => setReview(item?.review || ''), [item?.review]);
  useEffect(() => {
    if (!item) return;
    setPurchase({
      price: item.purchasePrice != null ? String(item.purchasePrice) : '',
      currency: item.purchaseCurrency || '',
      date: toDateInput(item.purchaseDate),
      base: item.baseMinutes ? String(Math.round((item.baseMinutes / 60) * 10) / 10) : '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.purchasePrice, item?.purchaseCurrency, item?.purchaseDate, item?.baseMinutes]);

  if (error && !item) return <ErrorPanel error={error} onRetry={reload} what="load this game" />;
  if (!item || !game) return loading ? <PageSkeleton /> : null;

  const save = async (changes, success = 'Saved.') => {
    try {
      const updated = await updateLibraryItem(id, changes);
      setData((d) => ({
        ...d,
        ...updated,
        game: updated?.game ? { ...d.game, ...updated.game } : d.game,
        recentSessions: updated?.recentSessions ?? d.recentSessions,
        stats: updated?.stats ?? d.stats,
      }));
      if (success) toast.success(success);
      return true;
    } catch (err) {
      toast.error(errorText(err, 'save your changes'));
      return false;
    }
  };

  const onStatusChange = (value) => {
    if (value === 'wishlist') setConfirm('wishlist');
    else if (value !== item.status) save({ status: value }, `Status set to ${STATUSES.find((s) => s.value === value)?.label}.`);
  };

  const commitProgress = () => {
    if (progress !== (item.progress ?? 0)) save({ progress }, `Progress set to ${progress}%.`);
  };

  const dirtyText = notes !== (item.notes || '') || review !== (item.review || '');
  const saveText = () => {
    const body = {};
    if (notes !== (item.notes || '')) body.notes = notes;
    if (review !== (item.review || '')) body.review = review;
    return save(body, 'Notes saved.');
  };

  const savePurchase = () => {
    const body = {};
    const cur = {
      price: item.purchasePrice != null ? String(item.purchasePrice) : '',
      currency: item.purchaseCurrency || '',
      date: toDateInput(item.purchaseDate),
      base: item.baseMinutes ? String(Math.round((item.baseMinutes / 60) * 10) / 10) : '',
    };
    if (purchase.price !== cur.price) body.purchasePrice = purchase.price === '' ? null : Number(purchase.price);
    if (purchase.currency !== cur.currency) body.purchaseCurrency = purchase.currency ? purchase.currency.toUpperCase() : null;
    if (purchase.date !== cur.date) body.purchaseDate = purchase.date ? new Date(`${purchase.date}T00:00:00Z`).toISOString() : null;
    if (purchase.base !== cur.base) body.baseMinutes = purchase.base === '' ? 0 : Math.round(Number(purchase.base) * 60);
    if (!Object.keys(body).length) return toast.info('Nothing to save.');
    return save(body, 'Details saved.');
  };

  const platforms = Array.from(new Set([...(game.platforms || []), ...(item.platform ? [item.platform] : [])]));

  const handleCreateSession = async (body) => {
    try {
      await createSession({ userGameId: id, ...body });
      toast.success('Play session logged.');
      reload();
    } catch (err) {
      toast.error(errorText(err, 'log that session'));
    }
  };
  const handleUpdateSession = async (body) => {
    try {
      await updateSession(editing.id, body);
      toast.success('Session updated.');
      setEditing(null);
      reload();
    } catch (err) {
      toast.error(errorText(err, 'update that session'));
    }
  };
  const handleDeleteSession = async () => {
    setBusy(true);
    try {
      await deleteSession(confirm.session.id);
      toast.success('Session deleted.');
      setConfirm(null);
      reload();
    } catch (err) {
      toast.error(errorText(err, 'delete that session'));
    } finally {
      setBusy(false);
    }
  };
  const handleRemove = async () => {
    setBusy(true);
    try {
      await removeFromLibrary(id);
      toast.success(`Removed "${game.title}" from your library.`);
      navigate('/library', { replace: true });
    } catch (err) {
      toast.error(errorText(err, 'remove this game'));
      setBusy(false);
    }
  };
  const handleToWishlist = async () => {
    setBusy(true);
    try {
      await moveToWishlist(id);
      toast.success(`Moved "${game.title}" to your wishlist.`);
      navigate('/wishlist', { replace: true });
    } catch (err) {
      toast.error(errorText(err, 'move this game to your wishlist'));
      setBusy(false);
    }
  };

  const description = stripHtml(game.description);
  const sessions = item.recentSessions || [];

  return (
    <article className="detail">
      <nav aria-label="Breadcrumb" className="breadcrumb"><Link to="/library">&larr; Library</Link></nav>

      <section className="detail-hero" aria-labelledby="game-title">
        <div className="detail-hero-bg" aria-hidden="true">
          <Cover src={game.backgroundImage || game.coverImage} title={game.title} genres={game.genres} ratio="auto" decorative />
        </div>
        <div className="detail-hero-inner">
          <motion.div className="detail-cover" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <Cover src={game.coverImage || game.backgroundImage} title={game.title} genres={game.genres} />
          </motion.div>
          <div className="detail-head">
            <StatusBadge status={item.status} />
            <h1 id="game-title">{game.title}</h1>
            <dl className="meta-list">
              {game.developers?.length > 0 && (<><dt>Developer</dt><dd>{game.developers.join(', ')}</dd></>)}
              {game.publishers?.length > 0 && (<><dt>Publisher</dt><dd>{game.publishers.join(', ')}</dd></>)}
              {game.genres?.length > 0 && (<><dt>Genres</dt><dd>{game.genres.join(', ')}</dd></>)}
              {game.platforms?.length > 0 && (<><dt>Platforms</dt><dd>{game.platforms.join(', ')}</dd></>)}
              {game.releaseDate && (<><dt>Released</dt><dd>{formatDate(game.releaseDate)}</dd></>)}
              {game.externalRating ? (<><dt>Community rating</dt><dd>{Number(game.externalRating).toFixed(1)} / 5{game.metacritic ? ` · Metacritic ${game.metacritic}` : ''}</dd></>) : null}
            </dl>
            <p className="muted small">
              {game.externalUrl ? <>Data from <a href={game.externalUrl} target="_blank" rel="noopener noreferrer">RAWG</a></> : null}
              {game.website ? <> · <a href={game.website} target="_blank" rel="noopener noreferrer">Official site</a></> : null}
            </p>
          </div>
        </div>
      </section>

      <div className="detail-grid">
        <section className="panel" aria-labelledby="track-h">
          <h2 id="track-h">Your progress</h2>
          <div className="field">
            <label htmlFor="d-status">Status</label>
            <select id="d-status" value={item.status} onChange={(e) => onStatusChange(e.target.value)}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              <option value="wishlist">Wishlist (move out of library)</option>
            </select>
          </div>

          <div className="progress-row">
            <ProgressRing value={progress} size={92} label={`${progress}% complete`} />
            <div className="field grow">
              <label htmlFor="d-progress">Progress: {progress}%</label>
              <input
                id="d-progress"
                type="range"
                min="0"
                max="100"
                step="1"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                onPointerUp={commitProgress}
                onKeyUp={commitProgress}
                onBlur={commitProgress}
              />
            </div>
          </div>

          <StarRating value={item.personalRating} onChange={(v) => save({ personalRating: v }, v == null ? 'Rating cleared.' : `Rated ${v}/10.`)} />

          <div className="two-col">
            <div className="field">
              <label htmlFor="d-platform">Platform</label>
              <select id="d-platform" value={item.platform || ''} onChange={(e) => e.target.value && save({ platform: e.target.value }, 'Platform updated.')}>
                {!item.platform && <option value="">Not set</option>}
                {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="d-own">Ownership</label>
              <select id="d-own" value={item.ownershipType || ''} onChange={(e) => e.target.value && save({ ownershipType: e.target.value }, 'Ownership updated.')}>
                {!item.ownershipType && <option value="">Not set</option>}
                {OWNERSHIP_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <dl className="stat-list">
            <div><dt>Playtime</dt><dd>{formatMinutes(item.playtimeMinutes)}</dd></div>
            <div><dt>Sessions</dt><dd>{item.stats?.sessionCount ?? item.sessionCount ?? 0}</dd></div>
            <div><dt>Last played</dt><dd>{item.lastPlayedAt ? timeAgo(item.lastPlayedAt) : 'Never'}</dd></div>
            {item.startedAt && <div><dt>Started</dt><dd>{formatDate(item.startedAt)}</dd></div>}
            {item.completedAt && <div><dt>Completed</dt><dd>{formatDate(item.completedAt)}</dd></div>}
            <div><dt>Added</dt><dd>{formatDate(item.createdAt)}</dd></div>
          </dl>
        </section>

        <section className="panel" aria-labelledby="notes-h">
          <h2 id="notes-h">Notes &amp; review</h2>
          <div className="field">
            <label htmlFor="d-notes">Private notes</label>
            <textarea id="d-notes" rows={4} maxLength={5000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tips, to-dos, where you left off..." />
          </div>
          <div className="field">
            <label htmlFor="d-review">Review</label>
            <textarea id="d-review" rows={5} maxLength={5000} value={review} onChange={(e) => setReview(e.target.value)} placeholder="What did you think?" />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-primary" disabled={!dirtyText} onClick={saveText}>Save notes</button>
          </div>

          <h2 className="panel-sub">Purchase &amp; tracking</h2>
          <div className="two-col">
            <div className="field">
              <label htmlFor="d-price">Price paid</label>
              <input id="d-price" type="number" min="0" step="0.01" value={purchase.price} onChange={(e) => setPurchase({ ...purchase, price: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="d-cur">Currency</label>
              <input id="d-cur" maxLength={3} placeholder="USD" value={purchase.currency} onChange={(e) => setPurchase({ ...purchase, currency: e.target.value.toUpperCase() })} />
            </div>
            <div className="field">
              <label htmlFor="d-date">Purchase date</label>
              <input id="d-date" type="date" value={purchase.date} onChange={(e) => setPurchase({ ...purchase, date: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="d-base">Hours played before tracking</label>
              <input id="d-base" type="number" min="0" step="0.5" value={purchase.base} onChange={(e) => setPurchase({ ...purchase, base: e.target.value })} />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={savePurchase}>Save details</button>
          </div>
        </section>
      </div>

      <section className="panel" aria-labelledby="sessions-h">
        <h2 id="sessions-h">Play sessions</h2>
        <div className="sessions-grid">
          <div>
            <h3>Log a session</h3>
            <SessionForm idPrefix="new" platforms={platforms} submitLabel="Log session" onSubmit={handleCreateSession} />
          </div>
          <div>
            <h3>History</h3>
            {sessions.length === 0 ? (
              <p className="muted">No sessions yet. Log your first one.</p>
            ) : (
              <ol className="timeline">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <div className="timeline-main">
                      <strong>{formatMinutes(s.durationMinutes)}</strong>
                      <span className="muted"> on {formatDateTime(s.startedAt)}{s.platform ? ` · ${s.platform}` : ''}</span>
                      {s.notes && <p className="timeline-notes">{s.notes}</p>}
                    </div>
                    <div className="timeline-actions">
                      <button type="button" className="btn btn-link" onClick={() => setEditing(s)} aria-label={`Edit session from ${formatDateTime(s.startedAt)}`}>Edit</button>
                      <button type="button" className="btn btn-link btn-link-danger" onClick={() => setConfirm({ session: s })} aria-label={`Delete session from ${formatDateTime(s.startedAt)}`}>Delete</button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>

      {description && (
        <section className="panel" aria-labelledby="about-h">
          <h2 id="about-h">About</h2>
          <p className="preview-desc">{description}</p>
        </section>
      )}

      <div className="danger-zone">
        <button type="button" className="btn btn-danger-ghost" onClick={() => setConfirm('remove')}>Remove from library</button>
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit play session">
        {editing && (
          <SessionForm idPrefix="edit" initial={editing} platforms={platforms} submitLabel="Save changes" onCancel={() => setEditing(null)} onSubmit={handleUpdateSession} />
        )}
      </Modal>
      <ConfirmDialog
        open={confirm === 'remove'}
        onClose={() => setConfirm(null)}
        onConfirm={handleRemove}
        busy={busy}
        title="Remove from library?"
        message={`"${game.title}" and all of its play sessions, notes and rating will be deleted. This cannot be undone.`}
        confirmLabel="Remove game"
      />
      <ConfirmDialog
        open={confirm === 'wishlist'}
        onClose={() => setConfirm(null)}
        onConfirm={handleToWishlist}
        busy={busy}
        danger={false}
        title="Move to wishlist?"
        message={`"${game.title}" will leave your library and move to your wishlist. Its play history is removed.`}
        confirmLabel="Move to wishlist"
      />
      <ConfirmDialog
        open={Boolean(confirm?.session)}
        onClose={() => setConfirm(null)}
        onConfirm={handleDeleteSession}
        busy={busy}
        title="Delete this session?"
        message="Your total playtime will be recalculated."
        confirmLabel="Delete session"
      />
    </article>
  );
}
