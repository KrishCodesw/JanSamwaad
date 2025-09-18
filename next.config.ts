import type { NextConfig } from "next";

const nextConfig: NextConfig = {





  
   eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      // Cloudinary
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Cloudflare Images delivery domain pattern (customize as needed)
      { protocol: "https", hostname: "imagedelivery.net" },
      // Add your image hosting domains here
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  // Enable static optimization
  trailingSlash: false,
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
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
