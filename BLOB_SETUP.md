# Где взять BLOB_READ_WRITE_TOKEN

Токен **не лежит** в интерфейсе Blob отдельной кнопкой — он создаётся автоматически и попадает в **переменные окружения проекта**.

## Шаг 1: Создать Blob store в проекте

1. Зайдите на [vercel.com](https://vercel.com) и откройте **ваш проект** (или создайте новый и привяжите репозиторий).
2. В проекте откройте вкладку **Storage** (в верхнем меню).
3. Нажмите **Connect Database** (или **Create Database** / **Add Storage**).
4. В списке типов выберите **Blob** → **Continue**.
5. Введите имя хранилища (например, `wall-photos`) и нажмите **Create**.
6. Отметьте окружения (Production, Preview, Development), где нужен токен, и подтвердите.

После этого переменная `BLOB_READ_WRITE_TOKEN` автоматически добавляется в **Environment Variables** этого проекта.

## Шаг 2: Получить токен локально

### Вариант А — через Vercel CLI (удобно)

В корне проекта в терминале:

```bash
npx vercel link
```

Если проект ещё не привязан — выберите команду/проект. Затем:

```bash
npx vercel env pull .env.local
```

Токен подтянется в `.env.local` сам.

### Вариант Б — скопировать вручную

1. На [vercel.com](https://vercel.com) откройте **ваш проект**.
2. Перейдите в **Settings** → **Environment Variables**.
3. В списке найдите **BLOB_READ_WRITE_TOKEN**.
4. Нажмите на значение (или "Reveal" / "Show"), скопируйте.
5. Вставьте в `.env.local` в корне проекта:
   ```env
   BLOB_READ_WRITE_TOKEN=вставленный_токен
   ```

Перезапустите `npm run dev`.

---

Если в **Settings → Environment Variables** нет `BLOB_READ_WRITE_TOKEN` — значит Blob store ещё не создан или не привязан к этому проекту. Сначала выполните шаг 1.
