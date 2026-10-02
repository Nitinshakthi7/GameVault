import { describeError } from '../lib/errors.js';

/** Friendly error with specific copy per ApiError.code and a Retry button where retryable. */
export default function ErrorPanel({ error, onRetry, what, compact = false }) {
  const info = describeError(error, { what });
  return (
    <div className={`error-panel ${compact ? 'error-panel-compact' : ''}`} role="alert">
      <div className="error-panel-icon" aria-hidden="true">!</div>
      <div className="error-panel-body">
        <h3>{info.title}</h3>
        <p>{info.message}</p>
        {info.lines.length > 0 && (
          <ul>
            {info.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        )}
        {onRetry && info.retryable && (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

/** Inline form-level error banner. */
export function FormError({ error, what }) {
  if (!error) return null;
  const info = describeError(error, { what });
  return (
    <div className="form-error" role="alert">
      <strong>{info.title}.</strong> {info.message}
      {info.lines.length > 0 && (
        <ul>
          {info.lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
