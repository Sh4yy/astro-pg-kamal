FROM node:lts-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:lts-alpine AS runtime
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

# Dirty prisma migration during startup
CMD npx prisma migrate deploy && node ./dist/server/entry.mjs