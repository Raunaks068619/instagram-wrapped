# API Documentation

Base URL: `http://localhost:4000`

## Health
### GET `/health`
Returns service and DB status.

## Auth
### GET `/auth/instagram/start`
Creates OAuth state and returns `{ authUrl, state }`.

### GET `/auth/instagram/callback?code=...&state=...`
Validates state, token exchange, links Instagram account, redirects to dashboard.

## Instagram Data
### GET `/api/instagram/profile`
Returns linked account and latest profile payload.

### GET `/api/instagram/media`
Fetches media from Instagram/mock and upserts into `ig_media`.

### POST `/api/instagram/insights/sync`
Body: `{ "days": 30 }` (optional)
Syncs daily insight records into `ig_insights_daily`.

## Wrapped
### POST `/api/wrapped/generate`
Body: `{ "year": 2026 }`
Aggregates media + insights, generates image, stores/updates `wrapped_reports`.

### GET `/api/wrapped/:year`
Fetches wrapped report for linked user and selected year.
