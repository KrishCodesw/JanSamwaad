import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
 images: {
  remotePatterns: [
    { protocol: "https", hostname: "res.cloudinary.com" },
    { protocol: "https", hostname: "imagedelivery.net" },
    { protocol: "https", hostname: "*.supabase.co" },
    { protocol: "https", hostname: "i.postimg.cc" }
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
           value:
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdnjs.cloudflare.com; " +
  "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://server.arcgisonline.com https://cdnjs.cloudflare.com https://rmiyogmikonumdhrpnyf.supabase.co https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com https://i.postimg.cc; " +
  "font-src 'self' data: https://cdnjs.cloudflare.com; " +
  "worker-src 'self' blob:; " +
  "connect-src 'self' https://*.supabase.co https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com;"
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