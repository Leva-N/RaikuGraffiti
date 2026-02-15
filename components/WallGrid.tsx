"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Brick, type BrickSlot } from "./Brick";
import type { SlotsData } from "@/lib/types";
import {
    createEmptySlots,
    WALL_COLUMNS,
    INITIAL_ROWS,
  } from "@/lib/types";
import { DRAGON_FILENAMES, getDragonUrl } from "@/lib/dragons";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { getNickColor, isAdminDiscordId } from "@/lib/permissions";
import { useLanguage } from "@/components/LanguageProvider";

let assignInFlight = false;
const ROULETTE_SPIN_MS = 9800;
const ROULETTE_RESULT_MS = 3000;
const SLOTS_CACHE_KEY = "raiku_wall_slots_v1";
const DEFAULT_SHARE_IMAGE =
  "/images/" + encodeURIComponent("ChatGPT Image 13 февр. 2026 г., 15_47_29.png");

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

/** Стабильный «хаотичный» наклон для слота в градусах (-12..12) */
function getSlotTiltDeg(slotId: number): number {
  const n = Number(slotId);
  return ((n * 11 + 7) % 25) - 12;
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
  const [loading, setLoading] = useState(false);
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
  const [showAssignConfirm, setShowAssignConfirm] = useState(false);
  const [selectedDragonUrl, setSelectedDragonUrl] = useState<string | null>(null);
  const [connectHint, setConnectHint] = useState<string | null>(null);
  const [publishedSearch, setPublishedSearch] = useState("");
  const [highlightedSlotId, setHighlightedSlotId] = useState<number | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(0);
  const [pendingRevealSlots, setPendingRevealSlots] = useState<Record<number, true>>({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const revealTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const rouletteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slotRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const { data: session } = useSession();
  const currentDiscordId = session?.user?.id ?? null;
  const isAdmin = isAdminDiscordId(currentDiscordId);
  const { language, t } = useLanguage();
  const shuffledDragonFilenames = useMemo(() => shuffleWithUniformRandom(DRAGON_FILENAMES), []);

  const requireDiscordConnection = () => {
    if (currentDiscordId) {
      setConnectHint(null);
      return true;
    }
    setConnectHint(t.wall.connectHint);
    return false;
  };

  const fetchSlots = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch("/api/slots", { cache: "no-store", signal: controller.signal });
      if (!res.ok) throw new Error("Failed to load slots");
      const json = (await res.json()) as SlotsData;
      setData(json);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(SLOTS_CACHE_KEY, JSON.stringify(json));
        } catch (e) {
          console.warn("slots cache write failed", e);
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Keep current UI state on timeout; do not reset slots to empty.
        return;
      }
      console.error(err);
      setData((prev) => prev ?? { slots: createEmptySlots(), updatedAt: new Date().toISOString() });
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(SLOTS_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as SlotsData;
          if (parsed?.slots && Array.isArray(parsed.slots) && typeof parsed.updatedAt === "string") {
            setData(parsed);
          }
        }
      } catch (e) {
        console.warn("slots cache read failed", e);
      }
    }
    fetchSlots();
  }, [fetchSlots]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);
    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  const isMobile = viewportWidth > 0 && viewportWidth < 640;
  const isTablet = viewportWidth >= 640 && viewportWidth < 1024;
  const displayColumns = isMobile ? 2 : isTablet ? 3 : WALL_COLUMNS;
  const rouletteItemSize = isMobile ? 72 : 96;
  const rouletteItemGap = isMobile ? 8 : 12;
  const rouletteItemStep = rouletteItemSize + rouletteItemGap;

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
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (currentDiscordId) {
      setConnectHint(null);
    }
  }, [currentDiscordId]);

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

  const focusSlot = useCallback((slotId: number) => {
    const numericSlotId = Number(slotId);
    const target = slotRefs.current[numericSlotId];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
    setHighlightedSlotId(numericSlotId);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedSlotId((prev) => (prev === numericSlotId ? null : prev));
      highlightTimerRef.current = null;
    }, 4500);
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (uploading) return;
      setUploadError(null);
      setConnectHint(null);
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
          const msg = res.status === 413 ? t.wall.fileTooLarge : t.wall.uploadFailed;
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
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            focusSlot(updated.slotId);
          });
        });
      } catch {
        setUploadError(t.wall.networkOrServerError);
      } finally {
        setUploading(false);
        setUploadingId(null);
      }
    },
    [data, uploading, fetchSlots, focusSlot, t.wall.fileTooLarge, t.wall.networkOrServerError, t.wall.uploadFailed]
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
    setConnectHint(null);
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
        setRouletteOffset(-(winnerIndex * rouletteItemStep));
      });
    });

    if (rouletteTimerRef.current) clearTimeout(rouletteTimerRef.current);
    rouletteTimerRef.current = setTimeout(() => {
      setRouletteRolling(false);
      setSelectedDragonUrl(winnerUrl);
      rouletteTimerRef.current = setTimeout(() => {
        setShowRandomRoulette(false);
        setShowAssignConfirm(true);
        rouletteTimerRef.current = null;
      }, ROULETTE_RESULT_MS);
    }, ROULETTE_SPIN_MS + 200);
  }, [assigning, rouletteRolling, rouletteItemStep, uploading]);

  const handleAssignDragon = useCallback(
    async (imageUrl: string) => {
      if (assignInFlight) return;
      if (!currentDiscordId) {
        setUploadError(t.wall.connectHint);
        return;
      }
      assignInFlight = true;
      setUploadError(null);
      setAssigning(true);
      setUploadingId(null);
      try {
        const res = await fetch("/api/assign-slot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setUploadError(t.wall.assignFailed);
          return;
        }
        const payload = body as {
          slotId: number;
          imageUrl: string;
          createdAt: string;
          slots?: { id: number; imageUrl: string | null; createdAt: string | null }[];
          updatedAt?: string;
        };
        setShowAssignConfirm(false);
        setSelectedDragonUrl(null);
        if (payload.slots && Array.isArray(payload.slots) && payload.updatedAt) {
          setData({ slots: payload.slots, updatedAt: payload.updatedAt });
        } else {
          await fetchSlots();
        }
        setSprayFx({ slotId: payload.slotId, nonce: Date.now() });
        beginSprayReveal(payload.slotId);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            focusSlot(payload.slotId);
          });
        });
      } catch {
        setUploadError(t.wall.networkOrServerError);
      } finally {
        assignInFlight = false;
        setAssigning(false);
        setUploadingId(null);
      }
    },
    [
      beginSprayReveal,
      currentDiscordId,
      fetchSlots,
      focusSlot,
      t.wall.assignFailed,
      t.wall.connectHint,
      t.wall.networkOrServerError,
    ]
  );

  const confirmDragonChoice = useCallback(async () => {
    if (!selectedDragonUrl) return;
    await handleAssignDragon(selectedDragonUrl);
  }, [handleAssignDragon, selectedDragonUrl]);

  const handleDelete = useCallback(
    async (slotId: number) => {
      if (!data || deletingId !== null) return;
      setUploadError(null);
      setConnectHint(null);
      setDeletingId(slotId);
      try {
        const res = await fetch(`/api/slots?slotId=${slotId}`, {
          method: "DELETE",
          cache: "no-store",
        });
        if (!res.ok) {
          setUploadError(t.wall.uploadFailed);
          return;
        }
        setData((prev) => {
          if (!prev) return prev;
          const slots = prev.slots.map((s) =>
            Number(s.id) === Number(slotId)
              ? {
                  id: s.id,
                  imageUrl: null,
                  createdAt: null,
                  discordNick: null,
                  ownerDiscordId: null,
                  ownerDiscordUsername: null,
                      ownerDiscordAvatar: null,
                }
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
        setUploadError(t.wall.networkError);
      } finally {
        setDeletingId(null);
      }
    },
    [data, deletingId, t.wall.networkError, t.wall.uploadFailed]
  );

  const slots = data?.slots?.length ? data.slots : createEmptySlots();
  const userDragonUrl = useMemo(() => {
    if (!currentDiscordId) return null;
    const owned = slots
      .filter((slot) => Boolean(slot.imageUrl) && slot.ownerDiscordId === currentDiscordId)
      .sort((a, b) => {
        const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
        return bTime - aTime;
      });
    return owned[0]?.imageUrl ?? null;
  }, [currentDiscordId, slots]);
  const rowCount = Math.ceil(slots.length / displayColumns) || INITIAL_ROWS;
  const publishedSlots = useMemo(() => slots.filter((slot) => !!slot.imageUrl), [slots]);
  const normalizedSearch = publishedSearch.trim().toLowerCase();
  const filteredPublishedSlots = useMemo(() => {
    if (!normalizedSearch) return publishedSlots;
    return publishedSlots.filter((slot) => {
      const nick = (slot.discordNick ?? "").toLowerCase();
      const username = (slot.ownerDiscordUsername ?? "").toLowerCase();
      return nick.includes(normalizedSearch) || username.includes(normalizedSearch);
    });
  }, [normalizedSearch, publishedSlots]);

  const buildShareUrl = useCallback(() => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    const defaultImageUrl = `${origin}${DEFAULT_SHARE_IMAGE}`;
    let imageUrl = defaultImageUrl;
    if (currentDiscordId) {
      const picked = selectedDragonUrl ?? userDragonUrl;
      if (picked) {
        imageUrl = picked.startsWith("http") ? picked : `${origin}${picked}`;
      }
    }
    const url = new URL("/share", origin);
    url.searchParams.set("image", imageUrl);
    url.searchParams.set("lang", language);
    return url.toString();
  }, [currentDiscordId, language, selectedDragonUrl, userDragonUrl]);

  const openShareWindow = useCallback(
    (url: string) => {
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) setShareFeedback(t.wall.shareOpenFailed);
    },
    [t.wall.shareOpenFailed]
  );

  const handleTelegramShare = useCallback(() => {
    const shareUrl = buildShareUrl();
    const url = new URL("https://t.me/share/url");
    url.searchParams.set("url", shareUrl);
    url.searchParams.set("text", `${t.shareDescription}.`);
    openShareWindow(url.toString());
  }, [buildShareUrl, openShareWindow, t.shareDescription]);

  const handleTwitterShare = useCallback(() => {
    const shareUrl = buildShareUrl();
    const url = new URL("https://twitter.com/intent/tweet");
    url.searchParams.set("url", shareUrl);
    url.searchParams.set("text", `${t.shareTitle}. ${t.shareDescription}.`);
    openShareWindow(url.toString());
  }, [buildShareUrl, openShareWindow, t.shareDescription, t.shareTitle]);

  const handleFacebookShare = useCallback(() => {
    const shareUrl = buildShareUrl();
    const url = new URL("https://www.facebook.com/sharer/sharer.php");
    url.searchParams.set("u", shareUrl);
    openShareWindow(url.toString());
  }, [buildShareUrl, openShareWindow]);

  const handleCopyLink = useCallback(async () => {
    const shareUrl = buildShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback(t.wall.shareCopied);
    } catch {
      setShareFeedback(t.wall.shareCopyFailed);
    }
  }, [buildShareUrl, t.wall.shareCopied, t.wall.shareCopyFailed]);

  const handleNativeShare = useCallback(async () => {
    const shareUrl = buildShareUrl();
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: t.shareTitle,
        text: t.shareDescription,
        url: shareUrl,
      });
    } catch {
      // User cancelled sharing dialog.
    }
  }, [buildShareUrl, t.shareDescription, t.shareTitle]);

  return (
    <div className="space-y-4">
      <div className="relative z-30 flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4">
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
          onClick={() => {
            if (!requireDiscordConnection()) return;
            setShowDragonList(true);
          }}
          disabled={uploading || assigning}
          className="w-full sm:w-auto rounded-lg px-4 py-2 text-sm sm:text-base font-medium shadow-md disabled:pointer-events-none disabled:opacity-60"
          style={{ backgroundColor: "#c0fe38", color: "#9c64fb" }}
        >
          {uploading ? t.wall.uploading : t.wall.chooseDragon}
        </button>
        <button
          type="button"
          onClick={() => {
            if (!requireDiscordConnection()) return;
            startRandomRoulette();
          }}
          disabled={uploading || assigning || rouletteRolling}
          className="w-full sm:w-auto rounded-lg px-4 py-2 text-sm sm:text-base font-medium shadow-md disabled:pointer-events-none disabled:opacity-60"
          style={{ backgroundColor: "#c0fe38", color: "#9c64fb" }}
        >
          {rouletteRolling ? t.wall.rouletteSpinning : t.wall.chooseRandomDragon}
        </button>
        <button
          type="button"
          onClick={() => {
            setShareFeedback(null);
            setShowShareModal(true);
          }}
          className="w-full sm:w-auto rounded-lg px-4 py-2 text-sm sm:text-base font-medium shadow-md hover:brightness-95"
          style={{ backgroundColor: "#c0fe38", color: "#9c64fb" }}
        >
          {t.wall.shareButton}
        </button>
        {connectHint && (
          <p className="text-red-600 text-sm font-medium w-full text-center">{connectHint}</p>
        )}
        {uploadError && (
          <p className="text-red-600 text-sm font-medium w-full text-center">{uploadError}</p>
        )}
      </div>
      <div className="relative z-20 mx-auto w-full max-w-[1400px] px-4">
        <div className="rounded-xl border border-stone-300/70 bg-stone-100/70 p-3 sm:p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h3 className="w-full sm:w-auto font-semibold text-sm sm:text-base" style={{ color: "#9c64fb" }}>
              {t.wall.quickSearchTitle}
            </h3>
            <input
              type="text"
              value={publishedSearch}
              onChange={(e) => setPublishedSearch(e.target.value)}
              placeholder={t.wall.quickSearchPlaceholder}
              className="min-w-0 w-full sm:min-w-[220px] sm:flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-amber-600"
            />
          </div>
          {normalizedSearch && (
            <div className="mt-3 max-h-48 overflow-auto rounded-lg border border-stone-200 bg-white/70 p-2">
              {filteredPublishedSlots.length === 0 ? (
                <p className="px-2 py-3 text-sm text-stone-600">{t.wall.noPublishedFound}</p>
              ) : (
                <div className="space-y-1">
                  {filteredPublishedSlots.map((slot) => (
                    <button
                      key={`published-${slot.id}`}
                      type="button"
                      onClick={() => focusSlot(slot.id)}
                      className="flex w-full items-center gap-2 sm:gap-3 rounded-md px-2 py-1.5 text-left hover:bg-stone-100"
                    >
                      {slot.imageUrl ? (
                        <Image
                          src={slot.imageUrl}
                          alt={t.wall.publishedDragonAlt}
                          width={32}
                          height={32}
                          className="h-8 w-8 sm:h-[34px] sm:w-[34px] rounded object-cover border border-stone-300"
                        />
                      ) : (
                        <div className="h-[34px] w-[34px] rounded border border-stone-300 bg-stone-200" />
                      )}
                      <span className="flex min-w-0 flex-1 items-center gap-1.5">
                        {slot.ownerDiscordAvatar ? (
                          <Image
                            src={slot.ownerDiscordAvatar}
                            alt=""
                            width={18}
                            height={18}
                            className="h-[18px] w-[18px] rounded-full object-cover border border-stone-300 shrink-0"
                            referrerPolicy="no-referrer"
                            unoptimized
                          />
                        ) : null}
                        <span
                          className="truncate text-xs"
                          style={{
                            color: getNickColor(slot.ownerDiscordId) ?? "#44403c",
                            fontWeight: getNickColor(slot.ownerDiscordId) ? 700 : 400,
                          }}
                        >
                          {slot.discordNick || slot.ownerDiscordUsername || t.wall.unknownUser}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showRandomRoulette && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t.wall.rouletteDialogLabel}
        >
          <div
            className="bg-stone-100 rounded-xl shadow-xl max-w-2xl w-full p-3 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg sm:text-xl font-semibold text-stone-800 text-center mb-3 sm:mb-4">
              <span style={{ color: "#9c64fb" }}>{t.wall.rouletteTitle}</span>
            </h2>
            <div className="relative mx-auto w-full max-w-[520px] rounded-xl border border-stone-300 bg-stone-200/70 p-2 sm:p-3 overflow-hidden">
              <div
                className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-[3px] rounded-full bg-amber-700 z-20 shadow-[0_0_16px_rgba(217,119,6,0.5)]"
                aria-hidden
              />
              <div
                className="flex"
                style={{
                  gap: `${rouletteItemGap}px`,
                  paddingInline: `calc(50% - ${rouletteItemSize / 2}px)`,
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
                    style={{ width: rouletteItemSize, height: rouletteItemSize }}
                  >
                    <Image
                      src={url}
                      alt={t.wall.rouletteDragonAlt}
                      fill
                      sizes={isMobile ? "72px" : "96px"}
                      className="object-cover"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4"
          onClick={() => !assigning && setShowDragonList(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t.wall.dragonListDialogLabel}
        >
          <div
            className="bg-stone-100 rounded-xl shadow-xl max-w-4xl w-full max-h-[92vh] overflow-auto p-3 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-4">
              <div />
              <h2 className="text-lg sm:text-xl font-semibold text-center" style={{ color: "#9c64fb" }}>
                {t.wall.chooseDragonModalTitle}
              </h2>
              <button
                type="button"
                onClick={() => !assigning && setShowDragonList(false)}
                disabled={assigning}
                className="justify-self-end text-stone-500 hover:text-stone-800 text-2xl leading-none disabled:opacity-50"
                aria-label={t.header.close}
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
              {shuffledDragonFilenames.map((filename) => {
                const imageUrl = getDragonUrl(filename);
                return (
                  <button
                    key={imageUrl}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (assignInFlight) return;
                      setShowDragonList(false);
                      setSelectedDragonUrl(imageUrl);
                      setShowAssignConfirm(true);
                    }}
                    disabled={assigning}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-amber-700/50 hover:border-amber-700 hover:shadow-lg transition-all disabled:opacity-60 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-amber-600"
                  >
                    <Image
                      src={imageUrl}
                      alt={t.wall.dragonAlt}
                      fill
                      sizes="(max-width: 640px) 50vw, 200px"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
            {assigning && (
              <p className="text-center text-stone-600 mt-4">{t.wall.addingToWall}</p>
            )}
          </div>
        </div>
      )}

      {showAssignConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t.wall.assignPreviewLabel}
        >
          <div
            className="relative h-full w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col items-center justify-center gap-3 sm:gap-5">
              {selectedDragonUrl && (
                <div className="relative h-[62vh] sm:h-[72vh] w-full overflow-hidden rounded-xl sm:rounded-2xl border border-stone-300/50 bg-black/30 shadow-2xl">
                  <Image
                    src={selectedDragonUrl}
                    alt={t.wall.selectedDragonPreviewAlt}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <div className="flex w-full max-w-[720px] flex-col-reverse sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => !assigning && setShowAssignConfirm(false)}
                  disabled={assigning}
                  className="w-full sm:w-auto rounded-lg px-5 py-2.5 font-medium shadow-md transition-colors disabled:pointer-events-none disabled:opacity-60 hover:brightness-95"
                  style={{ backgroundColor: "#c0fe38", color: "#9c64fb" }}
                >
                  ✕ {t.wall.chooseAnother}
                </button>
                <button
                  type="button"
                  onClick={confirmDragonChoice}
                  disabled={assigning || !selectedDragonUrl}
                  className="w-full sm:w-auto rounded-lg px-5 py-2.5 font-medium shadow-md transition-colors disabled:pointer-events-none disabled:opacity-60 hover:brightness-95"
                  style={{ backgroundColor: "#c0fe38", color: "#9c64fb" }}
                >
                  {assigning ? t.wall.saving : `✓ ${t.wall.confirmChoice}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4"
          onClick={() => setShowShareModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t.wall.shareModalTitle}
        >
          <div
            className="bg-stone-100 rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold" style={{ color: "#9c64fb" }}>
                {t.wall.shareModalTitle}
              </h2>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-stone-500 hover:text-stone-800 text-2xl leading-none"
                aria-label={t.header.close}
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleTelegramShare}
                className="w-full rounded-lg px-4 py-2 text-left text-sm sm:text-base font-medium shadow-sm hover:brightness-95"
                style={{ backgroundColor: "#c0fe38", color: "#9c64fb" }}
              >
                {t.wall.shareTelegram}
              </button>
              <button
                type="button"
                onClick={handleTwitterShare}
                className="w-full rounded-lg px-4 py-2 text-left text-sm sm:text-base font-medium shadow-sm hover:brightness-95"
                style={{ backgroundColor: "#c0fe38", color: "#9c64fb" }}
              >
                {t.wall.shareTwitter}
              </button>
              <button
                type="button"
                onClick={handleFacebookShare}
                className="w-full rounded-lg px-4 py-2 text-left text-sm sm:text-base font-medium shadow-sm hover:brightness-95"
                style={{ backgroundColor: "#c0fe38", color: "#9c64fb" }}
              >
                {t.wall.shareFacebook}
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full rounded-lg px-4 py-2 text-left text-sm sm:text-base font-medium shadow-sm hover:brightness-95"
                style={{ backgroundColor: "#c0fe38", color: "#9c64fb" }}
              >
                {t.wall.shareCopyLink}
              </button>
              {(isMobile || isTablet) && typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full rounded-lg px-4 py-2 text-left text-sm sm:text-base font-medium shadow-sm hover:brightness-95"
                  style={{ backgroundColor: "#c0fe38", color: "#9c64fb" }}
                >
                  {t.wall.shareNative}
                </button>
              )}
            </div>
            {shareFeedback && <p className="mt-3 text-sm text-stone-700">{shareFeedback}</p>}
          </div>
        </div>
      )}

      <div className="relative z-0 flex justify-center px-2 sm:px-4 py-4 sm:py-6">
        <div
          className="w-full max-w-[1400px] wall-grid overflow-visible bg-transparent"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${displayColumns}, 1fr)`,
            gridTemplateRows: `repeat(${rowCount}, 1fr)`,
            gap: isMobile ? 8 : isTablet ? 12 : 16,
            aspectRatio: `${displayColumns}/${rowCount}`,
          }}
        >
          {loading
            ? Array.from({ length: displayColumns * INITIAL_ROWS }).map((_, i) => (
                <div key={i} className="bg-stone-600/30 animate-pulse rounded-lg" />
              ))
            : slots.map((slot: BrickSlot) => (
                <div
                  key={slot.id}
                  ref={(node) => {
                    slotRefs.current[Number(slot.id)] = node;
                  }}
                  className={`relative w-full min-h-0 overflow-visible bg-transparent transition-shadow duration-300 ${
                    highlightedSlotId === Number(slot.id)
                      ? "rounded-lg shadow-[0_0_0_4px_rgba(251,191,36,0.8),0_0_28px_rgba(217,119,6,0.45)]"
                      : ""
                  }`}
                  style={{ transform: `rotate(${getSlotTiltDeg(slot.id)}deg)` }}
                >
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
                      canDelete={
                        !!slot.imageUrl &&
                        !!currentDiscordId &&
                        (slot.ownerDiscordId === currentDiscordId || isAdmin)
                      }
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
