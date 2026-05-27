FROM node:20-alpine
WORKDIR /app
COPY package*.json ./

# Instalar openssl (para Prisma), python3, pip y herramientas de compilación para psycopg2
RUN apk add --no-cache openssl python3 py3-pip make gcc g++ musl-dev postgresql-dev

RUN npm install
COPY . .

# Instalar las librerías de Python requeridas usando pip a nivel de sistema
RUN pip3 install --break-system-packages --no-cache-dir -r scripts/requirements.txt

EXPOSE 3000
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npx prisma db seed && npm run start:dev"]
