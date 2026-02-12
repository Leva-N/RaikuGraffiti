import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
  // Избегаем бандлинга @vercel/blob в Webpack — пакет может вызывать
  // "__webpack_modules__[moduleId] is not a function" в рантайме
  serverExternalPackages: ["@vercel/blob"],
};

export default nextConfig;
