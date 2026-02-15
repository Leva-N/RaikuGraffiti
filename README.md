# Raiku Graffiti

Интерактивная graffiti-стена с Discord-авторизацией:
- пользователь выбирает дракона из каталога или через рулетку;
- дракон публикуется в первый свободный слот;
- у опубликованных слотов сохраняются ник и аватар Discord владельца.

## Стек

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **NextAuth (Discord)**
- **Vercel Blob Storage** (слоты и загруженные изображения)

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Переменные окружения

| Переменная | Обязательная | Описание |
|------------|--------------|----------|
| `BLOB_READ_WRITE_TOKEN` | Да (для записи) | Токен Vercel Blob для сохранения JSON слотов и загрузки изображений. |
| `AUTH_DISCORD_ID` / `DISCORD_CLIENT_ID` | Да (для Discord auth) | ID приложения Discord OAuth2. |
| `AUTH_DISCORD_SECRET` / `DISCORD_CLIENT_SECRET` | Да (для Discord auth) | Secret приложения Discord OAuth2. |

Без `BLOB_READ_WRITE_TOKEN` приложение остаётся в режиме просмотра (публикация/изменение слотов недоступны).

## Подключение Vercel Blob

1. В [Vercel Dashboard](https://vercel.com/dashboard) откройте проект.
2. **Storage** → создайте/подключите **Blob** store.
3. Добавьте `BLOB_READ_WRITE_TOKEN` в `.env.local` и в Environment Variables проекта.

## Деплой на Vercel

1. Запушьте репозиторий.
2. Импортируйте проект в Vercel.
3. Укажите переменные окружения (см. таблицу выше).
4. Нажмите **Deploy**.

## Основные API маршруты

- `GET /api/slots` — чтение текущего состояния стены.
- `POST /api/assign-slot` — публикация выбранного дракона в свободный слот.
- `POST /api/upload` — загрузка пользовательского изображения (ограниченный набор форматов).
- `DELETE /api/slots?slotId=...` — удаление изображения из слота владельцем или админом.

## Ограничения

- Максимальный размер загружаемого файла: **5 МБ**.
- Допустимые форматы загрузки: **JPEG, PNG, GIF, WebP**.
- Верхний лимит слотов: `MAX_SLOTS` (по умолчанию **10000**, `lib/types.ts`).
