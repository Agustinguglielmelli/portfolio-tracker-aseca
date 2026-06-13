FROM node:20-alpine
WORKDIR /app
COPY package*.json ./

# Instalar openssl (para Prisma)
RUN apk add --no-cache openssl

RUN npm install
COPY . .

EXPOSE 3000
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npx prisma db seed && npm run start:dev"]
