import { NextRequest, NextResponse } from "next/server";
import { getSlots, saveSlots, getFreeSlotIds } from "@/lib/db";
import { uploadImage, validateImageFile } from "@/lib/storage";
import { appendRow } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Хранилище не настроено. Добавьте BLOB_READ_WRITE_TOKEN в .env.local (см. README).",
        },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Файл не выбран" },
        { status: 400 }
      );
    }

    const validation = validateImageFile(file);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    let data = await getSlots();
    let freeIds = await getFreeSlotIds(data.slots);

    // Если мест нет — добавляем новый ряд
    if (freeIds.length === 0) {
      data = {
        slots: appendRow(data.slots),
        updatedAt: new Date().toISOString(),
      };
      await saveSlots(data);
      freeIds = await getFreeSlotIds(data.slots);
    }

    const randomIndex = Math.floor(Math.random() * freeIds.length);
    const slotId = freeIds[randomIndex];

    const { url } = await uploadImage(file, slotId);
    const createdAt = new Date().toISOString();

    const slots = data.slots.map((s) =>
      s.id === slotId
        ? { id: s.id, imageUrl: url, createdAt }
        : s
    );

    await saveSlots({
      slots,
      updatedAt: createdAt,
    });

    return NextResponse.json({
      slotId,
      imageUrl: url,
      createdAt,
    });
  } catch (e) {
    console.error("POST /api/upload", e);
    return NextResponse.json(
      { error: "Ошибка загрузки. Проверьте настройки Blob и повторите." },
      { status: 500 }
    );
  }
}
