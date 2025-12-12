# Fly.io Dockerfile for NestJS backend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Generate Prisma Client (required for TypeScript enums/types)
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev
COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Prisma needs OpenSSL
RUN apk add --no-cache openssl

EXPOSE 8080

CMD ["sh", "-c", "npx prisma db push || echo 'Prisma DB push failed, starting anyway'; npm run start:prod"]
