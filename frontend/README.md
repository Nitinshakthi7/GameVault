# GameVault Frontend

Vite + React 18 single-page app (JavaScript, ESM). Talks to the Express API under `/api` (see `../docs/API.md`).

## Run

```bash
npm install
npm run dev       # http://localhost:5173, proxies /api -> http://localhost:5000
npm run build     # outputs frontend/dist (served by Express in production)
npm run preview   # serve the production build locally
```

Set `VITE_API_URL` to override the API base (default `/api`).

## Stack

- React Router 7: routing, protected routes
- three.js: lazy-loaded ambient/hero 3D backdrop (`components/Backdrop3D.jsx` -> `BackdropScene.jsx`)
- anime.js v4: staggered entrances, count-ups, bar/ring fills, badge pulse (`hooks/useAnime.js`)
- framer-motion: route transitions, modals/drawers, micro-interactions
- All motion is skipped under `prefers-reduced-motion` (`lib/motion.js`); the backdrop falls back to a static gradient.

## Layout

`src/api` (fetch wrapper + endpoints), `src/context` (auth), `src/components`, `src/pages`, `src/hooks`, `src/lib`, `src/styles` (plain CSS with variables).
