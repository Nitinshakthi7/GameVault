import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getLibraryFacets, listLibrary } from '../api/endpoints.js';
import { useAsync } from '../hooks/useAsync.js';
import { useStaggerIn } from '../hooks/useAnime.js';
import { useDebounce, useMediaQuery, usePageTitle } from '../hooks/useMisc.js';
import GameCard from '../components/GameCard.jsx';
import Modal from '../components/Modal.jsx';
import ErrorPanel from '../components/ErrorPanel.jsx';
import Pagination from '../components/Pagination.jsx';
import { CardGridSkeleton } from '../components/Skeleton.jsx';
import { COMPLETION_OPTIONS, OWNERSHIP_TYPES, SORTS, STATUSES } from '../lib/constants.js';

const FILTER_KEYS = [
  'status', 'platform', 'genre', 'developer', 'publisher', 'franchise', 'yearFrom', 'yearTo',
  'minRating', 'maxRating', 'minPlaytime', 'maxPlaytime', 'completion', 'ownershipType', 'q',
];
const LIMIT = 24;

/** Number input that commits on blur / Enter (avoids a request per keystroke). */
function NumberField({ id, label, value, onCommit, min, max, step = 1, toDisplay = (v) => v, fromDisplay = (v) => v }) {
  const [local, setLocal] = useState(value === '' ? '' : String(toDisplay(Number(value))));
  useEffect(() => setLocal(value === '' ? '' : String(toDisplay(Number(value)))), [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const commit = () => {
    if (local === '') return onCommit('');
    const n = Number(local);
    if (Number.isNaN(n)) return onCommit('');
    const clamped = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, n));
    return onCommit(String(fromDisplay(clamped)));
  };
  return (
    <div className="field field-inline">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
      />
    </div>
  );
}

