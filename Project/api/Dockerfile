# MyFrequentRewards API (Express + MongoDB), in four stages:
#
#   base         Node, the working folder and the production dependencies (from package-lock.json)
#   build        base + the source (the API has no compile step: this is what production copies from)
#   development  base + every dependency, nodemon with reload on :3000
#   production   Node + pm2: pm2-runtime runs app/server.js from ecosystem.config.cjs on :3000
#
#   docker build --target development -t mfr-api:dev .
#   docker build --target production  -t mfr-api .             (also the default: the last stage)
#
# In docker-compose, pick one with `build: { context: ./Project/api, target: production }`.
# The code reads a few absolute paths (/src/public, /src/app/dataBank), so the working folder is /src.
# Settings come from the environment: mongodb, port, JWT_SECRET, SOCIAL_JWT_SECRET, socials, PUBLIC_SITE_URL and so on.

ARG NODE_IMAGE=node:24-alpine

# ---------- base ----------
FROM ${NODE_IMAGE} AS base
WORKDIR /src
ENV npm_config_fund=false \
    npm_config_audit=false \
    npm_config_update_notifier=false
# Dependencies first, on their own layer: a source change does not reinstall them.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- build ----------
FROM base AS build
ENV NODE_ENV=production
COPY . .
RUN mkdir -p app/logs public

# ---------- development ----------
FROM base AS development
ENV NODE_ENV=development
RUN npm ci && npm install -g nodemon
COPY . .
RUN mkdir -p app/logs public
EXPOSE 3000
# Mount the source over /src to edit live (keep /src/node_modules).
CMD ["nodemon", "app/server.js"]

# ---------- production ----------
FROM ${NODE_IMAGE} AS production
ENV NODE_ENV=production \
    npm_config_fund=false \
    npm_config_audit=false \
    npm_config_update_notifier=false \
    PM2_HOME=/src/.pm2
RUN npm install -g pm2@6
WORKDIR /src
COPY --from=build /src /src
EXPOSE 3000
# Healthy while the server answers HTTP at all (any status code): pm2 already restarts a crashed process.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.port||3000)+'/api/v1',r=>process.exit(0)).on('error',()=>process.exit(1))"

CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
