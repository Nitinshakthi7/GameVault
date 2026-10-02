import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { listWishlist, moveToLibrary, removeFromWishlist, updateWishlistItem } from '../api/endpoints.js';
import { useAsync } from '../hooks/useAsync.js';
import { useStaggerIn } from '../hooks/useAnime.js';
import { usePageTitle } from '../hooks/useMisc.js';
import { useToast } from '../components/Toast.jsx';
import Cover from '../components/Cover.jsx';
import { ConfirmDialog } from '../components/Modal.jsx';
import ErrorPanel from '../components/ErrorPanel.jsx';
import Pagination from '../components/Pagination.jsx';
import { CardGridSkeleton } from '../components/Skeleton.jsx';
import { PRIORITIES, STATUSES } from '../lib/constants.js';
import { errorText } from '../lib/errors.js';
import { joinList } from '../lib/format.js';

function money(v, currency) {
  if (v == null) return null;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(v);
  } catch {
    return `${v} ${currency || ''}`.trim();
  }
}

function WishlistRow({ entry, onChanged, onRemoved }) {
  const toast = useToast();
  const game = entry.game || {};
  const [priority, setPriority] = useState(entry.priority || 'medium');
  const [target, setTarget] = useState(entry.targetPrice != null ? String(entry.targetPrice) : '');
  const [notes, setNotes] = useState(entry.notes || '');
  const [moveStatus, setMoveStatus] = useState('owned');
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const dirty =
    priority !== (entry.priority || 'medium') ||
    target !== (entry.targetPrice != null ? String(entry.targetPrice) : '') ||
    notes !== (entry.notes || '');

  const save = async () => {
    const body = {};
    if (priority !== (entry.priority || 'medium')) body.priority = priority;
    if (target !== (entry.targetPrice != null ? String(entry.targetPrice) : '')) body.targetPrice = target === '' ? null : Number(target);
    if (notes !== (entry.notes || '')) body.notes = notes;
    setBusy(true);
    try {
      const updated = await updateWishlistItem(entry.id, body);
      onChanged({ ...entry, ...updated, game: updated?.game || entry.game });
      toast.success(`Updated "${game.title}".`);
    } catch (err) {
      toast.error(errorText(err, 'save your changes'));
    } finally {
      setBusy(false);
    }
  };

  const move = async () => {
    setBusy(true);
    try {
      await moveToLibrary(entry.id, { status: moveStatus });
      toast.success(`Moved "${game.title}" to your library.`);
      onRemoved(entry.id);
    } catch (err) {
      toast.error(errorText(err, 'move this game to your library'));
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await removeFromWishlist(entry.id);
      toast.success(`Removed "${game.title}" from your wishlist.`);
      onRemoved(entry.id);
    } catch (err) {
      toast.error(errorText(err, 'remove this game'));
      setBusy(false);
      setConfirmRemove(false);
    }
  };

  const id = `w-${entry.id}`;
  return (
    <div data-stagger>
      <motion.article className="wish-row" whileHover={{ y: -2 }}>
        <div className="wish-cover">
          <Cover src={game.coverImage} title={game.title} genres={game.genres} decorative />
        </div>
        <div className="wish-main">
          <h3>{game.title}</h3>
          <p className="muted">
            {joinList(game.genres, 3) || 'No genres'}
            {entry.desiredPlatform ? ` · ${entry.desiredPlatform}` : ''}
          </p>
          <p className="muted small">
            {entry.currentPrice != null && <>Current {money(entry.currentPrice, entry.currency)} </>}
            {entry.lowestPrice != null && <>· Lowest {money(entry.lowestPrice, entry.currency)}</>}
          </p>
          <div className="wish-fields">
            <div className="field">
              <label htmlFor={`${id}-p`}>Priority</label>
              <select id={`${id}-p`} value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor={`${id}-t`}>Target price</label>
              <input id={`${id}-t`} type="number" min="0" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Optional" />
            </div>
            <div className="field wish-notes">
              <label htmlFor={`${id}-n`}>Notes</label>
              <input id={`${id}-n`} value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} placeholder="Why you want it, where to buy..." />
            </div>
          </div>
          <div className="wish-actions">
            <button type="button" className="btn btn-ghost btn-sm" disabled={!dirty || busy} onClick={save}>Save changes</button>
            <div className="add-lib">
              <label className="sr-only" htmlFor={`${id}-s`}>Status when moved to library</label>
              <select id={`${id}-s`} className="select-sm" value={moveStatus} onChange={(e) => setMoveStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={move}>Move to library</button>
            </div>
            <button type="button" className="btn btn-danger-ghost btn-sm" disabled={busy} onClick={() => setConfirmRemove(true)}>Remove</button>
          </div>
        </div>
      </motion.article>
      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={remove}
        busy={busy}
        title="Remove from wishlist?"
        message={`"${game.title}" will be removed from your wishlist.`}
        confirmLabel="Remove"
      />
    </div>
  );
}

export default function Wishlist() {
  usePageTitle('Wishlist');
  const [sort, setSort] = useState('priority');
  const [page, setPage] = useState(1);
  const { data, error, loading, reload, setData } = useAsync(() => listWishlist({ sort, page, limit: 24 }), [sort, page]);
  const ref = useRef(null);
  useStaggerIn(ref, data?.data?.length ? `${sort}-${page}-${data.data.length}` : null);
  const entries = data?.data || [];
  const meta = data?.meta;

  const replace = (next) => setData((d) => ({ ...d, data: d.data.map((e) => (e.id === next.id ? next : e)) }));
  const removeLocal = (id) => {
    setData((d) => ({ ...d, data: d.data.filter((e) => e.id !== id), meta: d.meta ? { ...d.meta, total: Math.max(0, d.meta.total - 1) } : d.meta }));
  };

  return (
    <div>
      <header className="page-head page-head-row">
        <div>
          <h1>Wishlist</h1>
          <p className="muted">{meta ? `${meta.total} game${meta.total === 1 ? '' : 's'} you are eyeing` : 'Games you want next'}</p>
        </div>
        <div className="field">
          <label htmlFor="wl-sort">Sort by</label>
          <select id="wl-sort" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            <option value="priority">Priority</option>
            <option value="recentlyAdded">Recently added</option>
          </select>
        </div>
      </header>

      <div ref={ref} aria-busy={loading}>
        {error && !data ? (
          <ErrorPanel error={error} onRetry={reload} what="load your wishlist" />
        ) : loading && !data ? (
          <CardGridSkeleton count={4} list />
        ) : entries.length === 0 ? (
          <div className="empty empty-hero">
            <h2>Your wishlist is empty</h2>
            <p>Add games you want to play or buy later.</p>
            <Link to="/search" className="btn btn-primary">Find games</Link>
          </div>
        ) : (
          <div className={`wish-list ${loading ? 'is-loading' : ''}`}>
            {entries.map((e) => <WishlistRow key={e.id} entry={e} onChanged={replace} onRemoved={removeLocal} />)}
          </div>
        )}
        <Pagination page={meta?.page || page} totalPages={meta?.totalPages} total={meta?.total} onChange={setPage} />
      </div>
    </div>
  );
}
