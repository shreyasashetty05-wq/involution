import type { NextConfig } from "next";

const nextConfig: any = {
  reactCompiler: false,

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Fix: Set turbopack root to silence the multiple-lockfile workspace warning
  turbopack: {
    root: __dirname,
  },

  // Allow images from external domains used in the app (Unsplash thumbnails, etc.)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google OAuth profile pictures
      },
    ],
  },
};

export default nextConfig;
