"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export type BrickSlot = {
  id: number;
  imageUrl: string | null;
  createdAt: string | null;
  discordNick?: string | null;
  ownerDiscordId?: string | null;
  ownerDiscordUsername?: string | null;
};

type BrickProps = {
  slot: BrickSlot;
  isLoading?: boolean;
  onDelete?: (slotId: number) => void;
  isDeleting?: boolean;
  canDelete?: boolean;
  /** Показывать фото с анимацией «постепенного закрашивания» (в такт граффити) */
  isRevealing?: boolean;
};

export function Brick({
  slot,
  isLoading,
  onDelete,
  isDeleting,
  canDelete,
  isRevealing,
}: BrickProps) {
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
      className="group absolute overflow-hidden transition-transform duration-200 ease-out hover:scale-[1.02] bg-transparent"
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
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className={`object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
              onError={handleError}
              unoptimized
            />
          </div>
          {slot.discordNick && (
            <div className="absolute bottom-0 left-0 right-0 py-0.5 px-1.5 sm:py-1 sm:px-2 bg-white text-xs sm:text-sm font-medium text-center truncate pointer-events-none z-[5]">
              <span className="brick-nick-shimmer">{slot.discordNick}</span>
            </div>
          )}
          {onDelete && canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(slot.id);
              }}
              disabled={isDeleting}
              className="absolute top-1 right-1 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full text-[#9c64fb] flex items-center justify-center text-base sm:text-lg font-bold hover:brightness-95 disabled:opacity-50 shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-150"
              style={{ backgroundColor: "#c0fe38" }}
              title="Delete photo"
              aria-label="Delete photo"
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
