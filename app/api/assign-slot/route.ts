import { NextRequest, NextResponse } from "next/server";
import { getSlotsForWrite, saveSlots, getFreeSlotIds, withSlotsWriteLock } from "@/lib/db";
import { appendRow, MAX_SLOTS } from "@/lib/types";
import { hasBlobToken } from "@/lib/blob-token";
import { isAllowedDragonUrl } from "@/lib/dragons";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    return await withSlotsWriteLock(async () => {
      if (!hasBlobToken()) {
        return NextResponse.json(
          { error: "Хранилище не настроено. Добавьте BLOB_READ_WRITE_TOKEN в .env.local." },
          { status: 503 }
        );
      }

      let body: { imageUrl?: string; discordNick?: string };
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: "Неверное тело запроса" }, { status: 400 });
      }

      const imageUrl = body?.imageUrl;
      const discordNick = typeof body?.discordNick === "string" ? body.discordNick.trim() : null;
      if (typeof imageUrl !== "string" || !imageUrl.trim()) {
        return NextResponse.json({ error: "Укажите imageUrl" }, { status: 400 });
      }

      if (!isAllowedDragonUrl(imageUrl)) {
        return NextResponse.json({ error: "Этот дракон не из списка" }, { status: 400 });
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

      const slotId = freeIds[0];
      const createdAt = new Date().toISOString();

      const slots = data.slots.map((s) =>
        Number(s.id) === Number(slotId)
          ? { id: s.id, imageUrl: imageUrl.trim(), createdAt, discordNick: discordNick || null }
          : s
      );

      const updatedData = {
        slots,
        updatedAt: createdAt,
      };
      await saveSlots(updatedData);

      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
        const verify = await getSlotsForWrite();
        const slotAfter = verify.slots.find((s) => Number(s.id) === slotId);
        if (slotAfter?.imageUrl === imageUrl.trim()) {
          return NextResponse.json({
            slotId,
            imageUrl: imageUrl.trim(),
            createdAt,
            slots: verify.slots,
            updatedAt: verify.updatedAt,
          });
        }
      }

      return NextResponse.json({
        slotId,
        imageUrl: imageUrl.trim(),
        createdAt,
        slots: updatedData.slots,
        updatedAt: updatedData.updatedAt,
      });
    });
  } catch (e) {
    console.error("POST /api/assign-slot", e);
    const message = e instanceof Error ? e.message : "Ошибка назначения слота";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
