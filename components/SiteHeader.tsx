"use client";

import Image from "next/image";
import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useLanguage } from "@/components/LanguageProvider";

const LOGO_GIF = "/images/1437826532855906415.gif";

export function SiteHeader() {
  const [showAbout, setShowAbout] = useState(false);
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const { language, setLanguage, t } = useLanguage();

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full border-b border-white/10 bg-white/5 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/[0.06]"
        role="banner"
      >
        <div className="mx-auto flex min-h-16 max-w-[1400px] flex-wrap items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-0">
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 hidden md:block">
            <span className="header-heart-shimmer text-base lg:text-xl font-semibold tracking-wide">
              {t.header.foreverInHeart}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Image
              src={LOGO_GIF}
              alt=""
              width={44}
              height={44}
              className="h-9 w-9 sm:h-11 sm:w-11 shrink-0 rounded-lg object-cover"
              unoptimized
            />
            <span
              className="text-lg sm:text-xl font-bold tracking-tight drop-shadow-sm"
              style={{ color: "#9c64fb" }}
            >
              Raiku Graffiti
            </span>
          </div>
          <div className="flex w-full sm:w-auto items-center justify-end gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => (isAuthed ? signOut() : signIn("discord"))}
              disabled={status === "loading"}
              className="rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-stone-700 hover:bg-white/10 transition-colors disabled:opacity-60 whitespace-nowrap"
              style={{ color: "#9c64fb" }}
            >
              {isAuthed
                ? `${t.header.disconnectDiscord} @${session?.user?.name ?? "Discord"}`
                : t.header.connectDiscord}
            </button>
            <button
              type="button"
              onClick={() => setShowAbout(true)}
              className="rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-stone-700 hover:bg-white/10 transition-colors whitespace-nowrap"
              style={{ color: "#9c64fb" }}
            >
              {t.header.about}
            </button>
            <div className="rounded-lg px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`transition-colors ${language === "en" ? "text-[#9dbf2f]" : "text-[#9c64fb]"}`}
                aria-label="Switch to English"
              >
                ENG
              </button>
              <span className="px-1.5 text-stone-500">|</span>
              <button
                type="button"
                onClick={() => setLanguage("ru")}
                className={`transition-colors ${language === "ru" ? "text-[#9dbf2f]" : "text-[#9c64fb]"}`}
                aria-label="Switch to Russian"
              >
                CIS
              </button>
            </div>
          </div>
        </div>
      </header>

      {showAbout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAbout(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t.header.about}
        >
          <div
            className="bg-stone-100/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-stone-800">{t.header.about}</h2>
              <button
                type="button"
                onClick={() => setShowAbout(false)}
                className="text-stone-500 hover:text-stone-800 text-2xl leading-none p-1"
                aria-label={t.header.close}
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
                  {language === "ru" ? t.header.aboutCreditRu : t.header.aboutCredit}{" "}
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
                  {t.header.conceptCredit}{" "}
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
