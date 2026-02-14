import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isLanguage, translations, type Language } from "@/lib/i18n";

const DEFAULT_SHARE_IMAGE =
  "/images/" + encodeURIComponent("ChatGPT Image 13 февр. 2026 г., 15_47_29.png");

type SharePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) return value[0].trim();
  return null;
}

function getLanguage(rawLanguage: string | null): Language {
  if (rawLanguage && isLanguage(rawLanguage)) return rawLanguage;
  return "en";
}

function getShareImage(rawImage: string | null): string {
  if (!rawImage) return DEFAULT_SHARE_IMAGE;
  if (rawImage.startsWith("/")) return rawImage;
  if (rawImage.startsWith("http://") || rawImage.startsWith("https://")) return rawImage;
  return DEFAULT_SHARE_IMAGE;
}

export async function generateMetadata({ searchParams }: SharePageProps): Promise<Metadata> {
  const params = await searchParams;
  const language = getLanguage(getParam(params.lang));
  const t = translations[language];
  const image = getShareImage(getParam(params.image));

  return {
    title: t.shareTitle,
    description: t.shareDescription,
    openGraph: {
      title: t.shareTitle,
      description: t.shareDescription,
      type: "website",
      url: "/",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: t.shareTitle,
      description: t.shareDescription,
      images: [image],
    },
  };
}

export default function SharePage() {
  redirect("/");
}
