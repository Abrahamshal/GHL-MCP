# syntax=docker/dockerfile:1

# Shared base with just the manifests, so dependency layers cache independently
# of source changes.
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false NPM_CONFIG_FUND=false
COPY package.json package-lock.json ./

# Full dependency set (incl. devDependencies) used only to compile TypeScript.
FROM base AS build
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --prefer-offline
COPY . .
RUN npm run build

# Production-only dependencies for the runtime image. Depends only on the
# manifests, so it is fully cached on source-only changes.
FROM base AS prod-deps
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --no-audit --prefer-offline

# Minimal runtime image: prod node_modules + compiled dist only.
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist

EXPOSE 8000
CMD ["node", "dist/main.js"]
