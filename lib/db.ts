import { del, list, put } from "@vercel/blob";
import type { SlotsData } from "./types";
import { createEmptySlots } from "./types";
import { getBlobToken, hasBlobToken } from "./blob-token";

const SLOTS_PREFIX = "wall-slots/";
const SLOTS_HISTORY_KEEP = 30;
const SLOTS_READ_LIST_LIMIT = 1000;
const SLOTS_CLEANUP_LIST_LIMIT = 200;
const SLOTS_CACHE_TTL_MS = 15_000;
const SLOTS_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let slotsWriteLock: Promise<void> = Promise.resolve();
let slotsCache: { data: SlotsData; expiresAt: number } | null = null;
let lastCleanupAt = 0;

function normalizeSlots(data: SlotsData): SlotsData {
  if (!data.slots || !Array.isArray(data.slots)) return { slots: createEmptySlots(), updatedAt: data.updatedAt ?? new Date().toISOString() };
  let slots = data.slots;
  if (slots.length === 0) return { slots: createEmptySlots(), updatedAt: data.updatedAt ?? new Date().toISOString() };
  slots = slots.map((s, index) => ({
    id: typeof s.id === "number" ? s.id : index,
    imageUrl: typeof s.imageUrl === "string" && s.imageUrl.trim() ? s.imageUrl.trim() : null,
    createdAt: s.createdAt ?? null,
    discordNick: typeof s.discordNick === "string" && s.discordNick.trim() ? s.discordNick.trim() : null,
    ownerDiscordId:
      typeof s.ownerDiscordId === "string" && s.ownerDiscordId.trim()
        ? s.ownerDiscordId.trim()
        : null,
    ownerDiscordUsername:
      typeof s.ownerDiscordUsername === "string" && s.ownerDiscordUsername.trim()
        ? s.ownerDiscordUsername.trim()
        : null,
  }));
  return { ...data, slots };
}

const defaultSlotsData = (): SlotsData => ({
  slots: createEmptySlots(),
  updatedAt: new Date().toISOString(),
});

function getCachedSlots(): SlotsData | null {
  if (!slotsCache) return null;
  if (Date.now() > slotsCache.expiresAt) {
    slotsCache = null;
    return null;
  }
  return slotsCache.data;
}

function setSlotsCache(data: SlotsData): void {
  slotsCache = {
    data: normalizeSlots(data),
    expiresAt: Date.now() + SLOTS_CACHE_TTL_MS,
  };
}

async function readLatestSlots(token: string): Promise<SlotsData | null> {
  const { blobs } = await list({
    token,
    prefix: SLOTS_PREFIX,
    limit: SLOTS_READ_LIST_LIMIT,
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
    const cached = getCachedSlots();
    if (cached) return cached;

    const token = getBlobToken();
    const data = await readLatestSlots(token);
    const result = data ?? defaultData;
    setSlotsCache(result);
    return result;
  } catch {
    return defaultData;
  }
}

/** Чтение слотов для операций записи (DELETE, assign). При ошибке чтения — бросает, не возвращает пустые данные. */
export async function getSlotsForWrite(): Promise<SlotsData> {
  if (!hasBlobToken()) throw new Error("BLOB_READ_WRITE_TOKEN не настроен");
  const token = getBlobToken();
  const data = await readLatestSlots(token);
  const result = data ?? defaultSlotsData();
  setSlotsCache(result);
  return result;
}

export async function saveSlots(data: SlotsData): Promise<void> {
  const token = getBlobToken();
  try {
    const normalized = normalizeSlots(data);
    await put(
      `${SLOTS_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
      JSON.stringify(normalized),
      {
      access: "public",
      token,
      contentType: "application/json",
      cacheControlMaxAge: 60,
      addRandomSuffix: false,
    }
    );
    setSlotsCache(normalized);

    if (Date.now() - lastCleanupAt >= SLOTS_CLEANUP_INTERVAL_MS) {
      lastCleanupAt = Date.now();
      // Best-effort cleanup old slot snapshots (throttled).
      const { blobs } = await list({
        token,
        prefix: SLOTS_PREFIX,
        limit: SLOTS_CLEANUP_LIST_LIMIT,
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
    }
  } catch (e) {
    console.error("saveSlots error", e);
    throw e;
  }
}

export async function getFreeSlotIds(slots: SlotsData["slots"]): Promise<number[]> {
  return slots.filter((s) => !s.imageUrl).map((s) => s.id);
}

/**
 * Serializes all slot write operations across API routes.
 * This prevents lost updates when multiple writes happen almost simultaneously.
 */
export async function withSlotsWriteLock<T>(operation: () => Promise<T>): Promise<T> {
  const previousLock = slotsWriteLock;
  let releaseLock!: () => void;
  slotsWriteLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  await previousLock;
  try {
    return await operation();
  } finally {
    releaseLock();
  }
}
