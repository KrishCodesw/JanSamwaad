import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.NEXT_PUBLIC_SITE_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "JanSamvaad - Crowdsourced Civic Issue Reporting & Resolution Platform",
  description: "JanSamvaad is a crowdsourced civic issue reporting and resolution platform. Report local issues, track progress, and collaborate with officials to improve your community. Join thousands of citizens making a difference.",
  keywords: ["civic issues", "community reporting", "local government", "public issues", "citizen engagement", "issue tracking", "civic engagement", "community improvement"],
  authors: [{ name: "JanSamvaad" }],
  creator: "JanSamvaad",
  publisher: "JanSamvaad",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "JanSamvaad - Crowdsourced Civic Issue Reporting & Resolution",
    description: "Report local civic issues, track progress, and collaborate with officials to improve your community. Join thousands of citizens making a difference.",
    url: defaultUrl,
    siteName: "JanSamvaad",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "JanSamvaad - Civic Issue Reporting Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JanSamvaad - Crowdsourced Civic Issue Reporting",
    description: "Report local civic issues, track progress, and improve your community.",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: defaultUrl,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
