# ==========================================
# STAGE 1: Builder
# ==========================================
FROM node:24-alpine AS builder

WORKDIR /app

# Dependencias de prisma
RUN apk add --no-cache openssl

COPY package*.json ./

# Copy ONLY the prisma folder next so we can generate the client
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY . .

# ==========================================
# STAGE 2: Runner
# ==========================================
FROM node:20-alpine

WORKDIR /app

# We still need openssl at runtime for Prisma
RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
# Copying node_modules from one Docker stage to another Docker stage is the INDUSTRY STANDARD. (Because both stages are identical Linux environments, and it allows you to discard build tools and caches).
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/ ./

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm run start:dev"]