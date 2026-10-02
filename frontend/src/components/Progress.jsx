import { useLayoutEffect, useRef } from 'react';
import { countUp, fillRing } from '../hooks/useAnime.js';

/** Number that counts up with anime.js. `format` receives the current numeric value. */
export function CountUp({ value, format = (v) => String(Math.round(v)), className = '' }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const to = Number(value) || 0;
    el.textContent = format(0);
    return countUp(to, (v) => {
      el.textContent = format(v);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span ref={ref} className={className} />;
}

/** Circular progress ring (0-100) with animated stroke. */
export function ProgressRing({ value = 0, size = 96, stroke = 8, label }) {
  const ref = useRef(null);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  useLayoutEffect(() => fillRing(ref.current, c, pct / 100), [pct, c]);
  return (
    <div className="progress-ring" style={{ width: size, height: size }} role="img" aria-label={label || `${pct}% complete`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b249f8" />
            <stop offset="100%" stopColor="#2dd4bf" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} fill="none" />
        <circle
          ref={ref}
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="ring-fill"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring-label" aria-hidden="true">{Math.round(pct)}%</span>
    </div>
  );
}

/** Thin linear progress bar. */
export function ProgressBar({ value = 0, label }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label || 'Progress'}>
      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
