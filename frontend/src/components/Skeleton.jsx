export function Skeleton({ w = '100%', h = '1rem', radius, className = '', style }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width: w, height: h, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function CardGridSkeleton({ count = 12, list = false }) {
  return (
    <div className={list ? 'game-list' : 'game-grid'} role="status" aria-label="Loading games">
      {Array.from({ length: count }).map((_, i) =>
        list ? (
          <div className="skeleton-row" key={i}>
            <Skeleton w="56px" h="74px" radius="8px" />
            <div className="skeleton-row-text">
              <Skeleton w="45%" h="1rem" />
              <Skeleton w="25%" h="0.8rem" />
            </div>
          </div>
        ) : (
          <div className="skeleton-card" key={i}>
            <Skeleton w="100%" h="0" className="skeleton-cover" />
            <Skeleton w="80%" h="1rem" />
            <Skeleton w="45%" h="0.8rem" />
          </div>
        ),
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function TilesSkeleton({ count = 6 }) {
  return (
    <div className="stat-grid" role="status" aria-label="Loading statistics">
      {Array.from({ length: count }).map((_, i) => (
        <div className="stat-tile" key={i}>
          <Skeleton w="50%" h="0.8rem" />
          <Skeleton w="35%" h="2rem" style={{ marginTop: '0.6rem' }} />
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading page" className="page-skeleton">
      <Skeleton w="40%" h="2rem" />
      <Skeleton w="70%" h="1rem" />
      <Skeleton w="100%" h="220px" radius="14px" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
