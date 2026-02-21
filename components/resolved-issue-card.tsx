"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Eye } from "lucide-react";

export function ResolvedIssueCard({ issue }: { issue: any }) {
  // Hidden by default
  const [showImage, setShowImage] = useState(false);

  // Extracting image URLs safely based on the updated Supabase query
  const beforeImage = issue.images?.[0]?.url || "/placeholder.svg";
  const afterImage = issue.proof_of_work?.[0]?.image_url || "/placeholder.svg";

  // Format the date if it exists
  const reportedDate = issue.created_at
    ? new Date(issue.created_at).toLocaleDateString()
    : "Unknown Date";

  return (
    <Card
      // CHANGED: Using 'h-fit' prevents this card from stretching to match neighboring cards in the grid
      className="border-primary/20 bg-background flex flex-col hover:shadow-lg transition-all duration-200 h-fit"
    >
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

          {/* The Eye Icon Button - Toggles the image view */}
          <button
            onClick={() => setShowImage(!showImage)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            title={showImage ? "Hide Images" : "View Proof Images"}
          >
            <Eye className={`h-5 w-5 ${showImage ? "text-primary" : ""}`} />
          </button>
        </CardHeader>

        <CardContent className="flex-grow flex flex-col gap-4">
          {/* Date and Location Info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Reported: {reportedDate}
            </div>
          </div>

          {/* --- EXPANDABLE IMAGE SECTION --- */}
          {showImage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-start animate-in fade-in-50 duration-300">
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-muted-foreground">
                  Reported Issue
                </span>
                <div className="relative h-64 w-full rounded-md border bg-muted overflow-hidden">
                  <img
                    src={beforeImage}
                    alt="Before issue resolution"
                    className="object-contain w-full h-full bg-black/5"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-medium text-green-600 dark:text-green-500">
                  Resolution Proof
                </span>
                <div className="relative h-64 w-full rounded-md border-2 border-green-500/20 bg-muted overflow-hidden">
                  <img
                    src={afterImage}
                    alt="After issue resolution"
                    className="object-contain w-full h-full bg-black/5"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
