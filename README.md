# GameVault

A personal gaming library, backlog and analytics platform. Search any game, add it to your library with one click (metadata is fetched automatically), track your status, play sessions and ratings, and see how your gaming life adds up.

> GameVault v2 implements the Phase 0 MVP of [`docs/GameVault_PRD.md`](docs/GameVault_PRD.md).

## Features

- **Auth** – register, login, logout, log out everywhere, password reset, JWT with server-side session invalidation.
- **Game search** – RAWG-backed search with automatic metadata (title, description, developers, publishers, genres, platforms, release date, artwork). No manual entry.
- **Library** – one-click add, 8 statuses (owned, backlog, playing, completed, dropped, on hold, replay, mastered), personal rating, progress, notes and review, purchase info.
- **Filtering and sorting** – platform, genre, developer, publisher, franchise, release year, status, rating, playtime, completion, ownership type; 7 sort orders; pagination.
- **Wishlist** – priority, target price, notes; move to library in one click.
- **Play sessions** – log sessions, edit/delete history, playtime recalculated automatically.
- **Dashboard and analytics** – overview cards, continue playing, backlog snapshot, recent activity, top genres/platforms/developers/franchises.
- **UI** – dark gaming look, three.js backdrop, anime.js and Framer Motion animations, responsive, keyboard accessible, `prefers-reduced-motion` respected.

## Architecture

```
React (Vite) SPA  ->  REST API (Express)  ->  Services  ->  MongoDB
                                               |
                                  Provider layer: RAWG | mock
                                  provider -> normalize.js -> Game collection (+ search cache)
```

| Collection | Purpose |
| --- | --- |
| `Game` | One global record per game (metadata from the provider) |
| `UserGame` | A user's relationship with a game: status, rating, playtime, notes |
| `Wishlist` | A user's wishlist entries |
| `PlaySession` | Individual play sessions |
| `SearchCache` | 24h cache of provider searches (TTL index) |

Stack: Node 20+, Express 4, Mongoose 8, zod, JWT/bcrypt, helmet, express-rate-limit; React 18, Vite, three.js, anime.js, Framer Motion.

## Local setup

Prerequisites: Node 20+, a MongoDB URI (local or Atlas), optionally a free [RAWG API key](https://rawg.io/apidocs).

```bash
# API
cd backend
cp .env.example .env     # then edit MONGODB_URI, JWT_SECRET, RAWG_API_KEY
npm install
npm run dev              # http://localhost:5000

# Web app (second terminal)
cd frontend
npm install
npm run dev              # http://localhost:5173 (proxies /api to :5000)
```

No key or database yet? `npm run dev:memory` in `backend/` starts the API on a throwaway in-memory database with the offline mock provider (Cyberpunk 2077, The Witcher 3, Hades, ...).

### Environment variables (`backend/.env`)

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string (use a fresh DB name such as `gamevault_v2`) |
| `JWT_SECRET` | Long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `JWT_EXPIRES_IN` | Token lifetime, default `7d` |
| `GAME_PROVIDER` | `rawg` or `mock`. Defaults to `rawg` when `RAWG_API_KEY` is set, otherwise `mock` |
| `RAWG_API_KEY` | RAWG key; the UI shows the required "Data from RAWG" attribution |
| `CORS_ORIGINS` | Comma-separated allowed origins for split local dev |
| `APP_URL` | Base URL used in password reset links |
| `SERVE_FRONTEND` | `true` to serve `frontend/dist` from Express (production) |

Password reset emails are not sent yet: outside production the reset link is returned by the API and printed in the server log.

## Scripts

| Where | Command | What |
| --- | --- | --- |
| `backend` | `npm test` | Unit/integration tests (in-memory MongoDB, mock provider) |
| `backend` | `npm run smoke` | End-to-end flow against a running server: `BASE_URL=http://localhost:5000 npm run smoke` |
| `backend` | `npm run dev:memory` | API on an in-memory DB |
| `frontend` | `npm run build` | Production build into `frontend/dist` |

## API

Full reference with request/response shapes, error codes and rate limits: [`docs/API.md`](docs/API.md).

## Deploy (Render + MongoDB Atlas)

1. Create a free MongoDB Atlas M0 cluster and a database user; allow network access from Render.
2. Push this repo to GitHub and create a Render Blueprint from [`render.yaml`](render.yaml).
3. Set `MONGODB_URI`, `RAWG_API_KEY` and `APP_URL` in the Render dashboard (`JWT_SECRET` is generated).
4. Verify: `BASE_URL=https://<your-app>.onrender.com npm run smoke --prefix backend`.

Render's free tier sleeps when idle, so the first request after a pause can take about 50 seconds.

## Roadmap

Phases 1-8 of the PRD (wishlist price tracking, recommendations, natural-language search, integrations, ...) are tracked in `docs/GameVault_PRD.md`.
