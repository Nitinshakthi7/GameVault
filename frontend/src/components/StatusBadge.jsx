import { useEffect, useRef } from 'react';
import { STATUS_LABELS } from '../lib/constants.js';
import { pulse } from '../hooks/useAnime.js';

/** Colored status pill. Pulses (anime.js) when the status changes after first render. */
export default function StatusBadge({ status, className = '' }) {
  const ref = useRef(null);
  const prev = useRef(status);
  useEffect(() => {
    if (prev.current !== status) {
      pulse(ref.current);
      prev.current = status;
    }
  }, [status]);
  return (
    <span ref={ref} className={`badge badge-${status} ${className}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
