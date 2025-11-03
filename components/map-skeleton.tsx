"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

type MapSkeletonProps = {
  className?: string;
};

export default function MapSkeleton({ className }: MapSkeletonProps) {
  return (
    <Card className={className} aria-busy="true" role="status">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle>Issues Near You</CardTitle>
            <div className="h-6 w-12 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-48 md:h-64 w-full bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}


