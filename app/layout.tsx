import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";
import { translations } from "@/lib/i18n";

const SITE_BG =
  "/images/" + encodeURIComponent("ChatGPT Image 13 февр. 2026 г., 15_47_29.png");
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://raiku-graffiti.vercel.app";
const normalizedSiteUrl = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(normalizedSiteUrl),
  title: translations.en.shareTitle,
  description: translations.en.shareDescription,
  openGraph: {
    title: translations.en.shareTitle,
    description: translations.en.shareDescription,
    type: "website",
    url: "/",
    images: [SITE_BG],
  },
  twitter: {
    card: "summary_large_image",
    title: translations.en.shareTitle,
    description: translations.en.shareDescription,
    images: [SITE_BG],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <Providers>
          <div
            className="min-h-screen bg-no-repeat bg-center"
            style={{
              backgroundImage: `url('${SITE_BG}')`,
              backgroundSize: "cover",
              backgroundAttachment: "scroll",
            }}
          >
            <SiteHeader />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
