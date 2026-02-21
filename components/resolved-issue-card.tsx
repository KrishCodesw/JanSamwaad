"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Eye } from "lucide-react";
import Image from "next/image";

export function ResolvedIssueCard({ issue }: { issue: any }) {
  // Extracting image URLs safely based on the updated Supabase query
  const beforeImage = issue.images?.[0]?.url || "/placeholder.svg";

  // Look into the joined proof_of_work table for the after image
  const afterImage = issue.proof_of_work?.[0]?.image_url || "/placeholder.svg";

  // Format the date if it exists
  const reportedDate = issue.created_at
    ? new Date(issue.created_at).toLocaleDateString()
    : "Unknown Date";

  return (
    <Card className="border-primary/20 bg-background overflow-hidden flex flex-col h-full">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">#{issue.id}</span>
            <Badge
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              {issue.status}
            </Badge>
            {issue.category && (
              <Badge
                variant="outline"
                className="text-green-500 border-green-500/30"
              >
                {issue.category}
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-lg line-clamp-2">
            {issue.title || issue.description}
          </h3>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Eye className="h-5 w-5" />
        </button>
      </CardHeader>

      <CardContent className="flex-grow flex flex-col gap-4">
        {/* Date and Location Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground border-b border-border/50 pb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Reported: {reportedDate}
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span className="underline decoration-muted-foreground/50 underline-offset-2">
              {issue.location_code || "Location"}
            </span>
          </div>
        </div>

        {/* Before and After Image Grid */}
        <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Reported Issue
            </span>
            <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
              <img
                src={beforeImage}
                alt="Before issue resolution"
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-green-600 dark:text-green-500 uppercase tracking-wider">
              Resolution Proof
            </span>
            <div className="relative aspect-video w-full overflow-hidden rounded-md border-2 border-green-500/20 bg-muted">
              <img
                src={afterImage}
                alt="After issue resolution"
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
