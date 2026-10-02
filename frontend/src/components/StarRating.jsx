import { useId, useState } from 'react';

const STAR_PATH =
  'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z';

function Star({ fill }) {
  const pct = Math.round(Math.max(0, Math.min(1, fill)) * 100);
  return (
    <span className="star-glyph" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="star-empty">
        <path d={STAR_PATH} />
      </svg>
      <svg viewBox="0 0 24 24" className="star-full" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>
        <path d={STAR_PATH} />
      </svg>
    </span>
  );
}

/** Read-only rating: `value` is the 1-10 personal rating (null = unrated). */
export function RatingDisplay({ value, className = '' }) {
  if (value == null) return <span className={`rating-none ${className}`}>Unrated</span>;
  return (
    <span className={`rating-display ${className}`} role="img" aria-label={`Rated ${value} out of 10`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} fill={(value - i * 2) / 2} />
      ))}
      <span className="rating-num" aria-hidden="true">{value}/10</span>
    </span>
  );
}

/**
 * Accessible half-star input: a radio group of 10 steps (0.5 to 5 stars, stored 1-10).
 * Arrow keys move between steps natively; each radio has an explicit label.
 */
export default function StarRating({ value, onChange, disabled = false, legend = 'Your rating' }) {
  const name = useId();
  const [hover, setHover] = useState(null);
  const shown = hover ?? value ?? 0;

  return (
    <fieldset className="star-rating" disabled={disabled}>
      <legend>{legend}</legend>
      <div className="stars" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span className="star" key={i}>
            <Star fill={(shown - (i - 1) * 2) / 2} />
            {[i * 2 - 1, i * 2].map((v) => (
              <label
                key={v}
                className={`star-half ${v % 2 ? 'star-half-l' : 'star-half-r'}`}
                onMouseEnter={() => setHover(v)}
              >
                <input
                  type="radio"
                  name={name}
                  value={v}
                  checked={value === v}
                  onChange={() => onChange(v)}
                />
                <span className="sr-only">{v / 2} {v / 2 === 1 ? 'star' : 'stars'}</span>
              </label>
            ))}
          </span>
        ))}
        <span className="rating-num" aria-live="polite">{value != null ? `${value}/10` : 'Unrated'}</span>
      </div>
      {value != null && (
        <button type="button" className="btn btn-link" onClick={() => onChange(null)}>
          Clear rating
        </button>
      )}
    </fieldset>
  );
}
