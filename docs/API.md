# GameVault REST API

Base URL: `/api` (dev: `http://localhost:5000/api`). All bodies are JSON. Protected routes need `Authorization: Bearer <token>`.

## Response format

Success: `{ "success": true, "message"?: string, "data": any, "meta"?: { page, limit, total, totalPages } }`

Error: `{ "success": false, "message": string, "code": string, "details"?: any, "retryable"?: boolean }`

| Code | HTTP | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Body/query failed validation (`details` lists fields) |
| `UNAUTHORIZED` | 401 | Missing/invalid/expired token or bad credentials |
| `NOT_FOUND` | 404 | Resource missing (or belongs to another user) |
| `CONFLICT` | 409 | Duplicate (e.g. game already in library; `details.existingId`) |
| `RATE_LIMITED` | 429 | Too many requests |
| `PROVIDER_UNAVAILABLE` | 502 | External game database failed (`retryable: true`) |
| `INTERNAL` | 500 | Unexpected error |

Pagination: `?page=1&limit=24` (limit max 100).

Rate limits: global 300 req / 15 min / IP; `/auth/*` 20 / 15 min; `/games/search` and `/games/external/*` 30 / min / user.

## Health
`GET /health` → `{ status: "ok", db: "up"|"down", provider: "rawg"|"mock" }`

## Auth (`/auth`)
| Method & path | Auth | Body | Result |
| --- | --- | --- | --- |
| `POST /auth/register` | no | `{username(3-20), email, password(min 8)}` | 201 `{token, user}` |
| `POST /auth/login` | no | `{email, password}` | `{token, user}` |
| `POST /auth/logout` | yes | – | 200 (client discards token) |
| `POST /auth/logout-all` | yes | – | 200, invalidates all existing tokens |
| `GET /auth/me` | yes | – | `user` (`{id, username, email, createdAt}`) |
| `POST /auth/forgot-password` | no | `{email}` | always 200; outside production also returns `resetUrl` |
| `POST /auth/reset-password` | no | `{token, password}` | 200; invalidates old tokens |

## Games (`/games`, auth required)
- `GET /games/search?q=&page=` → `data: [{provider, externalId, title, releaseDate, coverImage, platforms[], genres[], externalRating, inLibrary, userGameId?, inWishlist}]` + `meta`
- `GET /games/external/:provider/:externalId` → full `Game` (fetched, cached in DB, with `id`)
- `GET /games/:id` → `Game`

`Game`: `{id, provider, externalId, externalUrl, slug, title, description, releaseDate, releaseYear, developers[], publishers[], genres[], tags[], platforms[], platformFamilies[], franchises[], coverImage, backgroundImage, screenshots[], externalRating(0-5), metacritic, website}`

## Library (`/library`, auth required)
Statuses: `owned, backlog, playing, completed, dropped, on_hold, replay, mastered`. (Wishlist lives in `/wishlist`.)

- `GET /library` – filters: `status` (comma list), `platform`, `genre`, `developer`, `publisher`, `franchise`, `yearFrom`, `yearTo`, `minRating`, `maxRating` (personal 1-10), `minPlaytime`, `maxPlaytime` (minutes), `completion=completed|in_progress|not_started`, `ownershipType`, `q`; sort: `sort=title|releaseDate|rating|personalRating|playtime|recentlyAdded|recentlyPlayed`, `order=asc|desc`; plus `page`, `limit`.
  Item: `{id, status, personalRating, playtimeMinutes, platform, ownershipType, progress, createdAt, lastPlayedAt, completedAt, game:{id,title,coverImage,backgroundImage,releaseDate,genres[],platforms[],developers[],externalRating}}`
- `GET /library/facets` → `{genres[], platforms[], developers[], publishers[], franchises[], years[]}`
- `POST /library` `{gameId | (provider, externalId), status?='backlog', platform?, ownershipType?}` → 201 UserGame; 409 if present
- `GET /library/:id` → UserGame + `game` (full) + `recentSessions[≤20]` + `stats{sessionCount,totalMinutes}`
- `PATCH /library/:id` any of `status, personalRating(1-10|null), platform, ownershipType(digital|physical|subscription|free|borrowed|other), progress(0-100), notes, review, startedAt, completedAt, purchasePrice, purchaseCurrency, purchaseDate, baseMinutes`
  Side effects: `playing` sets `startedAt` if empty; `completed`/`mastered` sets `completedAt` and `progress=100` if empty; every status change is appended to `statusHistory`.
- `DELETE /library/:id` → 204 (also deletes its sessions)
- `POST /library/:id/to-wishlist` `{priority?}` → 201 Wishlist entry (UserGame removed)

UserGame full shape: `{id, status, statusHistory[], personalRating, baseMinutes, playtimeMinutes, sessionCount, lastPlayedAt, platform, ownershipType, progress, startedAt, completedAt, purchasePrice, purchaseCurrency, purchaseDate, notes, review, createdAt, game}`

## Wishlist (`/wishlist`, auth required)
- `GET /wishlist?sort=priority|recentlyAdded&page=` → `[{id, desiredPlatform, targetPrice, currentPrice, lowestPrice, currency, priority(low|medium|high), notes, createdAt, game}]`
- `POST /wishlist` `{gameId | (provider, externalId), desiredPlatform?, targetPrice?, priority?, notes?}` → 201; 409 if already in library or wishlist
- `PATCH /wishlist/:id`, `DELETE /wishlist/:id` (204)
- `POST /wishlist/:id/move-to-library` `{status?='owned', platform?, ownershipType?}` → 201 UserGame

## Play sessions (`/play-sessions`, auth required)
- `GET /play-sessions?userGameId=&from=&to=&page=` → newest first `[{id, userGameId, game:{id,title,coverImage}, startedAt, endedAt, durationMinutes, platform, notes}]`
- `POST /play-sessions` `{userGameId, startedAt, endedAt? | durationMinutes, platform?, notes?}` → 201 (recalculates playtime)
- `PATCH /play-sessions/:id`, `DELETE /play-sessions/:id` (204)

## Dashboard (`GET /dashboard`, auth)
`{overview:{total, completed, playing, backlog, wishlist, totalPlaytimeMinutes}, continuePlaying[≤6], backlogSnapshot:{count, items[≤5]}, recentlyAdded[≤6], recentlyCompleted[≤6]}` – list items have the library item shape.

## Analytics (`GET /analytics/overview`, auth)
`{totalMinutes, gamesCompleted, gamesAbandoned, averageRating, ratedCount, averageCompletionDays, statusBreakdown:{status:count}, topGenres, topPlatforms, topDevelopers, topFranchises}` where each top list is `[{name, minutes, games}]` (top 5 by minutes).
