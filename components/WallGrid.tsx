"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Brick, type BrickSlot } from "./Brick";
import type { SlotsData } from "@/lib/types";
import {
    createEmptySlots,
    WALL_COLUMNS,
    INITIAL_ROWS,
  } from "@/lib/types";
import { DRAGON_FILENAMES, getDragonUrl } from "@/lib/dragons";
import Image from "next/image";

let assignInFlight = false;
const ROULETTE_ITEM_SIZE = 96;
const ROULETTE_ITEM_GAP = 12;
const ROULETTE_ITEM_STEP = ROULETTE_ITEM_SIZE + ROULETTE_ITEM_GAP;
const ROULETTE_SPIN_MS = 4800;
const ROULETTE_RESULT_MS = 3000;

function getUniformRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) return 0;
  const maxUint32PlusOne = 0x1_0000_0000;
  const limit = maxUint32PlusOne - (maxUint32PlusOne % maxExclusive);
  const random = new Uint32Array(1);

  if (!globalThis.crypto?.getRandomValues) {
    return Math.floor(Math.random() * maxExclusive);
  }

  let value = 0;
  do {
    globalThis.crypto.getRandomValues(random);
    value = random[0] ?? 0;
  } while (value >= limit);

  return value % maxExclusive;
}

function shuffleWithUniformRandom<T>(source: readonly T[]): T[] {
  const result = [...source];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = getUniformRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickRandomDragonUrl(excluded: Set<string> = new Set()): string {
  const urls = DRAGON_FILENAMES.map((filename) => getDragonUrl(filename));
  const allowed = urls.filter((url) => !excluded.has(url));
  const pool = allowed.length ? allowed : urls;
  return pool[getUniformRandomInt(pool.length)] ?? urls[0];
}

function buildNoAdjacentRandomUrls(count: number, prevUrl: string | null): string[] {
  const result: string[] = [];
  let prev = prevUrl;
  for (let i = 0; i < count; i += 1) {
    const nextUrl = pickRandomDragonUrl(prev ? new Set([prev]) : new Set());
    result.push(nextUrl);
    prev = nextUrl;
  }
  return result;
}

export function WallGrid() {
  const [data, setData] = useState<SlotsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDragonList, setShowDragonList] = useState(false);
  const [showRandomRoulette, setShowRandomRoulette] = useState(false);
  const [rouletteTrack, setRouletteTrack] = useState<string[]>([]);
  const [rouletteWinnerIndex, setRouletteWinnerIndex] = useState<number | null>(null);
  const [rouletteOffset, setRouletteOffset] = useState(0);
  const [rouletteDurationMs, setRouletteDurationMs] = useState(0);
  const [rouletteRolling, setRouletteRolling] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [sprayFx, setSprayFx] = useState<{ slotId: number; nonce: number } | null>(null);
  const [showNickPrompt, setShowNickPrompt] = useState(false);
  const [selectedDragonUrl, setSelectedDragonUrl] = useState<string | null>(null);
  const [discordNick, setDiscordNick] = useState("");
  const [nickError, setNickError] = useState<string | null>(null);
  const [pendingRevealSlots, setPendingRevealSlots] = useState<Record<number, true>>({});
  const revealTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const rouletteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSlots = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch("/api/slots", { cache: "no-store", signal: controller.signal });
      if (!res.ok) throw new Error("Failed to load slots");
      const json = (await res.json()) as SlotsData;
      setData(json);
    } catch (err) {
      console.error(err);
      setData((prev) => prev ?? { slots: createEmptySlots(), updatedAt: new Date().toISOString() });
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  useEffect(() => {
    if (!sprayFx) return;
    const timer = setTimeout(() => setSprayFx(null), 900);
    return () => clearTimeout(timer);
  }, [sprayFx]);

  useEffect(() => {
    return () => {
      Object.values(revealTimersRef.current).forEach((timer) => clearTimeout(timer));
      revealTimersRef.current = {};
      if (rouletteTimerRef.current) {
        clearTimeout(rouletteTimerRef.current);
        rouletteTimerRef.current = null;
      }
    };
  }, []);

  const beginSprayReveal = useCallback((slotId: number) => {
    const numericId = Number(slotId);
    setPendingRevealSlots((prev) => ({ ...prev, [numericId]: true }));
    if (revealTimersRef.current[numericId]) {
      clearTimeout(revealTimersRef.current[numericId]);
    }
    revealTimersRef.current[numericId] = setTimeout(() => {
      setPendingRevealSlots((prev) => {
        const next = { ...prev };
        delete next[numericId];
        return next;
      });
      delete revealTimersRef.current[numericId];
    }, 5000);
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (uploading) return;
      setUploadError(null);
      setUploading(true);

      try {
        const form = new FormData();
        form.append("file", file);
        form.append("placement", "sequential");
        const res = await fetch("/api/upload", {
          method: "POST",
          body: form,
        });
        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg =
            res.status === 413
              ? "Файл слишком большой (макс. 5 МБ)"
              : body?.error || "Ошибка загрузки";
          setUploadError(msg);
          return;
        }

        const updated = body as { slotId: number; imageUrl: string; createdAt: string };
        setUploadingId(updated.slotId);
        setData((prev) => {
          const slots = prev
            ? prev.slots.map((s) =>
                s.id === updated.slotId
                  ? {
                      id: s.id,
                      imageUrl: updated.imageUrl,
                      createdAt: updated.createdAt,
                    }
                  : s
              )
            : createEmptySlots().map((s) =>
                s.id === updated.slotId
                  ? {
                      id: s.id,
                      imageUrl: updated.imageUrl,
                      createdAt: updated.createdAt,
                    }
                  : s
              );
          return {
            slots,
            updatedAt: new Date().toISOString(),
          };
        });
        if (!data) fetchSlots();
      } catch {
        setUploadError("Ошибка сети или сервера");
      } finally {
        setUploading(false);
        setUploadingId(null);
      }
    },
    [data, uploading, fetchSlots]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  const startRandomRoulette = useCallback(() => {
    if (assignInFlight || assigning || uploading || rouletteRolling) return;
    setUploadError(null);
    setShowDragonList(false);

    const winnerFilename = DRAGON_FILENAMES[getUniformRandomInt(DRAGON_FILENAMES.length)];
    const winnerUrl = getDragonUrl(winnerFilename);
    const allDragonsOnce = shuffleWithUniformRandom(DRAGON_FILENAMES).map((filename) =>
      getDragonUrl(filename)
    );
    const randomBeforeWinner = buildNoAdjacentRandomUrls(
      18,
      allDragonsOnce[allDragonsOnce.length - 1] ?? null
    );
    const generatedTrack = [...allDragonsOnce, ...randomBeforeWinner];

    // Гарантируем, что победитель не идёт подряд с тем же драконом.
    const previousUrl = generatedTrack[generatedTrack.length - 1] ?? null;
    if (previousUrl && previousUrl === winnerUrl) {
      generatedTrack.push(pickRandomDragonUrl(new Set([previousUrl, winnerUrl])));
    }

    const winnerIndex = generatedTrack.length;
    generatedTrack.push(winnerUrl);
    const randomAfterWinner = buildNoAdjacentRandomUrls(14, winnerUrl);
    generatedTrack.push(...randomAfterWinner);

    setRouletteTrack(generatedTrack);
    setRouletteWinnerIndex(winnerIndex);
    setRouletteOffset(0);
    setRouletteDurationMs(0);
    setShowRandomRoulette(true);
    setRouletteRolling(false);
    setSelectedDragonUrl(null);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setRouletteRolling(true);
        setRouletteDurationMs(ROULETTE_SPIN_MS);
        setRouletteOffset(-(winnerIndex * ROULETTE_ITEM_STEP));
      });
    });

    if (rouletteTimerRef.current) clearTimeout(rouletteTimerRef.current);
    rouletteTimerRef.current = setTimeout(() => {
      setRouletteRolling(false);
      setSelectedDragonUrl(winnerUrl);
      rouletteTimerRef.current = setTimeout(() => {
        setShowRandomRoulette(false);
        setShowNickPrompt(true);
        setNickError(null);
        rouletteTimerRef.current = null;
      }, ROULETTE_RESULT_MS);
    }, ROULETTE_SPIN_MS + 200);
  }, [assigning, rouletteRolling, uploading]);

  const handleAssignDragon = useCallback(
    async (imageUrl: string, nick: string) => {
      if (assignInFlight) return;
      assignInFlight = true;
      setUploadError(null);
      setNickError(null);
      setAssigning(true);
      setUploadingId(null);
      try {
        const res = await fetch("/api/assign-slot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl, discordNick: nick }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setUploadError(body?.error || "Не удалось поставить дракона");
          return;
        }
        const payload = body as {
          slotId: number;
          imageUrl: string;
          createdAt: string;
          slots?: { id: number; imageUrl: string | null; createdAt: string | null }[];
          updatedAt?: string;
        };
        setShowNickPrompt(false);
        setSelectedDragonUrl(null);
        setDiscordNick("");
        if (payload.slots && Array.isArray(payload.slots) && payload.updatedAt) {
          setData({ slots: payload.slots, updatedAt: payload.updatedAt });
        } else {
          await fetchSlots();
        }
        setSprayFx({ slotId: payload.slotId, nonce: Date.now() });
        beginSprayReveal(payload.slotId);
      } catch {
        setUploadError("Ошибка сети или сервера");
      } finally {
        assignInFlight = false;
        setAssigning(false);
        setUploadingId(null);
      }
    },
    [beginSprayReveal, fetchSlots]
  );

  const confirmDragonChoice = useCallback(async () => {
    if (!selectedDragonUrl) return;
    const nick = discordNick.trim();
    if (!nick) {
      setNickError("Введите ник в Discord");
      return;
    }
    await handleAssignDragon(selectedDragonUrl, nick);
  }, [discordNick, handleAssignDragon, selectedDragonUrl]);

  const handleDelete = useCallback(
    async (slotId: number) => {
      if (!data || deletingId !== null) return;
      setUploadError(null);
      setDeletingId(slotId);
      try {
        const res = await fetch(`/api/slots?slotId=${slotId}`, {
          method: "DELETE",
          cache: "no-store",
        });
        const body = await res.json().catch(() => ({}));
        const alreadyEmpty =
          res.status === 400 &&
          typeof body?.error === "string" &&
          body.error.toLowerCase().includes("нет фото");
        if (!res.ok && !alreadyEmpty) {
          setUploadError(body?.error || "Не удалось удалить");
          return;
        }
        setData((prev) => {
          if (!prev) return prev;
          const slots = prev.slots.map((s) =>
            Number(s.id) === Number(slotId)
              ? { id: s.id, imageUrl: null, createdAt: null }
              : s
          );
          return { ...prev, slots, updatedAt: new Date().toISOString() };
        });
        setPendingRevealSlots((prev) => {
          const next = { ...prev };
          delete next[Number(slotId)];
          return next;
        });
      } catch {
        setUploadError("Ошибка сети");
      } finally {
        setDeletingId(null);
      }
    },
    [data, deletingId]
  );

  const slots = data?.slots?.length ? data.slots : createEmptySlots();
  const rowCount = Math.ceil(slots.length / WALL_COLUMNS) || INITIAL_ROWS;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-3 px-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="sr-only"
          onChange={onInputChange}
          disabled={uploading}
          aria-hidden
        />
        <button
          type="button"
          onClick={() => setShowDragonList(true)}
          disabled={loading || uploading || assigning}
          className="rounded-lg bg-amber-700/90 px-4 py-2 text-white font-medium shadow-md hover:bg-amber-800 disabled:pointer-events-none disabled:opacity-60"
        >
          {loading ? "Загрузка стены..." : uploading ? "Загрузка..." : "Выбрать своего дракона"}
        </button>
        <button
          type="button"
          onClick={startRandomRoulette}
          disabled={loading || uploading || assigning || rouletteRolling}
          className="rounded-lg bg-amber-700/90 px-4 py-2 text-white font-medium shadow-md hover:bg-amber-800 disabled:pointer-events-none disabled:opacity-60"
        >
          {rouletteRolling ? "Рулетка крутится..." : "Выбрать случайного дракона"}
        </button>
        {uploadError && (
          <p className="text-red-600 text-sm font-medium w-full text-center">{uploadError}</p>
        )}
      </div>

      {showRandomRoulette && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Рулетка случайного дракона"
        >
          <div
            className="bg-stone-100 rounded-xl shadow-xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-stone-800 text-center mb-4">
              Рулетка драконов
            </h2>
            <div className="relative mx-auto w-full max-w-[520px] rounded-xl border border-stone-300 bg-stone-200/70 p-3 overflow-hidden">
              <div
                className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-[3px] rounded-full bg-amber-700 z-20 shadow-[0_0_16px_rgba(217,119,6,0.5)]"
                aria-hidden
              />
              <div
                className="flex gap-3"
                style={{
                  paddingInline: `calc(50% - ${ROULETTE_ITEM_SIZE / 2}px)`,
                  transform: `translateX(${rouletteOffset}px)`,
                  transition:
                    rouletteDurationMs > 0
                      ? `transform ${rouletteDurationMs}ms cubic-bezier(0.08, 0.85, 0.2, 1)`
                      : "none",
                  willChange: "transform",
                }}
              >
                {rouletteTrack.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className={`relative shrink-0 rounded-lg overflow-hidden border bg-stone-300 transition-all duration-300 ${
                      !rouletteRolling && rouletteWinnerIndex === idx
                        ? "border-amber-500 ring-4 ring-amber-400/70 scale-110 shadow-2xl z-30"
                        : "border-amber-700/40"
                    }`}
                    style={{ width: ROULETTE_ITEM_SIZE, height: ROULETTE_ITEM_SIZE }}
                  >
                    <Image
                      src={url}
                      alt="Дракон в рулетке"
                      fill
                      sizes="96px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDragonList && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !assigning && setShowDragonList(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Список драконов"
        >
          <div
            className="bg-stone-100 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-stone-800">Выберите своего дракона</h2>
              <button
                type="button"
                onClick={() => !assigning && setShowDragonList(false)}
                disabled={assigning}
                className="text-stone-500 hover:text-stone-800 text-2xl leading-none disabled:opacity-50"
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {DRAGON_FILENAMES.map((filename) => {
                const imageUrl = getDragonUrl(filename);
                return (
                  <button
                    key={imageUrl}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (assignInFlight) return;
                      setSelectedDragonUrl(imageUrl);
                      setShowDragonList(false);
                      setShowNickPrompt(true);
                      setNickError(null);
                    }}
                    disabled={assigning}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-amber-700/50 hover:border-amber-700 hover:shadow-lg transition-all disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-amber-600"
                  >
                    <Image
                      src={imageUrl}
                      alt="Дракон"
                      fill
                      sizes="(max-width: 640px) 50vw, 200px"
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                );
              })}
            </div>
            {assigning && (
              <p className="text-center text-stone-600 mt-4">Добавляем на стену…</p>
            )}
          </div>
        </div>
      )}

      {showNickPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !assigning && setShowNickPrompt(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Введите Discord ник"
        >
          <div
            className="bg-stone-100 rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-stone-800 mb-3">
              Укажите ваш Discord ник
            </h2>
            <input
              type="text"
              value={discordNick}
              onChange={(e) => {
                setDiscordNick(e.target.value);
                if (nickError) setNickError(null);
              }}
              placeholder="Например: user#1234"
              disabled={assigning}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 outline-none focus:ring-2 focus:ring-amber-600"
            />
            {nickError && <p className="text-red-600 text-sm mt-2">{nickError}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => !assigning && setShowNickPrompt(false)}
                disabled={assigning}
                className="rounded-lg bg-stone-300 px-4 py-2 text-stone-800 font-medium hover:bg-stone-400 disabled:opacity-60"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmDragonChoice}
                disabled={assigning}
                className="rounded-lg bg-amber-700 px-4 py-2 text-white font-medium hover:bg-amber-800 disabled:opacity-60"
              >
                {assigning ? "Сохраняем..." : "Подтвердить выбор"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center px-4">
        <div
          className="w-full max-w-[1400px] wall-grid overflow-hidden bg-transparent"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${WALL_COLUMNS}, 1fr)`,
            gridTemplateRows: `repeat(${rowCount}, 1fr)`,
            gap: 0,
            aspectRatio: `${WALL_COLUMNS}/${rowCount}`,
          }}
        >
          {loading
            ? Array.from({ length: WALL_COLUMNS * INITIAL_ROWS }).map((_, i) => (
                <div key={i} className="bg-stone-600/30 animate-pulse" />
              ))
            : slots.map((slot: BrickSlot) => (
                <div key={slot.id} className="relative w-full min-h-0 overflow-hidden bg-transparent">
                  {pendingRevealSlots[Number(slot.id)] && (
                    <div className="spray-reveal-overlay spray-reveal-fill-layer" aria-hidden>
                      <div className="spray-reveal-fill" />
                    </div>
                  )}
                  {sprayFx && Number(sprayFx.slotId) === Number(slot.id) && (
                    <div
                      key={sprayFx.nonce}
                      className="spray-fx-overlay"
                      aria-hidden
                    >
                      <div className="spray-fx-cloud spray-fx-cloud-a" />
                      <div className="spray-fx-cloud spray-fx-cloud-b" />
                      <div className="spray-fx-cloud spray-fx-cloud-c" />
                      <div className="spray-fx-can" />
                    </div>
                  )}
                  <div className="relative z-10 h-full">
                    <Brick
                      slot={slot}
                      isLoading={uploadingId === slot.id}
                      onDelete={handleDelete}
                      isDeleting={deletingId === slot.id}
                      isRevealing={!!pendingRevealSlots[Number(slot.id)]}
                    />
                  </div>
                  {pendingRevealSlots[Number(slot.id)] && (
                    <div className="spray-reveal-overlay spray-reveal-can-layer" aria-hidden>
                      <div className="spray-reveal-can" />
                    </div>
                  )}
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
