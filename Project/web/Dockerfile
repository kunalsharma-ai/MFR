FROM node:24-alpine AS base

WORKDIR /frfs

COPY package.json .

FROM base AS development

RUN npm install
EXPOSE 3000
CMD [ "npm","run","dev" ]

FROM base AS builder
RUN npm install 
COPY . .
RUN npm run build

FROM node:24-alpine AS production

WORKDIR /frfs

COPY --from=builder /frfs .
RUN rm -rf src
EXPOSE 3000
CMD [ "npm","start" ]
