FROM node:24-alpine AS base

WORKDIR /frfs

COPY package.json .
RUN npm install

FROM base AS development

EXPOSE 3000
CMD [ "npm","run","dev" ]

FROM base AS builder
COPY . .
RUN npm run build

# FROM node:24-alpine AS production

# WORKDIR /frfs

# COPY --from=builder /frfs .
# RUN npm i -g serve

# EXPOSE 3000
# CMD ["serve", "-s", "out", "-l", "3000"]

FROM nginx:alpine AS production

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /frfs/out /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
