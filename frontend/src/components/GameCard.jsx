import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Cover from './Cover.jsx';
import StatusBadge from './StatusBadge.jsx';
import { RatingDisplay } from './StarRating.jsx';
import { ProgressBar } from './Progress.jsx';
import { formatHours, joinList, timeAgo } from '../lib/format.js';

/**
 * Library item card. `item` follows the library list item shape from docs/API.md.
 * variant: 'grid' (default) | 'list' | 'wide' (Continue Playing)
 */
export default function GameCard({ item, variant = 'grid' }) {
  const game = item.game || {};
  const to = `/library/${item.id}`;
  const title = game.title || 'Untitled game';

  if (variant === 'list') {
    return (
      <div data-stagger><motion.div className="game-row" whileHover={{ x: 3 }}>
        <Link to={to} className="game-row-cover" tabIndex={-1} aria-hidden="true">
          <Cover src={game.coverImage} title={title} genres={game.genres} decorative />
        </Link>
        <div className="game-row-main">
          <h3 className="game-row-title"><Link to={to}>{title}</Link></h3>
          <p className="muted">{joinList(game.genres, 2) || 'No genres'}{item.platform ? ` · ${item.platform}` : ''}</p>
        </div>
        <StatusBadge status={item.status} />
        <span className="game-row-stat" title="Playtime">{formatHours(item.playtimeMinutes)}</span>
        <RatingDisplay value={item.personalRating} className="game-row-rating" />
      </motion.div></div>
    );
  }

  if (variant === 'wide') {
    return (
      <div data-stagger><motion.article className="wide-card" whileHover={{ y: -4 }} whileTap={{ scale: 0.99 }}>
        <Link to={to} className="wide-card-cover" tabIndex={-1} aria-hidden="true">
          <Cover src={game.backgroundImage || game.coverImage} title={title} genres={game.genres} ratio="16 / 9" decorative />
        </Link>
        <div className="wide-card-body">
          <h3><Link to={to}>{title}</Link></h3>
          <p className="muted">{item.platform || joinList(game.platforms, 1) || 'Platform not set'}</p>
          <ProgressBar value={item.progress} label={`${title} progress`} />
          <p className="wide-card-meta">
            <span>{item.progress ?? 0}% done</span>
            <span>{formatHours(item.playtimeMinutes)} played</span>
            <span>Last played {timeAgo(item.lastPlayedAt)}</span>
          </p>
        </div>
      </motion.article></div>
    );
  }

  return (
    <div data-stagger><motion.article className="game-card" whileHover={{ y: -6 }} whileTap={{ scale: 0.985 }}>
      <Link to={to} className="game-card-link" aria-label={`${title}, ${item.status.replace('_', ' ')}`}>
        <Cover src={game.coverImage} title={title} genres={game.genres} decorative />
        <span className="game-card-status"><StatusBadge status={item.status} /></span>
        <div className="game-card-body">
          <h3>{title}</h3>
          <p className="muted">
            {item.platform || joinList(game.platforms, 1) || ' '}
            {item.playtimeMinutes ? ` · ${formatHours(item.playtimeMinutes)}` : ''}
          </p>
          {item.personalRating != null && <RatingDisplay value={item.personalRating} />}
        </div>
      </Link>
    </motion.article></div>
  );
}
