FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache openssl
RUN npm install
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "npx prisma generate && npm run start:dev"]