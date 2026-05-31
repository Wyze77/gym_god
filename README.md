# FitSync

FitSync is a web application for tracking workouts and monitoring fitness
progress over time. Users can log training sessions, browse an exercise library,
set goals, and review their progress through charts and summary statistics.

This project was built as a full-stack software engineering exercise. It uses a
React front end, an Express REST API, and a MySQL database.

## Tech stack

- Front end: React 18 with Vite (JavaScript)
- Back end: Node.js with Express (REST API, ES modules)
- Database: MySQL 8 (or MariaDB 10.4+), accessed with the `mysql2` driver
- Auth: JSON Web Tokens with bcrypt password hashing
- Validation: Zod

## Features

- User registration and login with hashed passwords and JWT-based sessions
- Workout logging: add exercises from a library and record sets (reps, weight,
  duration, or distance depending on the exercise)
- Exercise library with search and category filters, plus user-created exercises
- Dashboard with summary statistics, current streak, and recent activity
- Progress page with charts for training volume, workout frequency, muscle-group
  distribution, body weight, and per-exercise personal records
- Goals that are tracked automatically from logged data (workouts per week,
  streak length, total volume, target body weight)
- Achievement badges and a simple experience/level system based on activity
- Profile management and body-weight history

## Project structure

```
gym_god/
├── server/                     Express REST API
│   ├── src/
│   │   ├── config/             Environment configuration
│   │   ├── db/                 Connection pool, schema.sql, seed files, setup script
│   │   ├── middleware/         Auth and error handling
│   │   ├── modules/            Feature modules (routes, controller, service)
│   │   │   ├── auth/  users/  exercises/  workouts/
│   │   │   ├── goals/ stats/  gamification/
│   │   ├── routes/             API route registration
│   │   ├── utils/              Shared helpers (errors, validation, tokens)
│   │   ├── app.js              Express app setup
│   │   └── server.js           Entry point
│   └── scripts/                Optional API smoke test
└── client/                     React + Vite front end
    └── src/
        ├── api/                Fetch wrapper and token storage
        ├── context/            Auth and toast providers
        ├── components/         Layout, icons, shared UI
        ├── pages/              Page components
        ├── utils/              Formatting helpers
        ├── App.jsx             Routing and protected routes
        └── index.css           Styles
```

The back end follows a modular layout. Each feature has its own routes,
controller, and service so that request handling, business logic, and data
access stay separated.

## Requirements

- Node.js 18 or newer
- A running MySQL 8 or MariaDB 10.4+ server

## Setup

### 1. Database and back end

```
cd server
cp .env.example .env
```

Edit `.env` and set `DB_USER` and `DB_PASSWORD` to match your MySQL server, then:

```
npm install
npm run db:setup
npm run dev
```

`npm run db:setup` creates the `fitsync` database if it does not exist, runs the
schema, loads the exercise and badge reference data, and inserts a demo account
with sample workouts. It can be re-run at any time to reset the database to a
clean state.

The API runs on http://localhost:4000.

### 2. Front end

```
cd client
npm install
npm run dev
```

The app runs on http://localhost:5173. The Vite dev server proxies API requests
to the back end, so no extra configuration is needed.

### Demo account

```
Email:    demo@fitsync.app
Password: demo1234
```

The login form is pre-filled with these credentials.

## Environment variables (server/.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | API port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `DB_HOST` / `DB_PORT` | `127.0.0.1` / `3306` | MySQL host and port |
| `DB_USER` / `DB_PASSWORD` | `root` / empty | MySQL credentials |
| `DB_NAME` | `fitsync` | Database name |
| `JWT_SECRET` | (set this) | Secret used to sign tokens |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |

## Database schema

The schema has nine tables with foreign keys and cascading deletes:

- `users` - account details, profile, experience points and level
- `exercises` - shared library plus user-created exercises; `metric_type`
  determines which fields apply when logging
- `workouts`, `workout_exercises`, `workout_sets` - a session and its nested data
- `goals` - targets with progress derived from the user's data
- `body_metrics` - body weight and body-fat entries (one row per day)
- `badges`, `user_badges` - badge definitions and the badges each user has earned

## API endpoints

All routes are prefixed with `/api`. Protected routes require an
`Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register`, `/auth/login` | Create account, sign in |
| GET | `/auth/me` | Current user |
| PATCH | `/users/me` | Update profile |
| GET, POST | `/users/me/metrics` | Body-weight history and new entries |
| GET, POST | `/exercises` | List (with filters) and create custom exercises |
| GET, POST, DELETE | `/workouts` | List, create, delete |
| GET | `/workouts/:id`, `/workouts/last` | Workout detail and last workout |
| GET, POST, PATCH, DELETE | `/goals` | Manage goals |
| GET | `/stats/dashboard`, `/stats/progress` | Aggregated data for the UI |
| GET | `/gamification/badges`, `/gamification/level` | Badges and level |

## Checking the API

With the server running and the database set up, an optional script runs a set
of requests against the API:

```
cd server
npm run test:smoke
```

## Notes

- Statistics such as streaks, total volume, goal progress, and personal records
  are computed from the stored workout data rather than stored directly.
- Creating a workout is handled in a single database transaction so that the
  workout, its exercises, and its sets are saved together.
