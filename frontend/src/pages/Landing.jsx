import { useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useStaggerIn } from '../hooks/useAnime.js';
import { usePageTitle } from '../hooks/useMisc.js';

const FEATURES = [
  { title: 'One home for every game', text: 'Search a huge game database and add titles to your library with a single click.' },
  { title: 'Beat the backlog', text: 'Track status, progress and play sessions so you always know what to play next.' },
  { title: 'Wishlist with intent', text: 'Keep priorities and target prices, then move games into your library when you buy them.' },
  { title: 'Your stats, your story', text: 'See hours played, top genres and platforms, and how fast you finish games.' },
];

export default function Landing() {
  usePageTitle('');
  const { status } = useAuth();
  const ref = useRef(null);
  useStaggerIn(ref, 'landing', { step: 90 });

  if (status === 'authed') return <Navigate to="/dashboard" replace />;

  return (
    <div className="landing" ref={ref}>
      <section className="hero">
        <p className="eyebrow" data-stagger>Your personal game library</p>
        <h1 data-stagger>
          Every game you play,<br />
          <span className="gradient-text">in one vault.</span>
        </h1>
        <p className="hero-lead" data-stagger>
          GameVault tracks your library, backlog, wishlist and playtime, with big artwork and zero spreadsheet energy.
        </p>
        <div className="hero-cta" data-stagger>
          <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ display: 'inline-block' }}>
            <Link to="/register" className="btn btn-primary btn-lg">Create free account</Link>
          </motion.span>
          <Link to="/login" className="btn btn-ghost btn-lg">Sign in</Link>
        </div>
      </section>
      <section className="features" aria-label="Features">
        {FEATURES.map((f) => (
          <article key={f.title} className="feature" data-stagger>
            <h2>{f.title}</h2>
            <p>{f.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
