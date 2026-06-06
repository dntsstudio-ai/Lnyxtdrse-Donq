# Подключение Firebase

## 1. Получить Service Account ключ

1. Откройте [Firebase Console](https://console.firebase.google.com) → проект `edurostov-53ef0`
2. Перейдите в **Настройки проекта** → вкладка **Сервисные аккаунты**
3. Нажмите **Создать новый закрытый ключ** → скачайте JSON-файл

## 2. Настроить переменные окружения

Создайте файл `.env` в корне проекта на основе `.env.example`:

```env
FIREBASE_PROJECT_ID=edurostov-53ef0

# Для локальной разработки — путь к JSON-файлу:
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# Для деплоя (Render, Railway, Fly.io) — JSON одной строкой:
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"edurostov-53ef0",...}
```

## 3. Развернуть индексы Firestore

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:indexes
firebase deploy --only firestore:rules
```

## 4. Firestore коллекции

Создаются автоматически при первом обращении:

| Коллекция | Назначение |
|---|---|
| `users` | Пользователи |
| `institutions` | Учреждения |
| `institution_photos` | Фотографии учреждений |
| `institution_documents` | Документы учреждений |
| `institution_specializations` | Специальности |
| `reviews` | Отзывы |
| `news` | Новости |
| `user_preferences` | Анкеты предпочтений |
| `bookmarks` | Закладки |
| `publication_requests` | Заявки на публикацию |
| `notifications` | Уведомления |
| `site_stats` | Статистика сайта |
| `contact_messages` | Обращения через форму |
| `_counters` | Внутренние счётчики ID |

## 5. Локальный эмулятор (без Firebase)

```bash
firebase emulators:start --only firestore
```

Добавьте в `.env`:
```
FIRESTORE_EMULATOR_HOST=localhost:8080
```
