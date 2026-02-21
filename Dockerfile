# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# Install root workspaces dependencies
RUN npm install

# Copy application source code
COPY . .

# Generate Prisma Client
RUN npm run prisma:generate -w backend || true

# ---- Backend ----
FROM base AS backend
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push -w backend && npm run dev -w backend"]

# ---- Frontend ----
FROM base AS frontend
EXPOSE 5173
# Vite requires --host to be exposed outside the container
CMD ["npm", "run", "dev", "-w", "frontend", "--", "--host"]
