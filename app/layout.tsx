import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const SITE_BG =
  "/images/" + encodeURIComponent("ChatGPT Image 13 февр. 2026 г., 15_47_29.png");

export const metadata: Metadata = {
  title: "Raiku Graffiti",
  description: "Кирпичная стена с фотографиями — загрузите фото и займите кирпич.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased min-h-screen">
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
      </body>
    </html>
  );
}
