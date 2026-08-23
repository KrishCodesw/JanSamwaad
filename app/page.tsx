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

  let isOfficial = false;
  if (user?.sub) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.sub)
      .single();
    isOfficial = profile?.role === "official";
  }

  const defaultUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${defaultUrl}/#organization`,
        name: "JanSamvaad",
        url: defaultUrl,
        description: "Crowdsourced civic issue reporting and resolution platform.",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "contact@jansamvaad.vercel.app",
          telephone: "+91-00000-00000",
          url: `${defaultUrl}/contact`,
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Mumbai",
          addressRegion: "Maharashtra",
          addressCountry: "IN",
        },
      },
      {
        "@type": "WebApplication",
        name: "JanSamvaad",
        description: "Crowdsourced civic issue reporting and resolution platform",
        url: defaultUrl,
        applicationCategory: "CivicApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: ["Report civic issues", "Track issue resolution", "Interactive map view", "Community upvoting", "Real-time notifications"],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <main className="min-h-screen flex flex-col">
        <Navigation user={user} />
        <div className="flex-1 w-full flex flex-col gap-8 items-center">
          <div className="flex-1 flex flex-col gap-8 max-w-5xl p-5 w-full">
            <div className="text-center space-y-4">
              <h1 className="text-3xl md:text-4xl">Crowdsourced Civic Issue Reporting</h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">JanSamvaad helps citizens report local civic problems, discover nearby issues, and track progress as officials work toward resolution. Public issue information is available through the web experience and documented API so people and software agents can discover civic information consistently.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                {isOfficial && <Link href="/officialdashboard" className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors">Go to Official Dashboard</Link>}
                <Link href="/report" className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors">Report an Issue</Link>
                <Link href="/issues" className="border border-border px-6 py-3 rounded-md hover:bg-accent transition-colors">View All Issues</Link>
              </div>
            </div>

            <div className="w-full"><IssuesMap className="w-full" /></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center p-6 border border-border rounded-lg"><h3 className="font-semibold mt-2">NGO Partnerships</h3><p className="text-sm text-muted-foreground mt-1">Collaborating with NGOs with aligned vision to spread awareness about the platform and civic participation.</p></div>
              <div className="text-center p-6 border border-border rounded-lg"><h3 className="font-semibold mt-2">Official Response</h3><p className="text-sm text-muted-foreground mt-1">Track progress as local officials address reported issues and update their status.</p></div>
              <div className="text-center p-6 border border-border rounded-lg"><h3 className="font-semibold mt-2">Timely Updates</h3><p className="text-sm text-muted-foreground mt-1">Follow information about reported civic issues through the platform and its notification workflows.</p></div>
            </div>

            <section className="border-t pt-8 text-center space-y-3">
              <h2 className="text-2xl font-semibold">Developer & Agent Resources</h2>
              <p className="text-muted-foreground">Use the public API to discover civic issues, the OpenAPI specification for machine-readable integration details, and llms.txt for agent-specific guidance.</p>
              <div className="flex flex-wrap justify-center gap-4"><Link className="underline" href="/docs">API Docs</Link><Link className="underline" href="/openapi.json">OpenAPI</Link><Link className="underline" href="/llms.txt">llms.txt</Link><Link className="underline" href="/sitemap.xml">Sitemap</Link></div>
            </section>
          </div>
        </div>
        <WhatIsJanSamvaad className="mt-8" />
        <Footer />
      </main>
    </>
  );
}
