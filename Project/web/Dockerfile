# MyFrequentRewards member area and admin (Next.js static export), in four stages:
#
#   base         Node, the working folder and every dependency (from package-lock.json)
#   build        base + the source: `npm run build` writes the static site to out/
#   development  base + the source, `next dev` with hot reload on :3000 (the gateway's dev route)
#   production   nginx serving out/ with nginx.conf on :80
#
#   docker build --target development -t mfr-web:dev .
#   docker build --target production  -t mfr-web .             (also the default: the last stage)
#
# In docker-compose, pick one with `build: { context: ./Project/web, target: production }`.
#
# Public folder: web/public holds only what the member app serves under its own paths (/member/manifest.webmanifest,
# /member/offline.html, /member/pwa-*.png, /member/account-actions/). Everything else at the site root (/hub, /images,
# /fonts, /data, /member-sw.js ...) lives in frontend-1/public, because on the live server every path outside /member,
# /admin, /auth, /survey and /_next is answered by frontend-1. So this image builds from Project/web alone, with no
# extra build context.

ARG NODE_IMAGE=node:24-alpine
ARG NGINX_IMAGE=nginx:alpine

# ---------- base ----------
FROM ${NODE_IMAGE} AS base
WORKDIR /frfs
ENV npm_config_fund=false \
    npm_config_audit=false \
    npm_config_update_notifier=false \
    NEXT_TELEMETRY_DISABLED=1
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
EXPOSE 3000
# Mount the source over /frfs to edit live (keep /frfs/node_modules).
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]

# ---------- production ----------
FROM ${NGINX_IMAGE} AS production
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /frfs/out /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
