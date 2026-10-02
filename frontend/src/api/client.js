// Single fetch wrapper for the GameVault REST API (see docs/API.md).
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'gv_token';

export class ApiError extends Error {
  constructor({ code = 'INTERNAL', message = 'Request failed', retryable = false, status = 0, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.retryable = retryable;
    this.status = status;
    this.details = details;
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable: session lives in memory only via AuthContext */
  }
}
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

function buildQuery(params) {
  if (!params) return '';
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length) qs.set(key, value.join(','));
    } else {
      qs.set(key, String(value));
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

/**
 * request(path, { method, body, params, auth, signal })
 * Resolves with the parsed body `{ success, data, meta, message }` (or `{ success: true, data: null }` for 204).
 * Rejects with ApiError.
 */
export async function request(path, { method = 'GET', body, params, auth = true, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}${buildQuery(params)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError({
      code: 'NETWORK_ERROR',
      message: 'Could not reach the GameVault server.',
      retryable: true,
      status: 0,
    });
  }

  if (res.status === 204) return { success: true, data: null };

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok || (json && json.success === false)) {
    const err = new ApiError({
      code: json?.code || (res.status === 401 ? 'UNAUTHORIZED' : res.status === 429 ? 'RATE_LIMITED' : 'INTERNAL'),
      message: json?.message || res.statusText || 'Request failed',
      retryable: json?.retryable ?? (res.status >= 500 || res.status === 429),
      status: res.status,
      details: json?.details,
    });
    if (res.status === 401 && auth && token) {
      clearToken();
      if (unauthorizedHandler) unauthorizedHandler(err);
    }
    throw err;
  }

  return json ?? { success: true, data: null };
}

export const get = (path, opts) => request(path, { ...opts, method: 'GET' });
export const post = (path, body, opts) => request(path, { ...opts, method: 'POST', body: body ?? {} });
export const patch = (path, body, opts) => request(path, { ...opts, method: 'PATCH', body });
export const del = (path, opts) => request(path, { ...opts, method: 'DELETE' });
