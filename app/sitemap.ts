import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const lastModified = new Date();

  return [
    { url: baseUrl, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/issues`, lastModified, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/report`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/docs`, lastModified, changeFrequency: "monthly", priority: 0.6 },
  ];
}