function SelectField({ id, label, value, onChange, options, anyLabel = 'Any' }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{anyLabel}</option>
        {options.map((o) => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </div>
  );
}

function FilterPanel({ get, update, facets, activeCount, onClear }) {
  const statuses = get('status').split(',').filter(Boolean);
  const toggleStatus = (s) => {
    const next = statuses.includes(s) ? statuses.filter((x) => x !== s) : [...statuses, s];
    update({ status: next.join(',') });
  };
  const years = facets?.years || [];
  return (
    <form className="filters" onSubmit={(e) => e.preventDefault()} aria-label="Library filters">
      <div className="filters-head">
        <h2>Filters</h2>
        {activeCount > 0 && <button type="button" className="btn btn-link" onClick={onClear}>Clear all</button>}
      </div>

      <fieldset className="field-group">
        <legend>Status</legend>
        <div className="check-grid">
          {STATUSES.map((s) => (
            <label key={s.value} className="check">
              <input type="checkbox" checked={statuses.includes(s.value)} onChange={() => toggleStatus(s.value)} />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <SelectField id="f-platform" label="Platform" value={get('platform')} onChange={(v) => update({ platform: v })} options={facets?.platforms || []} />
      <SelectField id="f-genre" label="Genre" value={get('genre')} onChange={(v) => update({ genre: v })} options={facets?.genres || []} />
      <SelectField id="f-developer" label="Developer" value={get('developer')} onChange={(v) => update({ developer: v })} options={facets?.developers || []} />
      <SelectField id="f-publisher" label="Publisher" value={get('publisher')} onChange={(v) => update({ publisher: v })} options={facets?.publishers || []} />
      <SelectField id="f-franchise" label="Franchise" value={get('franchise')} onChange={(v) => update({ franchise: v })} options={facets?.franchises || []} />

      <fieldset className="field-group">
        <legend>Release year</legend>
        <div className="range-row">
          <SelectField id="f-yf" label="From" value={get('yearFrom')} onChange={(v) => update({ yearFrom: v })} options={years} anyLabel="Any" />
          <SelectField id="f-yt" label="To" value={get('yearTo')} onChange={(v) => update({ yearTo: v })} options={years} anyLabel="Any" />
        </div>
      </fieldset>

      <fieldset className="field-group">
        <legend>My rating (1-10)</legend>
        <div className="range-row">
          <NumberField id="f-minr" label="Min" min={1} max={10} value={get('minRating')} onCommit={(v) => update({ minRating: v })} />
          <NumberField id="f-maxr" label="Max" min={1} max={10} value={get('maxRating')} onCommit={(v) => update({ maxRating: v })} />
        </div>
      </fieldset>

      <fieldset className="field-group">
        <legend>Playtime (hours)</legend>
        <div className="range-row">
          <NumberField id="f-minp" label="Min" min={0} step={0.5} value={get('minPlaytime')} onCommit={(v) => update({ minPlaytime: v })} toDisplay={(m) => Math.round((m / 60) * 10) / 10} fromDisplay={(h) => Math.round(h * 60)} />
          <NumberField id="f-maxp" label="Max" min={0} step={0.5} value={get('maxPlaytime')} onCommit={(v) => update({ maxPlaytime: v })} toDisplay={(m) => Math.round((m / 60) * 10) / 10} fromDisplay={(h) => Math.round(h * 60)} />
        </div>
      </fieldset>

      <SelectField id="f-completion" label="Completion" value={get('completion')} onChange={(v) => update({ completion: v })} options={COMPLETION_OPTIONS} />
      <SelectField id="f-own" label="Ownership type" value={get('ownershipType')} onChange={(v) => update({ ownershipType: v })} options={OWNERSHIP_TYPES} />
    </form>
  );
}

export default function Library() {
  usePageTitle('Library');
  const [params, setParams] = useSearchParams();
  const get = (k) => params.get(k) || '';
  const isDesktop = useMediaQuery('(min-width: 900px)');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const update = (changes) => {
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        Object.entries(changes).forEach(([k, v]) => {
          if (v === '' || v == null) n.delete(k);
          else n.set(k, String(v));
        });
        if (!('page' in changes)) n.delete('page');
        return n;
      },
      { replace: true },
    );
  };

  // Text search: local input, debounced into the URL.
  const urlQ = get('q');
  const [qInput, setQInput] = useState(urlQ);
  const debouncedQ = useDebounce(qInput, 400);
  useEffect(() => setQInput(urlQ), [urlQ]);
  useEffect(() => {
    if (debouncedQ.trim() !== urlQ) update({ q: debouncedQ.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const view = get('view') === 'list' ? 'list' : 'grid';
  const sort = SORTS.some((s) => s.value === get('sort')) ? get('sort') : 'recentlyAdded';
  const order = get('order') === 'asc' ? 'asc' : 'desc';
  const page = Math.max(1, parseInt(get('page'), 10) || 1);
  const activeCount = FILTER_KEYS.filter((k) => get(k)).length;

  const query = useMemo(() => {
    const q = { sort, order, page, limit: LIMIT };
    FILTER_KEYS.forEach((k) => {
      if (get(k)) q[k] = get(k);
    });
    return q;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  const facetsState = useAsync(getLibraryFacets, []);
  const { data, error, loading, reload } = useAsync(() => listLibrary(query), [JSON.stringify(query)]);
  const items = data?.data || [];
  const meta = data?.meta;
  const gridRef = useRef(null);
  useStaggerIn(gridRef, data);

  const clearAll = () => setParams(new URLSearchParams(view === 'list' ? { view: 'list' } : {}), { replace: true });
  const panel = (
    <FilterPanel get={get} update={update} facets={facetsState.data} activeCount={activeCount} onClear={clearAll} />
  );

  return (
    <div>
      <header className="page-head">
        <h1>Library</h1>
        <p className="muted">{meta ? `${meta.total} game${meta.total === 1 ? '' : 's'}` : 'Your collection'}</p>
      </header>

      <div className="toolbar">
        <div className="field toolbar-search">
          <label htmlFor="lib-q" className="sr-only">Search your library</label>
          <input id="lib-q" type="search" placeholder="Search your library" value={qInput} onChange={(e) => setQInput(e.target.value)} />
        </div>
        {!isDesktop && (
          <button type="button" className="btn btn-ghost" onClick={() => setDrawerOpen(true)}>
            Filters{activeCount ? ` (${activeCount})` : ''}
          </button>
        )}
        <div className="field toolbar-sort">
          <label htmlFor="lib-sort">Sort by</label>
          <select id="lib-sort" value={sort} onChange={(e) => update({ sort: e.target.value })}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="field toolbar-order">
          <label htmlFor="lib-order">Order</label>
          <select id="lib-order" value={order} onChange={(e) => update({ order: e.target.value })}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
        <div className="view-toggle" role="group" aria-label="View">
          <button type="button" className={view === 'grid' ? 'is-on' : ''} aria-pressed={view === 'grid'} onClick={() => update({ view: '' })}>Grid</button>
          <button type="button" className={view === 'list' ? 'is-on' : ''} aria-pressed={view === 'list'} onClick={() => update({ view: 'list' })}>List</button>
        </div>
      </div>

      <div className="library-layout">
        {isDesktop && <aside className="filter-sidebar">{panel}</aside>}
        <div className="library-results" ref={gridRef} aria-busy={loading}>
          {error && !data ? (
            <ErrorPanel error={error} onRetry={reload} what="load your library" />
          ) : loading && !data ? (
            <CardGridSkeleton count={12} list={view === 'list'} />
          ) : items.length === 0 ? (
            activeCount > 0 ? (
              <div className="empty">
                <p>No games match these filters.</p>
                <button type="button" className="btn btn-ghost" onClick={clearAll}>Clear filters</button>
              </div>
            ) : (
              <div className="empty empty-hero">
                <h2>Your library is empty</h2>
                <p>Search for games and add them to start building your collection.</p>
                <Link to="/search" className="btn btn-primary">Find games</Link>
              </div>
            )
          ) : (
            <div className={`${view === 'list' ? 'game-list' : 'game-grid'} ${loading ? 'is-loading' : ''}`}>
              {items.map((it) => <GameCard key={it.id} item={it} variant={view === 'list' ? 'list' : 'grid'} />)}
            </div>
          )}
          {error && data && <ErrorPanel error={error} onRetry={reload} what="refresh your library" compact />}
          <Pagination
            page={meta?.page || page}
            totalPages={meta?.totalPages}
            total={meta?.total}
            onChange={(p) => { update({ page: p }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        </div>
      </div>

      {!isDesktop && (
        <Modal open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Filters" variant="drawer">
          {panel}
          <div className="modal-actions">
            <button type="button" className="btn btn-primary" onClick={() => setDrawerOpen(false)}>
              Show {meta ? `${meta.total} ` : ''}results
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
