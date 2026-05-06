# ============================================================
# Server-only Dockerfile (no client frontend)
#
# Use this if you only need the backend API without the React SPA.
# Build:  docker build -f src/server/Dockerfile -t pet-reward-server .
# ============================================================

# ---- Stage 1: Build TypeScript ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY src/server/package*.json ./
RUN npm ci 2>/dev/null || npm install

COPY src/ ./src/
RUN npx tsc --project src/server/tsconfig.json


# ---- Stage 2: Production ----
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy compiled JS + production node_modules
COPY --from=builder /app/dist/server/ ./dist/server/
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/package*.json ./

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup && \
    chown -R appuser:appgroup /app
USER appuser

CMD ["node", "dist/server/server/app.js"]
