"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{t.notFound.title}</h1>
      <p className="opacity-80">{t.notFound.text}</p>
      <Link
        href="/"
        className="rounded-md bg-[var(--wall-brick)] px-4 py-2 text-white hover:opacity-90"
      >
        {t.notFound.home}
      </Link>
    </main>
  );
}
