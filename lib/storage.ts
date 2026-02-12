import { put, del } from "@vercel/blob";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function validateImageFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!file.type.startsWith("image/") || !ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: "Разрешены только изображения (JPEG, PNG, GIF, WebP)" };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { ok: false, error: "Размер файла не должен превышать 5 МБ" };
  }
  return { ok: true };
}

export async function uploadImage(
  file: File,
  slotId: number
): Promise<{ url: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN не настроен");

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `wall/${slotId}-${Date.now()}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
    token,
    contentType: file.type,
  });
  return { url: blob.url };
}

export async function deleteImage(url: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;
  try {
    await del(url, { token });
  } catch (e) {
    console.error("deleteImage error", e);
    // Не пробрасываем — слот всё равно очищаем в БД
  }
}
