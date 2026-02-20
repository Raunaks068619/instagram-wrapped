# Architecture

## Overview
Instagram Wrapped MVP is a two-tier app:
1. **Frontend (React + Vite):** Handles user interaction, OAuth initiation, dashboard stats, and wrapped slides rendering.
2. **Backend (Express + Prisma):** Handles OAuth, data sync, report generation, and data persistence.

## Components
- `auth.routes.ts`: OAuth start/callback endpoints and token placeholder flow.
- `instagram.routes.ts`: Profile/media/insights sync APIs.
- `wrapped.routes.ts`: Wrapped generation + retrieval by year.
- `instagram.service.ts`: Graph API integration + mock fallback.
- `openai.service.ts`: OpenAI image generation with fallback URLs.
- `prisma/schema.prisma`: DB schema and relations.

## Data Flow
1. User clicks login in frontend.
2. Backend returns Facebook OAuth URL.
3. Callback exchanges code for short token and long-lived token (placeholder-compatible).
4. Profile/media/insights synced and stored.
5. Wrapped generation aggregates stored metrics and persists report JSON and AI image ref.
6. Frontend fetches report and renders story-like cards.

## Mock Mode
When `MOCK_MODE=true`, Instagram API calls return synthetic datasets to run app without live credentials.
