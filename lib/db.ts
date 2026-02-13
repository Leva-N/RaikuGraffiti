import { del, list, put } from "@vercel/blob";
import type { SlotsData } from "./types";
import { createEmptySlots, WALL_COLUMNS } from "./types";
import { getBlobToken, hasBlobToken } from "./blob-token";

const SLOTS_PREFIX = "wall-slots/";
const SLOTS_HISTORY_KEEP = 30;

function normalizeSlots(data: SlotsData): SlotsData {
  if (!data.slots || !Array.isArray(data.slots)) return { slots: createEmptySlots(), updatedAt: data.updatedAt ?? new Date().toISOString() };
  let slots = data.slots;
  const remainder = slots.length % WALL_COLUMNS;
  if (remainder !== 0) slots = slots.slice(0, slots.length - remainder);
  if (slots.length === 0) return { slots: createEmptySlots(), updatedAt: data.updatedAt ?? new Date().toISOString() };
  slots = slots.map((s, index) => ({
    id: typeof s.id === "number" ? s.id : index,
    imageUrl: typeof s.imageUrl === "string" && s.imageUrl.trim() ? s.imageUrl.trim() : null,
    createdAt: s.createdAt ?? null,
    discordNick: typeof s.discordNick === "string" && s.discordNick.trim() ? s.discordNick.trim() : null,
  }));
  return { ...data, slots };
}

const defaultSlotsData = (): SlotsData => ({
  slots: createEmptySlots(),
  updatedAt: new Date().toISOString(),
});

async function readLatestSlots(token: string): Promise<SlotsData | null> {
  const { blobs } = await list({
    token,
    prefix: SLOTS_PREFIX,
    limit: 1000,
  });
  if (!blobs.length) return null;

  const latest = blobs.reduce((a, b) =>
    new Date(a.uploadedAt).getTime() >= new Date(b.uploadedAt).getTime() ? a : b
  );

  const url = `${latest.url}${latest.url.includes("?") ? "&" : "?"}nocache=${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
  if (!res.ok) {
    throw new Error(`Ошибка чтения слотов: ${res.status}`);
  }

  return normalizeSlots((await res.json()) as SlotsData);
}

export async function getSlots(): Promise<SlotsData> {
  const defaultData = defaultSlotsData();

  if (!hasBlobToken()) return defaultData;

  try {
    const token = getBlobToken();
    const data = await readLatestSlots(token);
    return data ?? defaultData;
  } catch {
    return defaultData;
  }
}

/** Чтение слотов для операций записи (DELETE, assign). При ошибке чтения — бросает, не возвращает пустые данные. */
export async function getSlotsForWrite(): Promise<SlotsData> {
  if (!hasBlobToken()) throw new Error("BLOB_READ_WRITE_TOKEN не настроен");
  const token = getBlobToken();
  const data = await readLatestSlots(token);
  return data ?? defaultSlotsData();
}

export async function saveSlots(data: SlotsData): Promise<void> {
  const token = getBlobToken();
  try {
    await put(
      `${SLOTS_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
      JSON.stringify(data),
      {
      access: "public",
      token,
      contentType: "application/json",
      cacheControlMaxAge: 60,
      addRandomSuffix: false,
    }
    );

    // Best-effort cleanup old slot snapshots.
    const { blobs } = await list({
      token,
      prefix: SLOTS_PREFIX,
      limit: 1000,
    });
    if (blobs.length > SLOTS_HISTORY_KEEP) {
      const sortedOldestFirst = [...blobs].sort(
        (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
      );
      const toDelete = sortedOldestFirst
        .slice(0, blobs.length - SLOTS_HISTORY_KEEP)
        .map((b) => b.url);
      if (toDelete.length) {
        await del(toDelete, { token });
      }
    }
  } catch (e) {
    console.error("saveSlots error", e);
    throw e;
  }
}

export async function getFreeSlotIds(slots: SlotsData["slots"]): Promise<number[]> {
  return slots.filter((s) => !s.imageUrl).map((s) => s.id);
}
