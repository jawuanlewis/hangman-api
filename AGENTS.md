# Project Context - `hangman-api`

REST API backend for a Hangman word-guessing game.

## Stack

- **Runtime:** Node.js >=20, Express 5.x
- **Database:** MongoDB (native driver)
- **Auth:** JWT (stateless; token carries `gameId`, no user accounts)
- **Validation:** Zod
- **Security:** Helmet, CORS whitelist, express-rate-limit
- **Testing:** Vitest + Supertest + MongoDB Memory Server
- **Package manager:** pnpm

## Architecture

```text
routes/ → middleware/ → controllers/ → config/
```

- `server.js` — entry point
- `app.js` — Express setup
- `routes/gameRoutes.js` — route definitions
- `middleware/` — auth (JWT), validation (Zod), error handler, rate limiter
- `controllers/gameController.js` — all game logic
- `config/db.js` — all MongoDB operations
- `config/jwt.js`, `cors.js` — token and CORS setup

## API

Base path: `/api/v1/games`

| Method | Endpoint        | Auth   | Description              |
| ------ | --------------- | ------ | ------------------------ |
| POST   | `/api/v1/games` | No     | Create game; returns JWT |
| GET    | `/api/v1/games` | Bearer | Get game state           |
| PATCH  | `/api/v1/games` | Bearer | Submit letter guess      |
| DELETE | `/api/v1/games` | Bearer | Delete game              |
| GET    | `/health`       | No     | Health check             |

Levels: `Movies`, `Video Games`, `Sports`, `Idioms`, `TV Shows`, `Food`, `Animals`, `Cities`

## MongoDB Collections

- **games** — game state with 24h TTL auto-expiry (`expiresAt`)
- **words** — category + word (stored uppercase; spaces/hyphens/punctuation preserved as-is)

## Conventions

- Files: camelCase; functions/vars: camelCase; constants: UPPER_SNAKE_CASE
- All responses: `{ success: bool, error?: string, ...data }`
- HTTP status codes: 201 create, 400 validation, 401 auth, 403 forbidden, 404 not found
- Async/await throughout; Express 5 handles async errors natively (no wrapper needed)
- Zod schemas live in `schemas/`; validate at route level via `validation.js` middleware

## Testing

```bash
pnpm test               # all tests
pnpm test:unit          # unit only
pnpm test:integration   # integration only
pnpm test:coverage      # coverage report
```

- In-memory MongoDB for tests; rate limiters disabled in test mode
- Test data seeded in `tests/setup.js` (16 words across all 8 categories)
- Database cleared after each test

## Dev Commands

```bash
pnpm dev        # development (nodemon)
pnpm start      # production
pnpm lint       # check formatting
pnpm format     # fix formatting
```

## Gotchas

- The API does not strictly follow REST conventions — all game endpoints share a single path (`/api/v1/games`), differentiated only by HTTP method. This is intentional; do not refactor toward path-based resource routing (e.g., `/api/v1/games/:id`)
- Express 5 is used — async errors propagate natively; don't add `express-async-errors`
- JWT is not user auth — it's a game session token containing `gameId`
- Word matching is case-insensitive; spaces, hyphens, and punctuation are pre-revealed
- CORS origins are loaded from env vars; undefined values are filtered out
- Rate limiters are replaced with `noOpLimiter` in test environment
