# Hangman API

## 📚 Table of Contents

- [Project Overview](#-project-overview)
- [Live Demo](#-live-demo)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Installation](#%EF%B8%8F-installation)
- [Usage](#%EF%B8%8F-usage)
- [Testing](#-testing)
- [Next Steps](#-next-steps)
- [Credits](#-credits)

## 🧠 Project Overview

Backend API for my own personal, web-based version of the game **_Hangman_**. This REST API handles all game logic and state management, serving the [frontend client](https://github.com/jawuanlewis/hangman-client). Players must correctly guess the letters of a given mystery word within 6 attempts. There are 8 available themes of words/phrases for players to guess:

1. Movies
2. Video Games
3. Sports
4. Idioms
5. TV Shows
6. Food
7. Animals
8. Cities

## 🚀 Live Demo

- Play the game here: [Hangman](https://hangman.jawuanlewis.dev)
- Initial designs available here: [Figma Designs](https://www.figma.com/design/tOop8Aqlh0zycbjdERI0Ut/Hangman?node-id=0-1&t=uR8s9pxzcX4Zwzt0-1)

## 💻 Tech Stack

- **Runtime:** Node.js (>=20.0.0)
- **Framework:** Express 5
- **Database:** MongoDB
- **Authentication:** JSON Web Tokens (JWT)
- **Validation:** Zod
- **Security:** Helmet, CORS, express-rate-limit
- **Testing:** Vitest, Supertest, MongoDB Memory Server
- **Formatting:** Prettier
- **Deployment:** Railway

## 📁 Project Structure

```text
hangman-api/
├── config/
│   ├── cors.js              # CORS configuration
│   ├── db.js                # MongoDB connection and operations
│   ├── jwt.js               # JWT generation and verification
│   └── websocket.js         # Socket.io setup (future multiplayer)
├── controllers/
│   └── gameController.js    # Game logic (create, get, update, delete)
├── middleware/
│   ├── auth.js              # JWT authentication
│   ├── errorHandler.js      # Global error and 404 handling
│   ├── rateLimit.js         # Rate limiting per endpoint
│   └── validation.js        # Zod schema validation
├── routes/
│   └── gameRoutes.js        # Game API route definitions
├── schemas/
│   └── gameSchemas.js       # Zod request validation schemas
├── tests/
│   ├── integration/         # Full API flow tests
│   ├── unit/                # Individual module tests
│   └── setup.js             # Test setup (MongoDB Memory Server)
│
├── app.js                   # Express app configuration
├── server.js                # Server entry point
├── package.json
└── vitest.config.js         # Vitest configuration
```

## 🔗 API Endpoints

All game endpoints are prefixed with `/api/v1/games`. Game state is tied to a JWT token issued on game creation — include it as a `Bearer` token in the `Authorization` header for all subsequent requests.

| Method | Endpoint        | Auth | Description             |
| ------ | --------------- | ---- | ----------------------- |
| POST   | `/api/v1/games` | No   | Create a new game       |
| GET    | `/api/v1/games` | Yes  | Get current game state  |
| PATCH  | `/api/v1/games` | Yes  | Submit a letter guess   |
| DELETE | `/api/v1/games` | Yes  | Delete the current game |
| GET    | `/health`       | No   | Health check            |

### Create a new game

```text
POST /api/v1/games
```

**Request body:**

```json
{
  "level": "Sports"
}
```

`level` must be one of: `Movies`, `Video Games`, `Sports`, `Idioms`, `TV Shows`, `Food`, `Animals`, `Cities`

**Response:** `201 Created`

```json
{
  "success": true,
  "token": "<jwt>",
  "game": {
    "level": "Sports",
    "attempts": 6,
    "currentProgress": "_ _ _ _ _ _ _ _ _",
    "gameOver": false
  }
}
```

### Get current game state

```text
GET /api/v1/games
Authorization: Bearer <jwt>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "game": {
    "level": "Sports",
    "attempts": 5,
    "currentProgress": "_ A _ _ _ _ _ _ _",
    "gameOver": false,
    "guessedLetters": ["a", "e"]
  }
}
```

### Submit a letter guess

```text
PATCH /api/v1/games
Authorization: Bearer <jwt>
```

**Request body:**

```json
{
  "letter": "b"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "game": {
    "level": "Sports",
    "attempts": 5,
    "currentProgress": "B A _ _ _ _ _ _ _",
    "gameOver": false,
    "guessedLetters": ["a", "b", "e"],
    "isCorrectGuess": true,
    "won": false
  }
}
```

### Delete the current game

```text
DELETE /api/v1/games
Authorization: Bearer <jwt>
```

**Response:** `204 No Content`

## ⚙️ Installation

**NOTE:** In order to actually run this project locally, you would need your own MongoDB instance with a seeded words collection. This is meant to be my own personal project, but I will still give setup instructions below.

### Clone the repository

```bash
git clone https://github.com/jawuanlewis/hangman-api.git
```

### Install dependencies

```bash
cd hangman-api
pnpm install
```

### Set up environment variables

Copy the example file and update the values with your own configuration:

```bash
cp .env.example .env
```

Key variables:

- **MONGO_URI:** MongoDB connection string (local or Atlas)
- **DB_NAME:** database name
- **JWT_SECRET:** secret key for signing tokens
- **PORT:** server port (default: `3000`)

See `.env.example` for the full list of available variables.

### Run the development server

```bash
pnpm dev
```

## ▶️ Usage

Once the server is running, the API is available at `http://localhost:3000`. You can test it with any HTTP client:

```bash
# Create a new game
curl -X POST http://localhost:3000/api/v1/games \
  -H "Content-Type: application/json" \
  -d '{"level": "Movies"}'

# Make a guess (using the token from the response above)
curl -X PATCH http://localhost:3000/api/v1/games \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"letter": "e"}'
```

## 🧪 Testing

Tests are written with Vitest and Supertest, using MongoDB Memory Server for an isolated database during test runs.

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run unit or integration tests separately
pnpm test:unit
pnpm test:integration

# Generate a coverage report
pnpm test:coverage
```

## 🔮 Next Steps

### Future Features

- Add a main game page, with no particular theme and an increasing level of difficulty with each word.
- Generate small hints each time the user guesses incorrectly (potentially using OpenAI API).
- Add multiplayer support via WebSockets.
- Add a "How to Play" page.

## 🙏 Credits

- **Social Media Icons:** [Icons8](https://icons8.com)
- **Level Images:** generated with [ImageFX](https://labs.google/fx/tools/image-fx)
