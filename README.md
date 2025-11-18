# GameVault

GameVault is a simple full-stack web app that lets users manage a personal game library with **authentication**, **MongoDB-backed storage**, and a **modern static frontend**. Users can:

- Register and log in using email and password.
- Add games (with optional poster images) to a shared library.
- Filter games by platform, genre, and top rating.
- Maintain a personal **collection** (owned games) and **wishlist**.
- Interact with the same API using **Postman**, including adding many games at once.

---

## 1. Project Structure

- `backend/` – Node.js + Express API with MongoDB (Mongoose) and JWT auth.
- `frontend/` – Static HTML/CSS/JS website that talks to the backend API.
- `postman/GameVault.postman_collection.json` – Postman collection with all API requests.

The API base URL (from the frontend and Postman examples) assumes the backend runs on:

```text
http://localhost:5000/api
```

---

## 2. How to Run This Project Locally

### 2.1. Prerequisites

- **Node.js** (LTS version is fine)
- **npm** (comes with Node)
- **MongoDB** running locally or in the cloud (e.g. MongoDB Atlas)

### 2.2. Clone the repository

```bash
git clone <your-github-url-here>
cd GameVault
```

> Replace `<your-github-url-here>` with your actual GitHub HTTPS URL.

### 2.3. Backend setup (Express + MongoDB)

1. Go into the backend folder and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file inside `backend/` with the following variables:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/gamevault
   JWT_SECRET=some_super_secret_key
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```

   - `MONGODB_URI` can be any valid MongoDB connection string.
   - `JWT_SECRET` can be any random string; it is used to sign tokens.

3. Start the backend server in development mode (with auto-restart):
   ```bash
   cd backend
   npm run dev
   ```

   Or in normal mode:
   ```bash
   npm start
   ```

The API will be available at `http://localhost:5000`.

### 2.4. Frontend setup

The frontend is a static site (no build step).

1. From the repo root, open `frontend/index.html` or `frontend/view-games.html` in a browser **after** the backend is running.
2. For a smoother experience, serve the `frontend` folder using any simple static server (for example `live-server`, VS Code Live Server, or `npx serve frontend`).

The frontend JavaScript uses `http://localhost:5000/api` as the API base URL and will communicate with the backend you started.

---

## 3. API Overview (for Postman)

All API endpoints are under the base URL:

```text
http://localhost:5000/api
```

Most routes require a **JWT token** in the `Authorization` header:

```http
Authorization: Bearer <your_token_here>
```

Only **register** and **login** are public.

You can import the full Postman collection from:

- `postman/GameVault.postman_collection.json`

Below is a summary of all important endpoints and example request bodies so you can also create your own Postman requests easily.

### 3.1. Authentication

#### 3.1.1. Register

- **Method:** `POST`
- **URL:** `/api/auth/register`
- **Body (JSON):**
  ```json
  {
    "username": "player1",
    "email": "player1@example.com",
    "password": "secret123"
  }
  ```
- **Auth:** Not required.

#### 3.1.2. Login

- **Method:** `POST`
- **URL:** `/api/auth/login`
- **Body (JSON):**
  ```json
  {
    "email": "player1@example.com",
    "password": "secret123"
  }
  ```
- **Response:** contains `token` and basic user info. Copy this `token` and use it in the `Authorization: Bearer <token>` header for the routes below.

---

### 3.2. Game CRUD

All game routes below **require a valid JWT**.

#### 3.2.1. Add a single game

- **Method:** `POST`
- **URL:** `/api/games`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Body (JSON):**
  ```json
  {
    "title": "The Witcher 3",
    "platform": "PC",
    "genre": "RPG",
    "year": 2015,
    "rating": 4.8,
    "description": "Story-driven open world RPG.",
    "developer": "CD Projekt Red",
    "publisher": "CD Projekt",
    "posterUrl": "https://example.com/posters/witcher3.jpg"
  }
  ```

> `posterUrl` is **optional** – if you leave it out, the game will not show a poster image.

#### 3.2.2. Add multiple games at once (bulk insert)

