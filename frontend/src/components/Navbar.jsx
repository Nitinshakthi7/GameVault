import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from './Toast.jsx';
import { describeError } from '../lib/errors.js';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/search', label: 'Search' },
  { to: '/library', label: 'Library' },
  { to: '/wishlist', label: 'Wishlist' },
  { to: '/analytics', label: 'Analytics' },
];

export function Logo({ to = '/' }) {
  return (
    <Link to={to} className="logo" aria-label="GameVault home">
      <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
        <path d="M14 26h36a6 6 0 0 1 6 6l-2 12a6 6 0 0 1-10 3l-4-5H24l-4 5a6 6 0 0 1-10-3l-2-12a6 6 0 0 1 6-6z" fill="#b249f8" />
        <circle cx="44" cy="34" r="3" fill="#00f5ff" />
        <path d="M20 31v6M17 34h6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="logo-text">GameVault</span>
    </Link>
  );
}

export default function Navbar() {
  const { user, signOut, signOutEverywhere } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuRef.current?.querySelector('button')?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };
  const handleLogoutAll = async () => {
    try {
      await signOutEverywhere();
      toast.success('Signed out of all devices.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(describeError(err, { what: 'sign you out everywhere' }).message);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Logo to="/dashboard" />
        <button
          type="button"
          className="icon-btn nav-toggle"
          aria-expanded={navOpen}
          aria-controls="primary-nav"
          aria-label="Toggle navigation"
          onClick={() => setNavOpen((o) => !o)}
        >
          <span aria-hidden="true">{navOpen ? '✕' : '☰'}</span>
        </button>
        <nav id="primary-nav" className={`nav-links ${navOpen ? 'is-open' : ''}`} aria-label="Primary">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="user-menu" ref={menuRef}>
          <button
            type="button"
            className="btn btn-ghost user-menu-btn"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="avatar" aria-hidden="true">{(user?.username || '?').charAt(0).toUpperCase()}</span>
            <span className="user-name">{user?.username}</span>
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className="menu"
                role="menu"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <p className="menu-email">{user?.email}</p>
                <button type="button" role="menuitem" onClick={handleLogout}>Log out</button>
                <button type="button" role="menuitem" onClick={handleLogoutAll}>Log out everywhere</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
