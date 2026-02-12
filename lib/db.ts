import { head, put } from "@vercel/blob";
import type { SlotsData } from "./types";
import { createEmptySlots, WALL_COLUMNS } from "./types";

const SLOTS_BLOB_KEY = "wall-slots.json";

async function getBlobClient() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  return { token };
}

export async function getSlots(): Promise<SlotsData> {
  const client = await getBlobClient();
  const defaultData: SlotsData = {
    slots: createEmptySlots(),
    updatedAt: new Date().toISOString(),
  };

  if (!client) return defaultData;

  try {
    const meta = await head(SLOTS_BLOB_KEY, { token: client.token });
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return defaultData;
    const data = (await res.json()) as SlotsData;
    if (!data.slots || !Array.isArray(data.slots)) return defaultData;
    // Длина должна быть кратна числу колонок (динамические ряды)
    const remainder = data.slots.length % WALL_COLUMNS;
    if (remainder !== 0) {
      data.slots = data.slots.slice(0, data.slots.length - remainder);
    }
    if (data.slots.length === 0) {
      data.slots = createEmptySlots();
    }
    return data;
  } catch {
    return defaultData;
  }
}

export async function saveSlots(data: SlotsData): Promise<void> {
  const client = await getBlobClient();
  if (!client) return;

  try {
    await put(SLOTS_BLOB_KEY, JSON.stringify(data), {
      access: "public",
      token: client.token,
      contentType: "application/json",
    });
  } catch (e) {
    console.error("saveSlots error", e);
    throw e;
  }
}

export async function getFreeSlotIds(slots: SlotsData["slots"]): Promise<number[]> {
  return slots.filter((s) => !s.imageUrl).map((s) => s.id);
}
