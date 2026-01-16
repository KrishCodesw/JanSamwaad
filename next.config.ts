import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "imagedelivery.net" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },

  // Optimize for production
  compress: true,
  poweredByHeader: false,
  trailingSlash: false,

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Content-Security-Policy",
            // 👇 UPDATED CSP POLICY
            value:
              "default-src 'self'; " +
              // Added 'blob:' to script-src (fallback)
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; " +
              "style-src 'self' 'unsafe-inline'; " +
              // Added 'blob:' and CartoCDN to img-src
              "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://cdnjs.cloudflare.com https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com; " +
              "font-src 'self' data:; " +
              // Added explicit worker-src for map workers
              "worker-src 'self' blob:; " +
              "style-src 'self' 'unsafe-inline' https://unpkg.com; " +
              // Added CartoCDN to connect-src (CRITICAL for map tiles)
              "connect-src 'self' https://*.supabase.co https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com;",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;