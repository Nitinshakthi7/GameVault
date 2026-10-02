import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar, { Logo } from './Navbar.jsx';
import Backdrop3D from './Backdrop3D.jsx';
import { useReducedMotion } from '../lib/motion.js';

/** Route transition wrapper. useOutlet keeps the exiting page's element alive during the exit animation. */
function AnimatedOutlet() {
  const outlet = useOutlet();
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  const variants = reduced
    ? { initial: {}, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
      };
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={pathname} {...variants} transition={{ duration: 0.22, ease: 'easeOut' }}>
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}

export function AppLayout() {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">Skip to main content</a>
      <Backdrop3D variant="ambient" />
      <Navbar />
      <main id="main" className="page" tabIndex={-1}>
        <AnimatedOutlet />
      </main>
      <footer className="footer">
        <p>
          Game data from{' '}
          <a href="https://rawg.io" target="_blank" rel="noopener noreferrer">RAWG</a>
          . GameVault is a personal tracker and is not affiliated with any game publisher.
        </p>
      </footer>
    </div>
  );
}

export function PublicLayout() {
  return (
    <div className="app-shell public-shell">
      <a href="#main" className="skip-link">Skip to main content</a>
      <Backdrop3D variant="hero" />
      <header className="public-header">
        <Logo />
      </header>
      <main id="main" className="public-main" tabIndex={-1}>
        <AnimatedOutlet />
      </main>
    </div>
  );
}
