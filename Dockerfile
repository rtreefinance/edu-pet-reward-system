# ============================================================
# Multi-stage Dockerfile for Pet Reward System
#
# Stages:
#   1. build-server  — Compiles TypeScript backend
#   2. build-client  — Builds React Vite frontend (optional)
#   3. production    — Runs Node.js with compiled backend
#
# NOTE: If you don't have a client/ directory yet, comment out
#       the build-client stage AND the COPY --from=build-client
#       line in the production stage.
# ============================================================

# ---- Stage 1: Build server TypeScript ----
FROM node:20-alpine AS build-server
WORKDIR /app

# Install all dependencies (including devDependencies for tsc)
COPY src/server/package*.json ./
RUN npm ci 2>/dev/null || npm install

# Copy full src tree (server + shared types)
COPY src/ ./src/

# Compile TypeScript → dist/server/
RUN npx tsc --project src/server/tsconfig.json


# ---- Stage 2: Build client React SPA ----
# Comment this stage out if src/client/ does not exist yet
FROM node:20-alpine AS build-client
WORKDIR /app

# Copy client package files and install deps
COPY src/client/package*.json ./
RUN npm ci 2>/dev/null || npm install

# Copy client source + shared types (client references ../shared/)
COPY src/client/ ./
COPY src/shared/ ../shared/

RUN npm run build
# Output: /app/dist/


# ---- Stage 3: Production runtime ----
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Alpine needs wget for healthcheck
RUN apk add --no-cache wget

# Copy compiled server artifacts from build-server
COPY --from=build-server /app/dist/server/ ./dist/server/
COPY --from=build-server /app/node_modules/ ./node_modules/
COPY --from=build-server /app/package*.json ./

# Copy built client static files (comment out if no client)
COPY --from=build-client /app/dist/ ./public/

# Serve API + static frontend from the same process
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

# Run as non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup && \
    chown -R appuser:appgroup /app
USER appuser

CMD ["node", "dist/server/server/app.js"]
