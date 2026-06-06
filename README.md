# EduRostov

Образовательный портал Ростовской области. React 19 + Tailwind 4 + Express 4 + tRPC 11 + MySQL.

## Стек

- **Frontend:** React 19, Tailwind CSS 4, shadcn/ui, wouter (роутинг), TanStack Query
- **Backend:** Express 4, tRPC 11, Drizzle ORM
- **БД:** MySQL (через `DATABASE_URL`) / Firebase (по конфигурации)
- **Авторизация:** OAuth (через `/api/oauth/callback`), JWT сессии

## Запуск

```bash
pnpm install
pnpm dev
```

## Переменные окружения

```env
DATABASE_URL=          # URL базы данных MySQL
JWT_SECRET=            # Секрет для JWT токенов
OAUTH_SERVER_URL=      # URL OAuth сервера
VITE_APP_ID=           # ID OAuth приложения
OWNER_OPEN_ID=         # OpenID владельца (получит роль admin)
```

## Структура

- `client/src/pages/` — страницы приложения
- `client/src/components/` — UI компоненты
- `server/` — серверный код, tRPC роутеры
- `drizzle/` — схема БД и миграции
