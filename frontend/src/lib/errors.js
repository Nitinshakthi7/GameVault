// Turns an ApiError into specific, human-friendly copy. Never a bare "Something went wrong".

/** Normalise `details` into a { field: message } map (tolerant of several server shapes). */
export function fieldErrors(err) {
  const out = {};
  const d = err?.details;
  if (!d) return out;
  const put = (field, msg) => {
    if (!field || !msg) return;
    const key = String(field).split('.').pop();
    if (!out[key]) out[key] = String(msg);
  };
  if (Array.isArray(d)) {
    d.forEach((item) => {
      if (typeof item === 'string') return;
      put(item.field || item.path || item.param || item.name, item.message || item.msg);
    });
  } else if (typeof d === 'object') {
    const inner = d.fields && typeof d.fields === 'object' ? d.fields : d;
    Object.entries(inner).forEach(([k, v]) => {
      if (typeof v === 'string') put(k, v);
      else if (Array.isArray(v) && typeof v[0] === 'string') put(k, v[0]);
      else if (v && typeof v === 'object' && v.message) put(k, v.message);
    });
  }
  return out;
}

function detailLines(err) {
  const fe = fieldErrors(err);
  const lines = Object.entries(fe).map(([k, v]) => `${k}: ${v}`);
  if (!lines.length && Array.isArray(err?.details)) {
    return err.details.filter((x) => typeof x === 'string');
  }
  return lines;
}

export function describeError(err, context = {}) {
  if (!err) return { title: 'Unknown error', message: 'An unexpected error occurred.', retryable: false, lines: [] };
  const what = context.what || 'complete that request';
  const server = err.message && !/^request failed$/i.test(err.message) ? err.message : '';
  switch (err.code) {
    case 'NETWORK_ERROR':
      return {
        title: 'Cannot reach GameVault',
        message: 'Check your internet connection and make sure the GameVault server is running, then try again.',
        retryable: true,
        lines: [],
      };
    case 'VALIDATION_ERROR':
      return {
        title: 'Some details need fixing',
        message: server || 'Please review the highlighted fields and try again.',
        retryable: false,
        lines: detailLines(err),
      };
    case 'UNAUTHORIZED':
      return {
        title: 'Please sign in',
        message: server || 'Your session is missing or has expired. Sign in again to continue.',
        retryable: false,
        lines: [],
      };
    case 'NOT_FOUND':
      return {
        title: 'Not found',
        message: server || 'That item no longer exists, or it belongs to another account.',
        retryable: false,
        lines: [],
      };
    case 'CONFLICT':
      return {
        title: 'Already added',
        message: server || 'That game is already in your library or wishlist.',
        retryable: false,
        lines: [],
      };
    case 'RATE_LIMITED':
      return {
        title: 'Slow down a moment',
        message: 'You are sending requests too quickly. Wait a few seconds, then retry.',
        retryable: true,
        lines: [],
      };
    case 'PROVIDER_UNAVAILABLE':
      return {
        title: 'Game database unavailable',
        message:
          'The external game database (RAWG) did not respond. Your own library is unaffected; try the search again in a moment.',
        retryable: true,
        lines: [],
      };
    case 'INTERNAL':
      return {
        title: 'Server error',
        message: `The server hit an unexpected error while trying to ${what}. It has been logged; try again shortly.`,
        retryable: true,
        lines: [],
      };
    default:
      return {
        title: 'Request failed',
        message: server || `We could not ${what}. Please try again.`,
        retryable: Boolean(err.retryable),
        lines: [],
      };
  }
}

/** Single-line version for toasts: message plus any field problems. */
export function errorText(err, what) {
  const info = describeError(err, { what });
  return info.lines.length ? `${info.message} ${info.lines.join('; ')}` : `${info.title}. ${info.message}`;
}
