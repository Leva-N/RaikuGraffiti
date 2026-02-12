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
};

export function Brick({ slot, isLoading }: BrickProps) {
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
      className="
        relative w-full h-full min-h-0
        transition-transform duration-200 ease-out
        hover:scale-[1.02]
        overflow-hidden
      "
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-800/50 animate-pulse">
          <span className="text-stone-300 text-lg">...</span>
        </div>
      ) : hasImage && slot.imageUrl ? (
        <div className="absolute inset-0 overflow-hidden bg-stone-900/90">
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
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-transparent">
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
