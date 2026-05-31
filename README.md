# 🏋️ FitSync

> Track. Progress. Repeat.

**FitSync** is a full-stack web app for tracking workouts, visualizing fitness
progress, and staying motivated through streaks, XP/levels, goals, and
achievement badges. It is built as a complete, demo-ready MVP suitable for a
university software-engineering project.

- **Frontend:** React 18 + Vite (JavaScript, no TypeScript)
- **Backend:** Node.js + Express (REST API, ES modules)
- **Database:** MySQL 8 / MariaDB 10.4+ (`mysql2` driver)

---

## ✨ Features

| Area | What it does |
|------|--------------|
| **Authentication** | Register / login with JWT, hashed passwords (bcrypt), protected routes |
| **Dashboard** | Personal greeting, streak, weekly stats, XP/level bar, volume trend, recent workouts, recently-earned badges |
| **Low-effort logging** | Add exercises from a 30-item library, dynamic set inputs per exercise type, "🔁 Repeat last workout" |
| **Exercise library** | Searchable / filterable; create your own custom exercises |
| **Progress** | Charts for training volume, weekly frequency, muscle-group split, body-weight trend, and per-exercise personal records (with estimated 1RM) |
| **Goals** | Targets for workouts/week, streaks, total volume, target weight — progress computed automatically from your data |
| **Gamification** | XP + levels, daily streaks, and 10 achievement badges (bronze/silver/gold) awarded automatically |
| **Profile** | Edit details, log body weight / body-fat over time |
| **UX** | Modern dark theme, responsive layout (sidebar → mobile bottom nav), toast feedback after every action |

---

## 🗂️ Project structure

```
gym_god/
├── server/                      # Express REST API
│   ├── src/
│   │   ├── config/env.js        # Centralized env config
│   │   ├── db/
│   │   │   ├── pool.js          # mysql2 connection pool
│   │   │   ├── schema.sql       # Tables (drops + recreates)
│   │   │   ├── seed.sql         # Static reference data (exercises, badges)
│   │   │   ├── seed.js          # Demo user + sample workouts (dynamic dates)
│   │   │   └── setup.js         # One-command DB bootstrap
│   │   ├── middleware/          # auth (JWT), error handler
│   │   ├── modules/             # Feature modules (routes/controller/service)
│   │   │   ├── auth/  users/  exercises/  workouts/
│   │   │   ├── goals/ stats/   gamification/
│   │   ├── routes/index.js      # API route aggregation
│   │   ├── utils/               # ApiError, asyncHandler, validate, token
│   │   ├── app.js               # Express app wiring
│   │   └── server.js            # Entry point
│   └── scripts/smoke-test.mjs   # Optional end-to-end API check
│
└── client/                      # React + Vite frontend
    └── src/
        ├── api/client.js        # fetch wrapper + token storage
        ├── context/             # Auth + Toast providers
        ├── components/          # Layout, icons, reusable UI
        ├── pages/               # Login, Register, Dashboard, LogWorkout, …
        ├── utils/format.js      # Display helpers
        ├── App.jsx              # Router + protected routes
        └── index.css            # Design system
```

---

## 🚀 Getting started

### Prerequisites
- **Node.js 18+**
- **MySQL 8** (or MariaDB 10.4+) running locally

### 1. Database + backend

```bash
cd server
cp .env.example .env          # then edit DB_USER / DB_PASSWORD to match your MySQL
npm install
npm run db:setup              # creates the `fitsync` DB, schema, and demo data
npm run dev                   # API on http://localhost:4000
```

`npm run db:setup` is **idempotent** — it drops and recreates everything, so you
can re-run it any time to reset to a clean, seeded state.

> The setup script connects with the credentials in `.env`, creates the database
> if it doesn't exist, runs `schema.sql`, loads the exercise/badge reference data
> from `seed.sql`, then seeds a demo account with realistic recent workouts.

### 2. Frontend

```bash
cd client
npm install
npm run dev                   # app on http://localhost:5173
```

The Vite dev server proxies `/api` → `http://localhost:4000`, so no extra config
is needed. Open **http://localhost:5173** and log in.

### 🔑 Demo account
```
Email:    demo@fitsync.app
Password: demo1234
```
(The login form is pre-filled — just click **Log in**.)

---

## ⚙️ Environment variables (`server/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | API port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `DB_HOST` / `DB_PORT` | `127.0.0.1` / `3306` | MySQL connection |
| `DB_USER` / `DB_PASSWORD` | `root` / `` | MySQL credentials |
| `DB_NAME` | `fitsync` | Database name |
| `JWT_SECRET` | _(set me)_ | Secret for signing tokens |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |

---

## 🧱 Database schema

9 tables with foreign keys and cascading deletes:

- **users** — account, profile, XP & level
- **exercises** — shared library + per-user custom exercises (`metric_type` drives the logging UI)
- **workouts** → **workout_exercises** → **workout_sets** — a session and its nested data
- **goals** — targets with auto-computed progress
- **body_metrics** — weight / body-fat over time (one row per day)
- **badges** + **user_badges** — achievement definitions and earned records

---

## 🔌 API overview

All endpoints are prefixed with `/api`. Protected routes require
`Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` · `/auth/login` | Create account / sign in |
| `GET` | `/auth/me` | Current user |
| `PATCH` | `/users/me` | Update profile |
| `GET`/`POST` | `/users/me/metrics` | Body-weight history / add entry |
| `GET`/`POST` | `/exercises` | List (filterable) / create custom |
| `GET`/`POST`/`DELETE` | `/workouts` | List / create / delete |
| `GET` | `/workouts/:id` · `/workouts/last` | Detail / template for repeat |
| `GET`/`POST`/`PATCH`/`DELETE` | `/goals` | Manage goals |
| `GET` | `/stats/dashboard` · `/stats/progress` | Aggregated data for the UI |
| `GET` | `/gamification/badges` · `/gamification/level` | Achievements & level |

### Verify the API (optional)
With the server running and database seeded:
```bash
cd server && npm run test:smoke
```

---

## 🛠️ Tech notes
- Clean modular backend: each feature has its own **routes → controller → service**.
- Centralized error handling with a custom `ApiError` and consistent JSON shape.
- Request validation with **Zod**.
- Workout creation is **transactional** (workout + exercises + sets), then awards
  XP and evaluates badges.
- Streaks, volume, goal progress, and PRs are computed in SQL/service code from
  the raw data — nothing is faked.
