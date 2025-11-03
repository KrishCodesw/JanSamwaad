import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import dynamic from "next/dynamic";
import MapSkeleton from "@/components/map-skeleton";
const IssuesMap = dynamic(() => import("@/components/issues-map"), {

  loading: () => <MapSkeleton className="w-full" />,
});
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import WhatIsJanSamvaad from "@/components/what-is-jansamvaad";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  
  const defaultUrl = process.env.NEXT_PUBLIC_SITE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "JanSamvaad",
    "description": "Crowdsourced civic issue reporting and resolution platform",
    "url": defaultUrl,
    "applicationCategory": "CivicApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Report civic issues",
      "Track issue resolution",
      "Interactive map view",
      "Community upvoting",
      "Real-time notifications"
    ]
  };
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen flex flex-col">
      <Navigation user={user} />
      <div className="flex-1 w-full flex flex-col gap-8 items-center">
        <div className="flex-1 flex flex-col gap-8 max-w-5xl p-5 w-full">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">
              Crowdsourced Civic Issue Reporting
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Report issues, see what&apos;s nearby, and track progress as
              officials resolve them.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/report"
                className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
              >
                Report an Issue
              </Link>
              <Link
                href="/issues"
                className="border border-border px-6 py-3 rounded-md hover:bg-accent transition-colors"
              >
                View All Issues
              </Link>
            </div>
          </div>

          {/* Map Section */}
          <div className="w-full">
            <IssuesMap className="w-full" />
          </div>

          {/* Quick Stats or Features (original minimal style, no emojis) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center p-6 border border-border rounded-lg">
              <div className="text-2xl font-bold text-primary"></div>
              <h3 className="font-semibold mt-2">NGO-Partnerships</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Collaborating with NGO's with aligned vision to spread awareness
                about the platform.
              </p>
            </div>
            <div className="text-center p-6 border border-border rounded-lg">
              <div className="text-2xl font-bold text-primary"></div>
              <h3 className="font-semibold mt-2">Official Response</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Track progress as local officials address issues and verify them
                as soon as their resolved.
              </p>
            </div>
            <div className="text-center p-6 border border-border rounded-lg">
              <div className="text-2xl font-bold text-primary"></div>
              <h3 className="font-semibold mt-2">Timely informed updates</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time Updates: Constant flow of information via email and
                SMS
              </p>
            </div>
          </div>
        </div>
      </div>
      <WhatIsJanSamvaad className="mt-8" />
      <Footer />
    </main>
    </>
  );
}
