# Fly.io Dockerfile for NestJS backend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

# Prisma needs OpenSSL
RUN apk add --no-cache openssl

ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/main.js"]
