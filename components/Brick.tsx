"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export type BrickSlot = {
  id: number;
  imageUrl: string | null;
  createdAt: string | null;
};

type BrickProps = {
  slot: BrickSlot;
  isLoading?: boolean;
  onDelete?: (slotId: number) => void;
  isDeleting?: boolean;
};

export function Brick({ slot, isLoading, onDelete, isDeleting }: BrickProps) {
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
      className="absolute overflow-hidden transition-transform duration-200 ease-out hover:scale-[1.02]"
      style={{
        inset: "var(--niche-inset, 0)",
        touchAction: "none",
      }}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-800/50 animate-pulse">
          <span className="text-stone-300 text-lg">...</span>
        </div>
      ) : hasImage && slot.imageUrl ? (
        <>
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className="text-3xl font-light text-stone-600/80 select-none drop-shadow-sm"
            aria-hidden
          >
            +
          </span>
        </div>
      )}
    </div>
  );
}
