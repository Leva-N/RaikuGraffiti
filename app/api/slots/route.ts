import { NextRequest, NextResponse } from "next/server";
import { getSlots, getSlotsForWrite, saveSlots, withSlotsWriteLock } from "@/lib/db";
import { deleteImage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getSlots();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (e) {
    console.error("GET /api/slots", e);
    return NextResponse.json(
      { error: "Не удалось загрузить слоты" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    return await withSlotsWriteLock(async () => {
      const { searchParams } = new URL(request.url);
      const slotIdStr = searchParams.get("slotId");
      if (slotIdStr == null || slotIdStr === "") {
        return NextResponse.json({ error: "Укажите slotId" }, { status: 400 });
      }
      const slotId = parseInt(slotIdStr, 10);
      if (Number.isNaN(slotId) || slotId < 0) {
        return NextResponse.json({ error: "Неверный номер слота" }, { status: 400 });
      }

      const data = await getSlotsForWrite();
      const slotIndex = data.slots.findIndex((s) => Number(s.id) === slotId);
      if (slotIndex === -1) {
        return NextResponse.json({ error: "Слот не найден" }, { status: 404 });
      }
      const slot = data.slots[slotIndex];
      const hasPhoto =
        typeof slot.imageUrl === "string" && slot.imageUrl.trim().length > 0;
      if (!hasPhoto) {
        return NextResponse.json({ ok: true, slotId, alreadyEmpty: true });
      }

      const imageUrl = slot.imageUrl;
      const isBlobUrl =
        typeof imageUrl === "string" &&
        imageUrl.startsWith("http") &&
        imageUrl.includes("blob.vercel-storage.com");
      if (isBlobUrl && imageUrl) {
        try {
          await deleteImage(imageUrl);
        } catch (err) {
          console.error("deleteImage", err);
        }
      }

      const slots = data.slots.map((s) =>
        Number(s.id) === slotId
          ? { id: s.id, imageUrl: null, createdAt: null, discordNick: null }
          : s
      );
      await saveSlots({
        slots,
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({ ok: true, slotId });
    });
  } catch (e) {
    console.error("DELETE /api/slots", e);
    const message = e instanceof Error ? e.message : "Не удалось удалить фото";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
