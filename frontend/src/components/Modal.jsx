import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Dialog({ onClose, title, children, size, variant }) {
  const ref = useRef(null);
  const titleId = useId();
  const returnFocus = useRef(typeof document !== 'undefined' ? document.activeElement : null);

  useEffect(() => {
    const node = ref.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = node?.querySelector('[data-autofocus]') || node?.querySelector(FOCUSABLE) || node;
    first?.focus();
    const opener = returnFocus.current;
    return () => {
      document.body.style.overflow = prevOverflow;
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
    };
  }, []);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(ref.current.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  const drawer = variant === 'drawer';
  return (
    <motion.div
      className={`modal-overlay ${drawer ? 'modal-overlay-drawer' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`modal modal-${size || 'md'} ${drawer ? 'modal-drawer' : ''}`}
        initial={drawer ? { x: '-100%' } : { opacity: 0, y: 24, scale: 0.97 }}
        animate={drawer ? { x: 0 } : { opacity: 1, y: 0, scale: 1 }}
        exit={drawer ? { x: '-100%' } : { opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        onKeyDown={onKeyDown}
      >
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </motion.div>
    </motion.div>
  );
}

/** Accessible modal / drawer: focus trap, Escape to close, focus restored on close, scroll locked. */
export default function Modal({ open, onClose, title, children, size = 'md', variant = 'modal' }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <Dialog onClose={onClose} title={title} size={size} variant={variant}>
          {children}
        </Dialog>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', busy = false, danger = true }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p>{message}</p>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} data-autofocus>
          Cancel
        </button>
        <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
          {busy ? 'Working...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
