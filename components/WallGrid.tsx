"use client";

import { useCallback, useEffect, useState } from "react";
import { Brick, type BrickSlot } from "./Brick";
import type { SlotsData } from "@/lib/types";
import {
    createEmptySlots,
    WALL_COLUMNS,
    INITIAL_ROWS,
    NICHES_PER_IMAGE_ROW,
  } from "@/lib/types";

type WallGridProps = {
  backgroundImageUrl: string;
};

export function WallGrid({ backgroundImageUrl }: WallGridProps) {
  const [data, setData] = useState<SlotsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchSlots = useCallback(async () => {
    try {
      const res = await fetch("/api/slots", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load slots");
      const json = (await res.json()) as SlotsData;
      setData(json);
    } catch (err) {
      console.error(err);
      setData({ slots: createEmptySlots(), updatedAt: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleFile = useCallback(
    async (file: File) => {
      if (uploading || !data) return;
      setUploadError(null);
      setUploading(true);

      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: form,
        });
        const body = await res.json();

        if (!res.ok) {
          setUploadError(body.error || "Ошибка загрузки");
          return;
        }

        const updated = body as { slotId: number; imageUrl: string; createdAt: string };
        setUploadingId(updated.slotId);
        setData((prev) => {
          if (!prev) return prev;
          const slots = prev.slots.map((s) =>
            s.id === updated.slotId
              ? {
                  id: s.id,
                  imageUrl: updated.imageUrl,
                  createdAt: updated.createdAt,
                }
              : s
          );
          return { ...prev, slots, updatedAt: new Date().toISOString() };
        });
      } catch {
        setUploadError("Ошибка сети");
      } finally {
        setUploading(false);
        setUploadingId(null);
      }
    },
    [data, uploading]
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

  const slots = data?.slots?.length ? data.slots : createEmptySlots();
  const rowCount = Math.ceil(slots.length / WALL_COLUMNS) || INITIAL_ROWS;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <div
            className="w-full max-w-[1400px] grid bg-stone-500/20 rounded-lg overflow-hidden"
            style={{
              aspectRatio: `${WALL_COLUMNS}/${INITIAL_ROWS}`,
              gridTemplateColumns: `repeat(${WALL_COLUMNS}, 1fr)`,
              gridTemplateRows: `repeat(${INITIAL_ROWS}, 1fr)`,
              gap: 0,
            }}
          >
            {Array.from({ length: WALL_COLUMNS * INITIAL_ROWS }).map((_, i) => (
              <div key={i} className="bg-stone-600/30 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-3 px-4">
        <label className="cursor-pointer rounded-lg bg-amber-700/90 px-4 py-2 text-white font-medium shadow-md hover:bg-amber-800 disabled:pointer-events-none disabled:opacity-60">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="sr-only"
            onChange={onInputChange}
            disabled={uploading}
          />
          {uploading ? "Загрузка…" : "Добавить фото"}
        </label>
        {uploadError && (
          <p className="text-red-600 text-sm font-medium">{uploadError}</p>
        )}
      </div>

      <div className="flex justify-center px-4">
        <div
          className="w-full max-w-[1400px] wall-grid overflow-hidden rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${WALL_COLUMNS}, 1fr)`,
            gridTemplateRows: `repeat(${rowCount}, 1fr)`,
            gap: 0,
            aspectRatio: `${WALL_COLUMNS}/${rowCount}`,
          }}
        >
          {slots.map((slot: BrickSlot) => {
            const col = slot.id % WALL_COLUMNS;
            const row = Math.floor(slot.id / WALL_COLUMNS);
            const bgX = (col / (WALL_COLUMNS - 1 || 1)) * 100;
            const bgY = ((row % NICHES_PER_IMAGE_ROW) / (NICHES_PER_IMAGE_ROW - 1 || 1)) * 100;
            return (
              <div
                key={slot.id}
                className="relative w-full min-h-0"
                style={{
                  backgroundImage: `url('${backgroundImageUrl}')`,
                  backgroundSize: `${WALL_COLUMNS * 100}% ${NICHES_PER_IMAGE_ROW * 100}%`,
                  backgroundRepeat: "repeat-y",
                  backgroundPosition: `${bgX}% ${bgY}%`,
                }}
              >
                <Brick
                  slot={slot}
                  isLoading={uploadingId === slot.id}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
