import { NextRequest, NextResponse } from "next/server";
import { getSlots, saveSlots } from "@/lib/db";
import { deleteImage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getSlots();
    return NextResponse.json(data);
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
    const { searchParams } = new URL(request.url);
    const slotIdStr = searchParams.get("slotId");
    if (slotIdStr == null || slotIdStr === "") {
      return NextResponse.json({ error: "Укажите slotId" }, { status: 400 });
    }
    const slotId = parseInt(slotIdStr, 10);
    if (Number.isNaN(slotId) || slotId < 0) {
      return NextResponse.json({ error: "Неверный номер слота" }, { status: 400 });
    }

    const data = await getSlots();
    const slot = data.slots.find((s) => s.id === slotId);
    if (!slot) {
      return NextResponse.json({ error: "Слот не найден" }, { status: 404 });
    }
    if (!slot.imageUrl) {
      return NextResponse.json({ error: "В слоте нет фото" }, { status: 400 });
    }

    try {
      await deleteImage(slot.imageUrl);
    } catch (err) {
      console.error("deleteImage", err);
    }

    const slots = data.slots.map((s) =>
      s.id === slotId ? { id: s.id, imageUrl: null, createdAt: null } : s
    );
    await saveSlots({
      slots,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, slotId });
  } catch (e) {
    console.error("DELETE /api/slots", e);
    return NextResponse.json(
      { error: "Не удалось удалить фото" },
      { status: 500 }
    );
  }
}
