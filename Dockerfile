# Этап 1: Сборка приложения
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Этап 2: Подготовка production-образа
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

COPY next.config.ts ./
COPY middleware.ts ./

EXPOSE 3000

CMD ["npm", "start"]