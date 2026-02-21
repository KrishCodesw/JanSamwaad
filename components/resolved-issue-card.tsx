"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Eye, X } from "lucide-react";

export function ResolvedIssueCard({ issue }: { issue: any }) {
  // 1. Add state to track if the overlay is open
  const [showImage, setShowImage] = useState(false);

  // Extracting image URLs safely based on the updated Supabase query
  const beforeImage = issue.images?.[0]?.url || "/placeholder.svg";
  const afterImage = issue.proof_of_work?.[0]?.image_url || "/placeholder.svg";

  // Format the date if it exists
  const reportedDate = issue.created_at
    ? new Date(issue.created_at).toLocaleDateString()
    : "Unknown Date";

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-background flex flex-col h-full hover:shadow-lg transition-all duration-200">
      <div className="flex flex-col h-full">
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

          {/* 2. Wire up the Eye Icon Button to open the overlay */}
          <button
            onClick={() => setShowImage(true)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            title="View Images"
          >
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
              <div
                className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted cursor-pointer"
                onClick={() => setShowImage(true)} // Optional: Also let clicking the small image open it
              >
                <img
                  src={beforeImage}
                  alt="Before issue resolution"
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-green-600 dark:text-green-500 uppercase tracking-wider">
                Resolution Proof
              </span>
              <div
                className="relative aspect-video w-full overflow-hidden rounded-md border-2 border-green-500/20 bg-muted cursor-pointer"
                onClick={() => setShowImage(true)} // Optional: Also let clicking the small image open it
              >
                <img
                  src={afterImage}
                  alt="After issue resolution"
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      {/* 3. The sliding overlay section that reveals when showImage is true */}
      <div
        className={`absolute inset-0 z-30 bg-background/95 backdrop-blur-sm transition-transform duration-300 ease-in-out p-4 flex flex-col ${
          showImage ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={() => setShowImage(false)} // Clicking anywhere on the background closes it
      >
        {/* Close Button */}
        <div className="absolute top-3 right-3 z-40">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full shadow-md bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/80"
            onClick={(e) => {
              e.stopPropagation(); // Prevents the background click from firing twice
              setShowImage(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* The Images Container (Split 50/50 vertically) */}
        <div className="w-full h-full flex flex-col gap-3 mt-6">
          <div className="relative flex-1 rounded-md overflow-hidden border bg-muted">
            <div className="absolute top-2 left-2 z-10 bg-black/60 text-white px-2 py-1 text-xs rounded backdrop-blur-sm">
              Reported Issue
            </div>
            <img
              src={beforeImage}
              alt="Before issue resolution"
              className="object-cover w-full h-full"
            />
          </div>

          <div className="relative flex-1 rounded-md overflow-hidden border-2 border-green-500/50 bg-muted">
            <div className="absolute top-2 left-2 z-10 bg-green-600/90 text-white px-2 py-1 text-xs rounded backdrop-blur-sm shadow-sm">
              Resolution Proof
            </div>
            <img
              src={afterImage}
              alt="After issue resolution"
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
