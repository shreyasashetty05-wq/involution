import type { NextConfig } from "next";

const nextConfig: any = {
  reactCompiler: false,

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
      {
        protocol: "https",
        hostname: "img.youtube.com", // YouTube thumbnails
      },
      {
        protocol: "https",
        hostname: "ktnoogfclgvwzmscefjc.supabase.co", // Supabase Storage
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com", // Fallback avatars
      },
      {
        protocol: "https",
        hostname: "logo.clearbit.com", // Startup logos fallback
      }
    ],
  },
};

export default nextConfig;
