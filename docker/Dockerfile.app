# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

ARG API_ORIGIN=http://api:3333
ENV API_ORIGIN=$API_ORIGIN

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run db:generate
RUN CI=true npx nx build app

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/apps/app/.next/standalone ./
COPY --from=builder /app/apps/app/.next/static ./apps/app/.next/static
COPY --from=builder /app/apps/app/public ./apps/app/public

EXPOSE 3000
CMD ["node", "apps/app/server.js"]
