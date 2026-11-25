# MyFrequentRewards public website (React + Vite, prerendered), in four stages:
#
#   base         Node, the working folder and every dependency (from package-lock.json)
#   build        base + the source: `npm run build` writes the prerendered site to dist/
#   development  base + the source, Vite dev server with hot reload on :5173 (the gateway's dev route)
#   production   nginx serving dist/ with nginx.conf (caching, clean URLs, real 404s) on :80
#
#   docker build --target development -t mfr-frontend-1:dev .
#   docker build --target production  -t mfr-frontend-1 .      (also the default: the last stage)
#
# In docker-compose, pick one with `build: { context: ./Project/frontend-1, target: production }`.

ARG NODE_IMAGE=node:24-alpine
ARG NGINX_IMAGE=nginx:alpine

# ---------- base ----------
FROM ${NODE_IMAGE} AS base
WORKDIR /frfs
ENV npm_config_fund=false \
    npm_config_audit=false \
    npm_config_update_notifier=false
# Dependencies first, on their own layer: a source change does not reinstall them.
COPY package.json package-lock.json ./
RUN npm ci

# ---------- build ----------
FROM base AS build
ENV NODE_ENV=production
COPY . .
RUN npm run build

# ---------- development ----------
FROM base AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 5173
# vite.config.js already listens on 0.0.0.0:5173. Mount the source over /frfs to edit live (keep /frfs/node_modules).
CMD ["npm", "run", "dev"]

# ---------- production ----------
FROM ${NGINX_IMAGE} AS production
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /frfs/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
