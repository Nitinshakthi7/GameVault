export function formatMinutes(min) {
  const m = Math.max(0, Math.round(Number(min) || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r}m`;
  return r ? `${h}h ${r}m` : `${h}h`;
}

export function formatHours(min) {
  const h = (Number(min) || 0) / 60;
  return `${h >= 10 ? Math.round(h) : Math.round(h * 10) / 10}h`;
}

export function formatDate(iso, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, options);
}

export function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function timeAgo(iso) {
  if (!iso) return 'Never';
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return 'Never';
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

const pad = (n) => String(n).padStart(2, '0');

/** ISO string -> value for <input type="datetime-local"> (local time). */
export function toLocalInput(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local value -> ISO string. */
export function fromLocalInput(v) {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** ISO string -> value for <input type="date">. */
export function toDateInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Convert API/provider description (may contain markup) to safe plain text. */
export function stripHtml(input) {
  if (!input) return '';
  const withBreaks = String(input).replace(/<\s*br\s*\/?>/gi, '\n').replace(/<\/\s*p\s*>/gi, '\n\n');
  try {
    const doc = new DOMParser().parseFromString(withBreaks, 'text/html');
    doc.querySelectorAll('script,style').forEach((el) => el.remove());
    return (doc.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
  } catch {
    return withBreaks.replace(/<[^>]*>/g, '').trim();
  }
}

/** Deterministic hue (0-359) from a string, for genre-tinted placeholder art. */
export function hueFromString(str) {
  let h = 0;
  const s = String(str || 'game');
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export function releaseYear(dateStr) {
  if (!dateStr) return '';
  const y = new Date(dateStr).getUTCFullYear();
  return Number.isNaN(y) ? '' : String(y);
}

export function joinList(arr, max = 3) {
  if (!Array.isArray(arr) || !arr.length) return '';
  const shown = arr.slice(0, max).join(', ');
  return arr.length > max ? `${shown} +${arr.length - max}` : shown;
}
