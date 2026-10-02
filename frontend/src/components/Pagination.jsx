export default function Pagination({ page, totalPages, onChange, total }) {
  if (!totalPages || totalPages <= 1) return null;
  const pages = [];
  const add = (p) => pages.push(p);
  const window = 1;
  for (let p = 1; p <= totalPages; p += 1) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= window) add(p);
    else if (pages[pages.length - 1] !== '...') add('...');
  }
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="btn btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <ul>
        {pages.map((p, i) =>
          p === '...' ? (
            <li key={`gap-${i}`} aria-hidden="true" className="pagination-gap">&hellip;</li>
          ) : (
            <li key={p}>
              <button
                type="button"
                className={`page-btn ${p === page ? 'is-current' : ''}`}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ul>
      <button type="button" className="btn btn-ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
      {total != null && <span className="pagination-total">{total} total</span>}
    </nav>
  );
}
