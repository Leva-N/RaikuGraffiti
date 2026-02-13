import { put, del } from "@vercel/blob";
import { getBlobToken } from "./blob-token";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

export function validateImageFile(file: File): { ok: true } | { ok: false; error: string } {
  const isImageType =
    (file.type && file.type.startsWith("image/") && ALLOWED_TYPES.includes(file.type)) ||
    IMAGE_EXT.test(file.name || "");
  if (!isImageType) {
    return { ok: false, error: "Разрешены только изображения (JPEG, PNG, GIF, WebP)" };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { ok: false, error: "Размер файла не должен превышать 5 МБ" };
  }
  if (file.size === 0) {
    return { ok: false, error: "Файл пустой" };
  }
  return { ok: true };
}

export async function uploadImage(
  file: File,
  slotId: number
): Promise<{ url: string }> {
  const token = getBlobToken();
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `wall/${slotId}-${Date.now()}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
    token,
    contentType: file.type || "image/jpeg",
    addRandomSuffix: true,
  });
  return { url: blob.url };
}

export async function deleteImage(url: string): Promise<void> {
  try {
    const token = getBlobToken();
    await del(url, { token });
  } catch (e) {
    console.error("deleteImage error", e);
    // Не пробрасываем — слот всё равно очищаем в БД
  }
}