- **Method:** `POST`
- **URL:** `/api/games/bulk`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Body (JSON):**
  ```json
  {
    "games": [
      {
        "title": "Forza Horizon 5",
        "platform": "Xbox",
        "genre": "Racing",
        "year": 2021,
        "rating": 4.7,
        "description": "Open-world racing in Mexico.",
        "developer": "Playground Games",
        "publisher": "Xbox Game Studios",
        "posterUrl": "https://example.com/posters/forza5.jpg"
      },
      {
        "title": "God of War Ragnarök",
        "platform": "PlayStation",
        "genre": "Action",
        "year": 2022,
        "rating": 4.9,
        "description": "Mythological action adventure.",
        "developer": "Santa Monica Studio",
        "publisher": "Sony",
        "posterUrl": "https://example.com/posters/gowr.jpg"
      }
    ]
  }
  ```

All games in the `games` array must have: `title`, `platform`, `genre`, `year`, `rating`, and `description`. If any entry is invalid, the whole request will return an error.

#### 3.2.3. Get all games

- **Method:** `GET`
- **URL:** `/api/games`
- **Headers:** `Authorization: Bearer <token>`

Returns all games (newest first) with `addedBy.username` populated.

#### 3.2.4. Get a single game by ID

- **Method:** `GET`
- **URL:** `/api/games/:id`
- **Example:** `/api/games/64f0c9b4a1234567890abcd1`
- **Headers:** `Authorization: Bearer <token>`

#### 3.2.5. Update a game

- **Method:** `PUT`
- **URL:** `/api/games/:id`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Body (JSON, any subset of fields):**
  ```json
  {
    "title": "The Witcher 3: Complete Edition",
    "rating": 4.9,
    "posterUrl": "https://example.com/posters/witcher3-complete.jpg"
  }
  ```

#### 3.2.6. Delete a game

- **Method:** `DELETE`
- **URL:** `/api/games/:id`
- **Headers:** `Authorization: Bearer <token>`

Also removes the game from all users’ collections and wishlists.

---

### 3.3. Game Filters & Queries

All filter routes require `Authorization: Bearer <token>`.

#### 3.3.1. Get games by platform

- **Method:** `GET`
- **URL:** `/api/games/platform/:platform`
- **Examples:**
  - `/api/games/platform/PC`
  - `/api/games/platform/PlayStation`

#### 3.3.2. Get games by genre

- **Method:** `GET`
- **URL:** `/api/games/genre/:genre`
- **Examples:**
  - `/api/games/genre/RPG`
  - `/api/games/genre/FPS`

#### 3.3.3. Get top-rated games

- **Method:** `GET`
- **URL:** `/api/games/top-rated`

Returns games with `rating >= 4.5`, sorted by rating and recency.

---

### 3.4. User Collection (Owned Games)

These endpoints manage the games in the **current logged-in user’s collection**.

#### 3.4.1. Get my collection

- **Method:** `GET`
- **URL:** `/api/games/user/collection`
- **Headers:** `Authorization: Bearer <token>`

Returns the user with `ownedGames` populated.

#### 3.4.2. Add a game to my collection

- **Method:** `POST`
- **URL:** `/api/games/user/collection`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Body (JSON):**
  ```json
  {
    "gameId": "<some_game_id>"
  }
  ```

#### 3.4.3. Remove a game from my collection

- **Method:** `DELETE`
- **URL:** `/api/games/user/collection/:gameId`
- **Headers:** `Authorization: Bearer <token>`

---

### 3.5. User Wishlist

These endpoints manage the games in the **current logged-in user’s wishlist**.

#### 3.5.1. Get my wishlist

- **Method:** `GET`
- **URL:** `/api/games/user/wishlist`
- **Headers:** `Authorization: Bearer <token>`

#### 3.5.2. Add a game to my wishlist

- **Method:** `POST`
- **URL:** `/api/games/user/wishlist`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Body (JSON):**
  ```json
  {
    "gameId": "<some_game_id>"
  }
  ```

#### 3.5.3. Remove a game from my wishlist

- **Method:** `DELETE`
- **URL:** `/api/games/user/wishlist/:gameId`
- **Headers:** `Authorization: Bearer <token>`

---