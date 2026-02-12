import { NextResponse } from "next/server";
import { getSlots } from "@/lib/db";

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
