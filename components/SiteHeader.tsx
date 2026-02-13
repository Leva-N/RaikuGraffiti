"use client";

import Image from "next/image";
import { useState } from "react";

const LOGO_GIF = "/images/1437826532855906415.gif";

export function SiteHeader() {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full border-b border-white/10 bg-white/5 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/[0.06]"
        role="banner"
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Image
              src={LOGO_GIF}
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-lg object-cover"
              unoptimized
            />
            <span
              className="text-xl font-bold tracking-tight drop-shadow-sm"
              style={{ color: "#9c64fb" }}
            >
              Raiku Graffiti
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAbout(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-stone-700 hover:bg-white/10 transition-colors"
            style={{ color: "#9c64fb" }}
          >
            О сайте
          </button>
        </div>
      </header>

      {showAbout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAbout(false)}
          role="dialog"
          aria-modal="true"
          aria-label="О сайте"
        >
          <div
            className="bg-stone-100/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-stone-800">О сайте</h2>
              <button
                type="button"
                onClick={() => setShowAbout(false)}
                className="text-stone-500 hover:text-stone-800 text-2xl leading-none p-1"
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="rounded-xl bg-white/60 p-5 border border-stone-200/80 flex flex-col items-center text-center">
                <div className="relative w-24 h-24 rounded-full overflow-hidden shrink-0 mb-4 border-2 border-stone-200">
                  <Image
                    src="/images/photo_2025-08-29_14-08-14.jpg"
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <p className="text-stone-600 text-sm leading-relaxed">
                  The full development, structuring, practical adaptation, and implementation of the project were carried out by{" "}
                  <a
                    href="https://x.com/LevSouth"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#9c64fb] hover:underline"
                  >
                    @levsouth
                  </a>
                </p>
              </section>
              <section className="rounded-xl bg-white/60 p-5 border border-stone-200/80 flex flex-col items-center text-center">
                <div className="relative w-24 h-24 rounded-full overflow-hidden shrink-0 mb-4 border-2 border-stone-200">
                  <Image
                    src="/images/photo_2024-10-02_21-18-39.jpg"
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <p className="text-stone-600 text-sm leading-relaxed">
                  The project is based on a conceptual idea proposed by{" "}
                  <a
                    href="https://x.com/nasty777coin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#9c64fb] hover:underline"
                  >
                    tamiON
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
