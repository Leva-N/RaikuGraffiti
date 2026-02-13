"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export type BrickSlot = {
  id: number;
  imageUrl: string | null;
  createdAt: string | null;
  discordNick?: string | null;
};

type BrickProps = {
  slot: BrickSlot;
  isLoading?: boolean;
  onDelete?: (slotId: number) => void;
  isDeleting?: boolean;
  /** Показывать фото с анимацией «постепенного закрашивания» (в такт граффити) */
  isRevealing?: boolean;
};

export function Brick({ slot, isLoading, onDelete, isDeleting, isRevealing }: BrickProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const hasImage = Boolean(slot.imageUrl) && !imgError;

  useEffect(() => {
    setImgError(false);
    setImgLoaded(false);
  }, [slot.imageUrl]);

  const handleError = useCallback(() => setImgError(true), []);

  return (
    <div
      className="absolute overflow-hidden transition-transform duration-200 ease-out hover:scale-[1.02] bg-transparent"
      style={{
        inset: "var(--niche-inset, 0)",
        touchAction: "none",
      }}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-transparent animate-pulse">
          <span className="text-stone-600/80 text-lg">...</span>
        </div>
      ) : hasImage && slot.imageUrl ? (
        <>
          <div className={isRevealing ? "brick-image-reveal absolute inset-0 overflow-hidden" : "absolute inset-0"}>
            <Image
              src={slot.imageUrl}
              alt=""
              fill
              sizes="(max-width: 1400px) 20vw, 280px"
              className={`object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
              onError={handleError}
              unoptimized
            />
          </div>
          {slot.discordNick && (
            <div className="absolute bottom-0 left-0 right-0 py-1.5 px-2 bg-white text-xs font-medium text-center truncate pointer-events-none z-[5]">
              <span className="brick-nick-shimmer">{slot.discordNick}</span>
            </div>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(slot.id);
              }}
              disabled={isDeleting}
              className="absolute top-1 right-1 z-10 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-lg font-bold hover:bg-red-700 disabled:opacity-50 transition-colors shadow-lg pointer-events-auto"
              title="Удалить фото"
              aria-label="Удалить фото"
            >
              {isDeleting ? "…" : "×"}
            </button>
          )}
        </>
      ) : (
        <div className="absolute inset-0 pointer-events-none" />
      )}
    </div>
  );
}
