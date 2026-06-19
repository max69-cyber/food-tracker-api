# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# OpenSSL is required by Prisma's query engine.
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY prisma.config.ts ./

EXPOSE 3000
CMD ["node", "dist/index.js"]
