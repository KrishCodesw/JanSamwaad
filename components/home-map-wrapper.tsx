"use client";

import dynamic from "next/dynamic";
import MapSkeleton from "@/components/map-skeleton";

const IssuesMap = dynamic(() => import("@/components/MapIssues"), {
  loading: () => <MapSkeleton className="w-full h-[500px] rounded-lg" />,
  ssr: false,
});

export default function HomeMapWrapper({ className }: { className?: string }) {
  return <IssuesMap className={className} />;
}
