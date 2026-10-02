import { lazy, Suspense, useMemo } from 'react';
import { useReducedMotion, webglAvailable } from '../lib/motion.js';

// three.js is only fetched when the backdrop is actually going to render.
const BackdropScene = lazy(() => import('./BackdropScene.jsx'));

/**
 * Fixed full-viewport 3D backdrop. Falls back to a static CSS gradient when the user
 * prefers reduced motion or WebGL is unavailable.
 */
export default function Backdrop3D({ variant = 'ambient' }) {
  const reduced = useReducedMotion();
  const webgl = useMemo(() => webglAvailable(), []);
  const showScene = !reduced && webgl;

  return (
    <div className={`backdrop backdrop-${variant}`} aria-hidden="true">
      <div className="backdrop-fallback" />
      {showScene && (
        <Suspense fallback={null}>
          <BackdropScene variant={variant} />
        </Suspense>
      )}
    </div>
  );
}
