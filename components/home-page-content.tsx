// components/home-page-content.tsx
"use client";

import IssuesMap from "@/components/issues-map";
import Link from "next/link";
import { Footer } from "@/components/footer";

export function HomePageContent() {
  return (
    <main className="min-h-screen flex flex-col">
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
          {/* Quick Stats or Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center p-6 border border-border rounded-lg">
              <div className="text-2xl font-bold text-primary">📍</div>
              <h3 className="font-semibold mt-2">Location-Based</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Report and view issues based on your location
              </p>
            </div>
            <div className="text-center p-6 border border-border rounded-lg">
              <div className="text-2xl font-bold text-primary">🏛️</div>
              <h3 className="font-semibold mt-2">Official Response</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Track progress as local officials address issues
              </p>
            </div>
            <div className="text-center p-6 border border-border rounded-lg">
              <div className="text-2xl font-bold text-primary">👥</div>
              <h3 className="font-semibold mt-2">Community Driven</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Vote on issues to help prioritize community needs
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
