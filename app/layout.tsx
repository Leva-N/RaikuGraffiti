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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var key='raiku_theme';var saved=localStorage.getItem(key);var theme=saved==='dark'?'dark':'light';document.documentElement.setAttribute('data-theme',theme);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();",
          }}
        />
      </head>
      <body className="antialiased min-h-screen">
        <Providers>
          <div className="site-shell min-h-screen bg-no-repeat bg-center">
            <SiteHeader />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
