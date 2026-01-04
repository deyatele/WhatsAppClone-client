# Этап 1: Сборка приложения
FROM node:22-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Собираем Next.js приложение
RUN npm run build

# Этап 2: Подготовка production-образа
FROM node:22-alpine

WORKDIR /app

# Устанавливаем зависимости только для production
COPY package*.json ./
RUN npm install --only=production

# Копируем скомпилированное приложение из этапа 'builder'
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Копируем остальные необходимые файлы
COPY next.config.ts ./
COPY middleware.ts ./

# Открываем порт
EXPOSE 3000

# Команда для запуска приложения
CMD ["npm", "start"]