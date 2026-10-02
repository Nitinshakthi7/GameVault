import { useEffect, useState } from 'react';
import { hueFromString } from '../lib/format.js';

/**
 * Game artwork with a genre-tinted placeholder when the image is missing or fails to load.
 * `decorative` renders alt="" for places where the title is already adjacent text.
 */
export default function Cover({ src, title = 'Game', genres, className = '', ratio = '3 / 4', decorative = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const label = `Cover art for ${title}`;
  if (!src || failed) {
    const key = (Array.isArray(genres) && genres[0]) || title;
    const hue = hueFromString(key);
    const hue2 = (hue + 50) % 360;
    return (
      <div
        className={`cover cover-placeholder ${className}`}
        style={{
          aspectRatio: ratio,
          background: `linear-gradient(145deg, hsl(${hue} 55% 28%), hsl(${hue2} 60% 14%))`,
        }}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : `${label} (not available)`}
        aria-hidden={decorative ? 'true' : undefined}
      >
        <span aria-hidden="true">{String(title).trim().charAt(0).toUpperCase() || '?'}</span>
      </div>
    );
  }
  return (
    <div className={`cover ${className}`} style={{ aspectRatio: ratio }}>
      <img
        src={src}
        alt={decorative ? '' : label}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
