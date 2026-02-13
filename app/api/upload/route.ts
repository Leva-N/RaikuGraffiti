import { NextRequest, NextResponse } from "next/server";
import { getSlotsForWrite, saveSlots, getFreeSlotIds } from "@/lib/db";
import { uploadImage, validateImageFile } from "@/lib/storage";
import { appendRow, MAX_SLOTS } from "@/lib/types";
import { hasBlobToken } from "@/lib/blob-token";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!hasBlobToken()) {
      return NextResponse.json(
        {
          error:
            "Хранилище не настроено. В .env.local добавьте: BLOB_READ_WRITE_TOKEN=токен_из_Vercel (см. README).",
        },
        { status: 503 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e) {
      console.error("upload formData", e);
      return NextResponse.json(
        { error: "Не удалось прочитать файл. Попробуйте файл меньше 4–5 МБ." },
        { status: 413 }
      );
    }
    const file = formData.get("file");
    const placement = (formData.get("placement") as string | null) || "sequential";

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

    let data = await getSlotsForWrite();
    let freeIds = await getFreeSlotIds(data.slots);

    if (freeIds.length === 0) {
      if (data.slots.length >= MAX_SLOTS) {
        return NextResponse.json(
          { error: `Достигнут лимит стены: ${MAX_SLOTS} фото` },
          { status: 409 }
        );
      }
      data = {
        slots: appendRow(data.slots),
        updatedAt: new Date().toISOString(),
      };
      await saveSlots(data);
      freeIds = await getFreeSlotIds(data.slots);
    }

    if (freeIds.length === 0) {
      return NextResponse.json(
        { error: "Не удалось найти свободный слот" },
        { status: 500 }
      );
    }

    const slotId =
      placement === "random" && freeIds.length > 0
        ? freeIds[Math.floor(Math.random() * freeIds.length)]
        : freeIds[0];

    const { url } = await uploadImage(file, slotId);
    const createdAt = new Date().toISOString();

    const slots = data.slots.map((s) =>
      Number(s.id) === Number(slotId) ? { id: s.id, imageUrl: url, createdAt } : s
    );

    await saveSlots({
      slots,
      updatedAt: createdAt,
    });

    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
      const verify = await getSlotsForWrite();
      const slotAfter = verify.slots.find((s) => Number(s.id) === slotId);
      if (slotAfter?.imageUrl === url) {
        return NextResponse.json({
          slotId,
          imageUrl: url,
          createdAt,
        });
      }
    }

    return NextResponse.json({
      slotId,
      imageUrl: url,
      createdAt,
    });
  } catch (e) {
    console.error("POST /api/upload", e);
    const message = e instanceof Error ? e.message : "Ошибка загрузки";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
