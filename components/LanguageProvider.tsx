"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isLanguage, LANGUAGE_STORAGE_KEY, type Language, translations } from "@/lib/i18n";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
  children: React.ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>("en");

  const applyDocumentLocale = (nextLanguage: Language) => {
    document.documentElement.lang = nextLanguage;
    document.documentElement.dir = nextLanguage === "ar" ? "rtl" : "ltr";
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && isLanguage(saved)) {
      setLanguageState(saved);
      applyDocumentLocale(saved);
    } else {
      applyDocumentLocale("en");
    }
  }, []);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      applyDocumentLocale(nextLanguage);
    }
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  const t = translations[context.language];
  return { ...context, t };
}
