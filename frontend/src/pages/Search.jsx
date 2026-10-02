import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { addToLibrary, addToWishlist, getExternalGame, searchGames } from '../api/endpoints.js';
import { useAsync } from '../hooks/useAsync.js';
import { useStaggerIn } from '../hooks/useAnime.js';
import { useDebounce, usePageTitle } from '../hooks/useMisc.js';
import { useToast } from '../components/Toast.jsx';
import Cover from '../components/Cover.jsx';
import Modal from '../components/Modal.jsx';
import ErrorPanel from '../components/ErrorPanel.jsx';
import Pagination from '../components/Pagination.jsx';
import { CardGridSkeleton, Skeleton } from '../components/Skeleton.jsx';
import { STATUSES, STATUS_LABELS } from '../lib/constants.js';
import { describeError } from '../lib/errors.js';
import { formatDate, joinList, releaseYear, stripHtml } from '../lib/format.js';

/** Add-to-library (with status) and add-to-wishlist actions; reports changes through onUpdated. */
function AddActions({ result, onUpdated }) {
  const toast = useToast();
  const [status, setStatus] = useState('backlog');
  const [busy, setBusy] = useState(null);
  const ref = { provider: result.provider, externalId: result.externalId };

  const addLib = async () => {
    setBusy('lib');
    try {
      const created = await addToLibrary({ ...ref, status });
      onUpdated({ inLibrary: true, userGameId: created?.id, inWishlist: false });
      toast.success(`Added "${result.title}" to your library as ${STATUS_LABELS[status]}.`);
    } catch (err) {
      if (err.code === 'CONFLICT') {
        onUpdated({ inLibrary: true, userGameId: err.details?.existingId });
        toast.info(`"${result.title}" is already in your library.`);
      } else {
        toast.error(describeError(err, { what: `add "${result.title}" to your library` }).message);
      }
    } finally {
      setBusy(null);
    }
  };

  const addWish = async () => {
    setBusy('wish');
    try {
      await addToWishlist(ref);
      onUpdated({ inWishlist: true });
      toast.success(`Added "${result.title}" to your wishlist.`);
    } catch (err) {
      if (err.code === 'CONFLICT') {
        onUpdated({ inWishlist: true });
        toast.info(`"${result.title}" is already in your library or wishlist.`);
      } else {
        toast.error(describeError(err, { what: `add "${result.title}" to your wishlist` }).message);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="add-actions">
      {result.inLibrary ? (
        result.userGameId ? (
          <Link to={`/library/${result.userGameId}`} className="badge badge-in-library">In library</Link>
        ) : (
          <span className="badge badge-in-library">In library</span>
        )
      ) : (
        <div className="add-lib">
          <label className="sr-only" htmlFor={`st-${result.provider}-${result.externalId}`}>Status for {result.title}</label>
          <select
            id={`st-${result.provider}-${result.externalId}`}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="select-sm"
          >
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button type="button" className="btn btn-primary btn-sm" onClick={addLib} disabled={busy !== null}>
            {busy === 'lib' ? 'Adding...' : 'Add to Library'}
          </button>
        </div>
      )}
      {result.inWishlist ? (
        <span className="badge badge-wishlist">In wishlist</span>
      ) : (
        !result.inLibrary && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={addWish} disabled={busy !== null}>
            {busy === 'wish' ? 'Adding...' : 'Add to Wishlist'}
          </button>
        )
      )}
    </div>
  );
}

function ResultCard({ result, onOpen, onUpdated }) {
  const year = releaseYear(result.releaseDate);
  return (
    <div data-stagger>
      <motion.article className="search-card" whileHover={{ y: -5 }}>
        <button type="button" className="search-card-open" onClick={() => onOpen(result)} aria-label={`View details for ${result.title}`}>
          <Cover src={result.coverImage} title={result.title} genres={result.genres} decorative />
          <div className="game-card-body">
            <h3>{result.title}</h3>
            <p className="muted">
              {year || 'TBA'}
              {result.externalRating ? ` · ${Number(result.externalRating).toFixed(1)}/5` : ''}
            </p>
            <p className="muted small">{joinList(result.platforms, 3)}</p>
          </div>
        </button>
        <AddActions result={result} onUpdated={(patch) => onUpdated(result, patch)} />
      </motion.article>
    </div>
  );
}

function PreviewModal({ open, result, onClose, onUpdated }) {
  const { data: game, error, loading, reload } = useAsync(
    () => getExternalGame(result.provider, result.externalId),
    [result.provider, result.externalId],
  );
  const g = game || null;
  const description = g ? stripHtml(g.description) : '';
  const hero = g?.backgroundImage || result.coverImage;

  return (
    <Modal open={open} onClose={onClose} title={result.title} size="lg">
      <div className="preview">
        <div className="preview-hero">
          <Cover src={hero} title={result.title} genres={result.genres} ratio="16 / 7" decorative />
        </div>
        {loading && !g && (
          <div className="preview-loading" role="status" aria-label="Loading game details">
            <Skeleton w="90%" /> <Skeleton w="80%" /> <Skeleton w="60%" />
          </div>
        )}
        {error && <ErrorPanel error={error} onRetry={reload} what="load the game details" compact />}
        {g && (
          <>
            <dl className="meta-list">
              {g.releaseDate && (<><dt>Released</dt><dd>{formatDate(g.releaseDate)}</dd></>)}
              {g.developers?.length > 0 && (<><dt>Developers</dt><dd>{g.developers.join(', ')}</dd></>)}
              {g.publishers?.length > 0 && (<><dt>Publishers</dt><dd>{g.publishers.join(', ')}</dd></>)}
              {g.genres?.length > 0 && (<><dt>Genres</dt><dd>{g.genres.join(', ')}</dd></>)}
              {g.platforms?.length > 0 && (<><dt>Platforms</dt><dd>{g.platforms.join(', ')}</dd></>)}
              {g.externalRating ? (<><dt>Rating</dt><dd>{Number(g.externalRating).toFixed(1)} / 5{g.metacritic ? ` · Metacritic ${g.metacritic}` : ''}</dd></>) : null}
            </dl>
            {description && <p className="preview-desc">{description}</p>}
            {g.screenshots?.length > 0 && (
              <ul className="shots" aria-label="Screenshots">
                {g.screenshots.slice(0, 4).map((s, i) => (
                  <li key={s}><Cover src={s} title={`${g.title} screenshot ${i + 1}`} ratio="16 / 9" /></li>
                ))}
              </ul>
            )}
          </>
        )}
        <div className="preview-footer">
          <AddActions result={result} onUpdated={(patch) => onUpdated(result, patch)} />
          <p className="small muted">
            Data from{' '}
            {g?.externalUrl ? <a href={g.externalUrl} target="_blank" rel="noopener noreferrer">RAWG</a> : <a href="https://rawg.io" target="_blank" rel="noopener noreferrer">RAWG</a>}
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default function Search() {
  usePageTitle('Search');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [selectedKey, setSelectedKey] = useState(null);
  const debounced = useDebounce(q.trim(), 450);
  const enabled = debounced.length >= 2;
  const { data, error, loading, reload, setData } = useAsync(
    () => searchGames({ q: debounced, page }),
    [debounced, page],
    { enabled },
  );
  const gridRef = useRef(null);
  useStaggerIn(gridRef, data);

  const results = enabled && data ? data.data : [];
  const meta = data?.meta;
  const selected = results.find((r) => `${r.provider}:${r.externalId}` === selectedKey) || null;
  const lastSelected = useRef(null);
  if (selected) lastSelected.current = selected;

  const patchResult = (result, patch) => {
    setData((d) => (d ? { ...d, data: d.data.map((r) => (r === result || (r.provider === result.provider && r.externalId === result.externalId) ? { ...r, ...patch } : r)) } : d));
  };

  return (
    <div>
      <header className="page-head">
        <h1>Search games</h1>
        <p className="muted">Find any game and add it to your library or wishlist.</p>
      </header>

      <form className="searchbar" role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="game-search" className="sr-only">Search for a game</label>
        <input
          id="game-search"
          type="search"
          value={q}
          placeholder="Search by title, e.g. Hades, Elden Ring..."
          autoComplete="off"
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          autoFocus
        />
      </form>

      <div aria-live="polite" className="sr-only">
        {enabled && !loading && data ? `${meta?.total ?? results.length} results` : ''}
      </div>

      {!enabled && (
        <div className="empty">
          <p>{q.trim().length === 1 ? 'Keep typing: search needs at least 2 characters.' : 'Start typing to search the game database.'}</p>
        </div>
      )}

      {enabled && error && (
        <ErrorPanel error={error} onRetry={reload} what="search for games" />
      )}

      {enabled && !error && (
        <div ref={gridRef} aria-busy={loading}>
          {loading && !data ? (
            <CardGridSkeleton count={12} />
          ) : results.length === 0 && !loading ? (
            <div className="empty">
              <p>No games found for "{debounced}". Check the spelling or try a shorter title.</p>
            </div>
          ) : (
            <div className={`game-grid ${loading ? 'is-loading' : ''}`}>
              {results.map((r) => (
                <ResultCard
                  key={`${r.provider}:${r.externalId}`}
                  result={r}
                  onOpen={(x) => setSelectedKey(`${x.provider}:${x.externalId}`)}
                  onUpdated={patchResult}
                />
              ))}
            </div>
          )}
          <Pagination page={meta?.page || page} totalPages={meta?.totalPages} total={meta?.total} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          {results.length > 0 && (
            <p className="attribution">Data from <a href="https://rawg.io" target="_blank" rel="noopener noreferrer">RAWG</a></p>
          )}
        </div>
      )}

      {lastSelected.current && (
        <PreviewModal open={Boolean(selected)} result={selected || lastSelected.current} onClose={() => setSelectedKey(null)} onUpdated={patchResult} />
      )}
    </div>
  );
}
