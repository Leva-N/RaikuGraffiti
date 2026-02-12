import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wall of Photos",
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
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
