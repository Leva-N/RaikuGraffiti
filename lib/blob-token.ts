/**
 * Единая точка чтения токена Vercel Blob.
 * В .env.local переменная должна называться строго: BLOB_READ_WRITE_TOKEN
 * (при создании Blob store в Vercel эта переменная создаётся автоматически;
 * при локальной разработке скопируйте значение из Vercel → Project → Settings → Environment Variables)
 */
export function getBlobToken(): string {
  const token =
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN?.trim() ||
    "";
  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN не найден. В .env.local добавьте строку: BLOB_READ_WRITE_TOKEN=ваш_токен_из_vercel"
    );
  }
  return token;
}

export function hasBlobToken(): boolean {
  const t =
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN?.trim() ||
    "";
  return t.length > 0;
}
