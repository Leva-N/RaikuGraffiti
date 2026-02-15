import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.discordapp.net",
        pathname: "/**",
      },
    ],
  },
  // Избегаем бандлинга @vercel/blob в Webpack — пакет может вызывать
  // "__webpack_modules__[moduleId] is not a function" в рантайме
  serverExternalPackages: ["@vercel/blob"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
