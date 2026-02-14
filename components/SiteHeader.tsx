"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useLanguage } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";
import { LANGUAGE_OPTIONS, type Language } from "@/lib/i18n";

const LOGO_GIF = "/images/1437826532855906415.gif";
const getFlagIconUrl = (countryCode: string) =>
  `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;

const THEME_HINTS: Record<Language, { dark: string; light: string }> = {
  en: { dark: "Switch to dark mode", light: "Switch to light mode" },
  ru: { dark: "Включить тёмную тему", light: "Включить светлую тему" },
  ja: { dark: "ダークモードに切り替え", light: "ライトモードに切り替え" },
  zh: { dark: "切换到深色模式", light: "切换到浅色模式" },
  vi: { dark: "Chuyển sang chế độ tối", light: "Chuyển sang chế độ sáng" },
  hi: { dark: "डार्क मोड चालू करें", light: "लाइट मोड चालू करें" },
  id: { dark: "Beralih ke mode gelap", light: "Beralih ke mode terang" },
  es: { dark: "Cambiar a modo oscuro", light: "Cambiar a modo claro" },
  ar: { dark: "التبديل إلى الوضع الداكن", light: "التبديل إلى الوضع الفاتح" },
};

export function SiteHeader() {
  const [showAbout, setShowAbout] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const activeLanguage = LANGUAGE_OPTIONS.find((option) => option.code === language) ?? LANGUAGE_OPTIONS[0];
  const themeHint = isDark ? THEME_HINTS[language].light : THEME_HINTS[language].dark;

  useEffect(() => {
    if (!showLanguageMenu && !showMobileMenu) return;
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedLanguageMenu = languageMenuRef.current?.contains(target);
      const clickedMobileMenu = mobileMenuRef.current?.contains(target);
      if (showLanguageMenu && !clickedLanguageMenu && !clickedMobileMenu) {
        setShowLanguageMenu(false);
      }
      if (showMobileMenu && !clickedMobileMenu) {
        setShowMobileMenu(false);
        setShowLanguageMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showLanguageMenu, showMobileMenu]);

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
          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            <div className="relative min-[1139px]:hidden" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu((prev) => !prev);
                  setShowLanguageMenu(false);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#9c64fb]/60 bg-black/20 text-xl leading-none"
                style={{ color: "#9c64fb" }}
                aria-label="Open menu"
                aria-expanded={showMobileMenu}
              >
                ☰
              </button>
              {showMobileMenu && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-stone-200 bg-stone-100/95 p-2 shadow-xl backdrop-blur-sm">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMobileMenu(false);
                        setShowLanguageMenu(false);
                        if (isAuthed) {
                          signOut();
                          return;
                        }
                        signIn("discord");
                      }}
                      disabled={status === "loading"}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-60"
                      style={{ color: "#9c64fb" }}
                    >
                      {isAuthed
                        ? `${t.header.disconnectDiscord} @${session?.user?.name ?? "Discord"}`
                        : t.header.connectDiscord}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLanguageMenu((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/10"
                      style={{ color: "#9c64fb" }}
                      aria-label={t.header.languageMenuAria}
                      aria-expanded={showLanguageMenu}
                    >
                      <span className="flex items-center gap-2">
                        <Image
                          src={getFlagIconUrl(activeLanguage.flag)}
                          alt=""
                          width={18}
                          height={14}
                          className="h-[14px] w-[18px] rounded-sm object-cover"
                          unoptimized
                        />
                        <span>{activeLanguage.label}</span>
                      </span>
                      <span>{showLanguageMenu ? "▴" : "▾"}</span>
                    </button>
                    {showLanguageMenu && (
                      <div className="rounded-lg border border-stone-200 bg-white/70 p-1">
                        {LANGUAGE_OPTIONS.map((option) => {
                          const isActive = option.code === language;
                          return (
                            <button
                              key={`mobile-${option.code}`}
                              type="button"
                              onClick={() => {
                                setLanguage(option.code);
                                setShowLanguageMenu(false);
                                setShowMobileMenu(false);
                              }}
                              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-stone-200/70"
                            >
                              <span className="flex items-center gap-2">
                                <Image
                                  src={getFlagIconUrl(option.flag)}
                                  alt=""
                                  width={18}
                                  height={14}
                                  className="h-[14px] w-[18px] rounded-sm object-cover"
                                  unoptimized
                                />
                                <span style={{ color: "#9c64fb" }}>{option.label}</span>
                              </span>
                              <span style={{ color: isActive ? "#9dbf2f" : "#9c64fb", fontWeight: 700 }}>
                                {isActive ? "●" : ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        toggleTheme();
                        setShowMobileMenu(false);
                        setShowLanguageMenu(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-white/10 transition-colors"
                      style={{ color: "#9c64fb" }}
                      aria-label={themeHint}
                      title={themeHint}
                    >
                      <span>{themeHint}</span>
                      <span aria-hidden className="text-base">
                        {isDark ? "☀" : "☾"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAbout(true);
                        setShowMobileMenu(false);
                        setShowLanguageMenu(false);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-white/10 transition-colors"
                      style={{ color: "#9c64fb" }}
                    >
                      {t.header.about}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="hidden w-full items-center justify-end gap-1.5 sm:gap-2 min-[1139px]:w-auto min-[1139px]:flex">
            <button
              type="button"
              onClick={() => (isAuthed ? signOut() : signIn("discord"))}
              disabled={status === "loading"}
              className="rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-60 whitespace-nowrap"
              style={{ color: "#9c64fb" }}
            >
              {isAuthed
                ? `${t.header.disconnectDiscord} @${session?.user?.name ?? "Discord"}`
                : t.header.connectDiscord}
            </button>
            <div className="relative" ref={languageMenuRef}>
              <button
                type="button"
                onClick={() => setShowLanguageMenu((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-colors hover:bg-white/10"
                style={{ color: "#9c64fb" }}
                aria-label={t.header.languageMenuAria}
                aria-expanded={showLanguageMenu}
              >
                <Image
                  src={getFlagIconUrl(activeLanguage.flag)}
                  alt=""
                  width={18}
                  height={14}
                  className="h-[14px] w-[18px] rounded-sm object-cover"
                  unoptimized
                />
                <span>{activeLanguage.label}</span>
              </button>

              {showLanguageMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-stone-200 bg-stone-100/95 p-2 shadow-xl backdrop-blur-sm"
                  role="menu"
                  aria-label={t.header.selectLanguage}
                >
                  {LANGUAGE_OPTIONS.map((option) => {
                    const isActive = option.code === language;
                    return (
                      <button
                        key={option.code}
                        type="button"
                        onClick={() => {
                          setLanguage(option.code);
                          setShowLanguageMenu(false);
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-stone-200/70"
                        role="menuitem"
                      >
                        <span className="flex items-center gap-2">
                          <Image
                            src={getFlagIconUrl(option.flag)}
                            alt=""
                            width={18}
                            height={14}
                            className="h-[14px] w-[18px] rounded-sm object-cover"
                            unoptimized
                          />
                          <span style={{ color: "#9c64fb" }}>{option.label}</span>
                        </span>
                        <span
                          className="text-base leading-none"
                          style={{ color: isActive ? "#9dbf2f" : "#9c64fb", fontWeight: 700 }}
                        >
                          {isActive ? "●" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-[#9c64fb]/70 bg-[#9c64fb] text-sm sm:text-base leading-none shadow-md transition-transform hover:scale-105"
              style={{ color: isDark ? "#fde047" : "#ffffff" }}
              aria-label={themeHint}
              title={themeHint}
            >
              <span aria-hidden>{isDark ? "☀" : "☾"}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAbout(true)}
              className="rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium hover:bg-white/10 transition-colors whitespace-nowrap"
              style={{ color: "#9c64fb" }}
            >
              {t.header.about}
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
            <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-6">
              <div />
              <h2 className="text-xl font-semibold text-center" style={{ color: "#9c64fb" }}>
                {t.header.about}
              </h2>
              <button
                type="button"
                onClick={() => setShowAbout(false)}
                className="justify-self-end text-stone-500 hover:text-stone-800 text-2xl leading-none p-1"
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
                <p className="text-sm leading-relaxed text-center" style={{ color: "#9c64fb" }}>
                  {t.header.aboutCredit}{" "}
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
                <p className="text-sm leading-relaxed text-center" style={{ color: "#9c64fb" }}>
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
            <p className="mt-5 text-center text-sm leading-relaxed" style={{ color: "#9c64fb" }}>
              {t.header.bugReportPrefix}{" "}
              <a
                href="https://x.com/LevSouth"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#9c64fb] hover:underline"
              >
                {t.header.bugReportLink}
              </a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
