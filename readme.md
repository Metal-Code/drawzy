# Drawzy

A real-time multiplayer drawing and guessing game built with Node.js, Express, Socket.io, and React. Players take turns drawing AI-generated words while others guess in live chat. Supports persistent friend groups, a global leaderboard, guest play without registration, and a competitive mode with tab-switch detection.

Live: [drawzy-lemon.vercel.app](https://drawzy-lemon.vercel.app)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Socket Events](#socket-events)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [CI/CD Pipeline](#cicd-pipeline)

---

## Overview

Drawzy is a full-stack real-time game built as a monorepo with a separate Express backend and Vite/React frontend. The backend handles all game state in memory using Socket.io, meaning no database reads or writes occur during active gameplay. Only when a game concludes are scores persisted to SQLite via better-sqlite3.

Words for each game session are generated upfront before the game starts using the OpenRouter AI API, computing `total_rounds x total_players x 3` unique drawable words so there are zero API calls during active rounds. If the AI call fails, a curated fallback word list is used automatically.

The application supports two user types: registered accounts with persistent scores and group membership, and guests who can play immediately with a username only and no registration required.

---

## Features

### Core Gameplay
- Real-time drawing canvas synchronized across all players via Socket.io stroke broadcasting
- Each drawer gets three word choices per turn, categorized by difficulty (easy, medium, hard)
- Scoring calculated by speed of correct guess, awarding more points for faster answers
- Configurable rounds (2-10), draw time (30/60/90/120 seconds), and difficulty level per session
- Round transitions with word reveal overlay and updated scoreboard after each turn
- Post-game results screen with final scores and winner display

### Room System
- Instant room creation with a six-character room code for sharing
- Rooms persist as long as at least one player is present; they do not close after a game ends
- Players can join mid-game and participate from the next turn with a score of zero
- Host migration when the current host disconnects or leaves
- When a player leaves mid-game they are removed immediately with no reconnect window

### Friend Groups
- Persistent groups with an invite code that members join once and retain membership
- Group detail page showing member leaderboard ranked by total points
- Match history per group showing who won each game and when
- One-click game start from the group page with automatic Socket.io notification to all online members, eliminating the need to share room codes
- Group scores contribute to the global leaderboard

### Global Leaderboard
- Top players ranked by total points accumulated across all games
- Displays games played, games won, and total points per player
- Guest players are excluded from the leaderboard
- Publicly accessible without authentication

### Competitive Mode
- Optional per-room setting toggled by the host before game start
- Requests fullscreen on game start using the Fullscreen API
- Detects tab switching using the Page Visibility API and window blur events
- Emits tab-switch events to the server with a 1.5-second grace period to avoid false positives from system notifications
- Broadcasts a prominent alert banner to all players when a tab switch is detected, showing the player name and cumulative switch count
- Tab switch counts visible on each player's scoreboard card and in the post-game results

### Guest Play
- No registration required to start or join a game
- Guests enter a username and receive a UUID-based session identity
- Guest sessions exist only in memory and are cleared on page load to prevent stale session data
- Guest scores are not persisted to the database or leaderboard

### AI Word Generation
- Words generated per game session via OpenRouter API before the game starts
- Total word count computed as `rounds x players x 3` to ensure one unique set of three choices per player per round
- Words requested by difficulty level matching the host's selected setting
- System prompt engineered to request only concrete, drawable words appropriate to the selected difficulty
- Fallback word list per difficulty level used automatically if the API call fails, with word repetition handling to prevent crashes on large games

---

## Architecture

```
Client (React)
     |
     | HTTP (REST)          WebSocket (Socket.io)
     |                              |
     v                              v
Express Server  <----------->  Socket.io Server
     |                              |
     v                              v
SQLite (better-sqlite3)      In-Memory Room State
```

The Express HTTP server handles authentication, group management, and leaderboard queries. The Socket.io server runs on the same Node.js process attached to the same HTTP server and manages all real-time game logic.

Game state — including the current room, players, scores, word sets, strokes, and timers — lives entirely in a server-side JavaScript object during gameplay. The database is only written to at game end for registered players, and at group creation, join, and game completion events.

Drawing synchronization works by having the drawer emit stroke events containing x/y coordinates, color, brush size, and tool type. The server relays these to all other players in the room who draw each stroke on their local canvas. Strokes are also accumulated in the room state to replay for players who join mid-round.

---

## Tech Stack

**Backend**
- Node.js with ES Modules
- Express.js for HTTP routing
- Socket.io for bidirectional real-time communication
- better-sqlite3 for synchronous SQLite database access
- bcrypt for password hashing
- jsonwebtoken for session management via HTTP-only cookies
- OpenAI SDK configured against OpenRouter for AI word generation
- uuid for room codes and entity IDs

**Frontend**
- React 18 with Vite
- React Router v6 for client-side routing
- React Context API for global state (auth, socket, room, toast)
- Socket.io client
- Tailwind CSS with custom design tokens
- HTML5 Canvas API for drawing
- Web Audio API for sound effects
- Fredoka and Nunito fonts

**Infrastructure**
- Render for backend hosting (Node web service)
- Vercel for frontend hosting (static Vite build)
- GitHub Actions for CI/CD
- UptimeRobot for uptime monitoring and preventing Render spin-down

---

## Project Structure

```
drawzy/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── constants.js        # Allowed CORS origins
│   │   │   └── env.js              # dotenv loader
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── group.controller.js
│   │   │   └── leaderboard.controller.js
│   │   ├── db/
│   │   │   ├── index.js            # SQLite connection
│   │   │   └── schema.js           # Table creation
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js  # JWT verification
│   │   │   └── error.middleware.js # Global error handler
│   │   ├── models/
│   │   │   ├── user.model.js
│   │   │   └── group.model.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── group.routes.js
│   │   │   └── leaderboard.routes.js
│   │   ├── services/
│   │   │   └── words.service.js    # AI word generation
│   │   ├── socket/
│   │   │   ├── index.js            # Socket event registration
│   │   │   ├── room.js             # Room lifecycle
│   │   │   ├── game.js             # Game loop and state machine
│   │   │   ├── draw.js             # Stroke relay
│   │   │   └── chat.js             # Guess handling and scoring
│   │   ├── utils/
│   │   │   ├── ApiError.js
│   │   │   ├── ApiResponse.js
│   │   │   └── asyncHandler.js
│   │   ├── app.js
│   │   └── index.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── RoomContext.jsx
│   │   │   ├── SocketContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Lobby.jsx
│   │   │   ├── Game.jsx
│   │   │   ├── PostGame.jsx
│   │   │   ├── Groups.jsx
│   │   │   ├── GroupDetail.jsx
│   │   │   └── Leaderboard.jsx
│   │   ├── components/
│   │   │   ├── Canvas.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Scoreboard.jsx
│   │   │   ├── Timer.jsx
│   │   │   └── WordPicker.jsx
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   ├── helpers.js
│   │   │   └── socket.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   └── package.json
└── .gitignore
```

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- An OpenRouter API key (free tier available at openrouter.ai)

### Installation

Clone the repository:

```bash
git clone https://github.com/Metal-Code/drawzy.git
cd drawzy
```

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

### Running Locally

Start the backend (from the backend directory):

```bash
npm run dev
```

The server starts on port 8000. SQLite creates `drawzy.db` automatically in the backend root on first run.

Start the frontend (from the frontend directory):

```bash
npm run dev
```

The frontend starts on `http://localhost:5173`.

---

## Environment Variables

Create a `.env` file in the `backend` directory:

```
PORT=8000
JWT_SECRET=your_jwt_secret_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

`CORS_ORIGIN` is managed directly in `src/config/constants.js` as an array of allowed origins to support multiple environments simultaneously.

---

## API Reference

All endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/register` | No | Register a new user with username, password, and avatar |
| POST | `/auth/login` | No | Login and receive a JWT in an HTTP-only cookie |
| POST | `/auth/logout` | Yes | Clear the authentication cookie |
| GET | `/auth/me` | Yes | Return the currently authenticated user |

### Groups

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/groups/create` | Yes | Create a new group, auto-add creator as member |
| POST | `/groups/join` | Yes | Join a group by invite code |
| GET | `/groups/my-groups` | Yes | Fetch all groups the authenticated user belongs to |
| GET | `/groups/:groupId/members` | Yes | Fetch all members with their total points |
| GET | `/groups/:groupId/history` | Yes | Fetch match history with winner details |

### Leaderboard

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/leaderboard` | No | Fetch top 50 players ordered by total points |

---

## Socket Events

### Client to Server

| Event | Payload | Description |
|-------|---------|-------------|
| `create-room` | `{ user, settings }` | Create a new room and become host |
| `join-room` | `{ roomId, userId, username, avatar, isGuest }` | Join an existing room |
| `leave-room` | `{ roomId, userId }` | Leave a room voluntarily |
| `start-game` | `{ roomId, userId, settings }` | Host starts the game with selected settings |
| `word-chosen` | `{ roomId, word }` | Drawer selects a word from the three choices |
| `draw` | `{ roomId, stroke }` | Emit a drawing stroke during the drawing phase |
| `undo` | `{ roomId, userId }` | Undo the last stroke on all canvases |
| `clear-canvas` | `{ roomId, userId }` | Clear the entire canvas for all players |
| `guess` | `{ roomId, userId, username, guess }` | Submit a guess during the drawing phase |
| `tab-switch` | `{ roomId, userId, username }` | Notify server of a tab switch in competitive mode |
| `join-group-channel` | `{ groupId }` | Join the persistent Socket.io channel for a group |
| `group-game-started` | `{ groupId, roomId }` | Notify all group members that a game has started |
| `reconnect-to-room` | `{ token, userId }` | Reconnect to a group room using a reconnect token |

### Server to Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room-created` | `{ roomId, room }` | Sent to creator after room is created |
| `room-joined` | `{ roomId, room }` | Sent to the joining player with full room state |
| `player-joined` | `{ player, room, message }` | Broadcast to room when a player joins |
| `player-left` | `{ userId, message }` | Broadcast when a player leaves |
| `host-changed` | `{ newHost, room }` | Broadcast when host migrates |
| `game-started` | `{ room }` | Broadcast to all players when game begins |
| `picking-phase` | `{ drawerId, drawerName, currentRound, totalRounds }` | Broadcast when a player is choosing a word |
| `choose-word` | `{ wordChoices }` | Sent only to the current drawer with three word options |
| `drawing-phase` | `{ hint, wordLength, drawTime }` | Broadcast when drawing begins |
| `your-word` | `{ word }` | Sent only to the drawer with the actual word |
| `draw` | `stroke` | Relay stroke to all non-drawing players |
| `canvas-cleared` | none | Broadcast canvas clear to all players |
| `undo` | `{ strokes }` | Broadcast updated stroke history after undo |
| `wrong-guess` | `{ userId, username, guess }` | Broadcast an incorrect guess to all players |
| `correct-guess` | `{ userId, username, score, message }` | Broadcast a correct guess with points awarded |
| `turn-ended` | `{ word, scores }` | Broadcast at end of each turn with the word and scores |
| `game-over` | `{ winner, finalScores }` | Broadcast when all rounds complete |
| `back-to-lobby` | `{ room }` | Broadcast after game resets, returning players to lobby |
| `tab-switched` | `{ userId, username, count }` | Broadcast tab switch alert in competitive mode |
| `group-game-invite` | `{ roomId }` | Sent to group channel members when a game starts |
| `reconnect-token` | `{ token }` | Sent to a player on disconnect in a group room |
| `reconnected` | `{ room, strokes }` | Sent on successful reconnect with full game state |

---

## Database Schema

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT DEFAULT 'default',
    total_points INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE group_members (
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE group_match_history (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    winner_id TEXT NOT NULL,
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (winner_id) REFERENCES users(id)
);
```

---

## Deployment

### Backend (Render)

The backend is deployed as a Node.js web service on Render.

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node src/index.js`
- Environment variables are set directly in the Render dashboard

SQLite on Render uses the persistent disk attached to the service. The `drawzy.db` file is created in the backend root on first boot and persists across deployments.

An UptimeRobot monitor pings `https://drawzy-j102.onrender.com/api/leaderboard` every 5 minutes to prevent the free tier instance from spinning down.

### Frontend (Vercel)

The frontend is deployed as a static Vite build on Vercel.

- Root Directory: `frontend`
- Framework Preset: Vite
- Build Command: `vite build` (auto-detected)
- Output Directory: `dist` (auto-detected)

The frontend connects to the Render backend via the `BASE_URL` constant in `src/utils/api.js` and the Socket.io client URL in `src/utils/socket.js`.

---

## CI/CD Pipeline

Automated deployment is handled by GitHub Actions. On every push to the `main` branch, two parallel jobs run:

**Deploy Backend to Render** triggers a manual deploy via the Render API using a deploy hook. This causes Render to pull the latest commit and restart the service.

**Deploy Frontend to Vercel** checks out the code, installs the Vercel CLI, and runs `vercel deploy --prod` using the stored project and organization IDs.

Both jobs run concurrently since they are independent of each other.

Required GitHub Secrets:

| Secret | Description |
|--------|-------------|
| `RENDER_API_KEY` | Render account API key |
| `RENDER_SERVICE_ID` | The `srv-xxxxxxxx` ID of the backend web service |
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_ORG_ID` | Vercel team ID |
| `VERCEL_PROJECT_ID` | Vercel project ID for the drawzy frontend |