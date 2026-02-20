# Instagram Wrapped MVP

A full-stack TypeScript MVP that authenticates users with Instagram Graph API (Facebook OAuth), syncs Instagram data, and generates Spotify-Wrapped style reports with AI-generated visuals.

## Stack
- Backend: Node.js + Express + TypeScript + Prisma
- Frontend: React + Vite + TypeScript
- DB: PostgreSQL

## Project Structure
- `backend/` API server + OAuth + Prisma schema + wrapped generation
- `frontend/` React app (login, dashboard, wrapped slides)
- `docs/` architecture, API, security notes
- `scripts/` DB bootstrap SQL and helper scripts

## Quick Start

### 1) Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL running locally

### 2) Configure environment
Copy `.env.example` values into `backend/.env` and `frontend/.env`.

Backend minimal env:
```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/instagram_wrapped
MOCK_MODE=true
PORT=4000
FRONTEND_URL=http://localhost:5173
```

Frontend minimal env:
```env
VITE_API_BASE_URL=http://localhost:4000
```

### 3) Install dependencies
```bash
npm install
npm install -w backend
npm install -w frontend
```

### 4) Initialize DB
```bash
psql -h localhost -U admin -d postgres -f scripts/create-db.sql
npm run prisma:generate -w backend
npm run prisma:push -w backend
```

### 5) Run apps
```bash
npm run dev -w backend
npm run dev -w frontend
```

Backend: `http://localhost:4000`  
Frontend: `http://localhost:5173`

## Mock/Fallback Mode
Set `MOCK_MODE=true` to run without Instagram credentials. The app seeds synthetic profile/media/insights data and still generates wrapped reports.

## Quality Gates
```bash
npm run build -w backend
npm run build -w frontend
```

## Key Endpoints
- `GET /auth/instagram/start`
- `GET /auth/instagram/callback`
- `GET /api/instagram/profile`
- `GET /api/instagram/media`
- `POST /api/instagram/insights/sync`
- `POST /api/wrapped/generate`
- `GET /api/wrapped/:year`

See `docs/api.md` for complete request/response details.
