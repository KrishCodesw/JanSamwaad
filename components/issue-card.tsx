"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ThumbsUp,
  MapPin,
  Clock,
  Flag,
  Eye,
  User,
  X, // Added X icon for the close button
} from "lucide-react";

type StatusChange = {
  from_status: string | null;
  to_status: string;
  changed_at: string;
  notes: string | null;
  changed_by: string | null;
  profiles: { display_name: string } | null;
};

type Issue = {
  id: number;
  status: string;
  description: string;
  tags?: string[];
  images?: { url: string }[];
  flagged?: boolean;
  created_at: string;
  latitude?: number;
  longitude?: number;
  vote_count?: number;
  status_changes?: StatusChange[];
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400",
  under_progress:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400",
  under_review: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400",
  closed: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
};

const CATEGORY_COLORS: Record<string, string> = {
  pothole: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400",
  streetlight:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400",
  sanitation:
    "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
  water: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400",
  traffic:
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400",
  park: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400",
};

export function IssueCard({
  issue,
  onUpvote,
  showDistance,
}: {
  issue: Issue;
  onUpvote?: (id: number) => Promise<void>;
  showDistance?: number;
}) {
  const getLatestStatusChange = (issue: Issue): StatusChange | null => {
    if (!issue.status_changes || issue.status_changes.length === 0) return null;
    return issue.status_changes.sort(
      (a, b) =>
        new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    )[0];
  };

  const latestStatusChange = getLatestStatusChange(issue);
  const [upvoting, setUpvoting] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [showImage, setShowImage] = useState(false); // Changed from isImageVisible
  const [voteCount, setVoteCount] = useState(issue.vote_count || 0);

  const handleUpvote = async () => {
    if (!onUpvote || hasUpvoted || upvoting) return;

    setUpvoting(true);
    try {
      await onUpvote(issue.id);
      setHasUpvoted(true);
      setVoteCount((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to upvote:", error);
    } finally {
      setUpvoting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card
      // Added 'relative' and 'overflow-hidden' for the overlay to work
      className={`relative overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02] dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-700 h-full flex flex-col ${
        issue.flagged
          ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950"
          : ""
      }`}
    >
      <div className="flex flex-col h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            {/* Left side: ID, Flag, Badges */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-muted-foreground dark:text-gray-400">
                  #{issue.id}
                </span>
                {issue.flagged && (
                  <Flag className="h-4 w-4 text-red-500 dark:text-red-400" />
                )}
                {showDistance && (
                  <span className="text-xs text-muted-foreground dark:text-gray-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {showDistance.toFixed(1)}km away
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={
                    STATUS_COLORS[issue.status] ||
                    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400"
                  }
                >
                  {issue.status.replace("_", " ")}
                </Badge>
                {issue.tags?.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={`border-gray-200 dark:border-gray-700 ${
                      CATEGORY_COLORS[tag] ||
                      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400"
                    }`}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Right side: Actions (Vote + Eye) */}
            <div className="flex items-center gap-2">
              {issue.images && issue.images.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowImage(true)}
                  className="h-8 w-8 p-0 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}

              {onUpvote && (
                <Button
                  size="sm"
                  variant={hasUpvoted ? "default" : "outline"}
                  onClick={handleUpvote}
                  disabled={upvoting || hasUpvoted}
                  className="flex items-center gap-1 h-8 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800 dark:bg-gray-900"
                >
                  <ThumbsUp
                    className={`h-3 w-3 ${hasUpvoted ? "fill-current" : ""}`}
                  />
                  {voteCount > 0 && (
                    <span className="text-xs">{voteCount}</span>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 flex-grow">
          <p className="text-sm leading-relaxed dark:text-gray-300">
            {issue.description}
          </p>

          {/* Latest status change */}
          {latestStatusChange && (
            <div className="bg-muted/50 dark:bg-gray-800 p-2 rounded-md text-xs dark:text-gray-400 mt-auto">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span>
                  <span className="font-medium">
                    {latestStatusChange.profiles?.display_name || "Official"}
                  </span>{" "}
                  updated status to{" "}
                  <span className="font-medium">
                    {latestStatusChange.to_status.replace("_", " ")}
                  </span>
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-gray-400 pt-2 border-t dark:border-gray-700">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(issue.created_at)}
            </div>
          </div>
        </CardContent>
      </div>

      {/* --- NEW OVERLAY REVEAL SECTION --- */}
      {issue.images && issue.images.length > 0 && (
        <div
          // This div covers the entire card
          className={`absolute inset-0 z-20 bg-background/95 backdrop-blur-sm transition-transform duration-300 ease-in-out ${
            showImage ? "translate-y-0" : "translate-y-full"
          }`}
          onClick={() => setShowImage(false)} // Close when clicking anywhere on overlay
        >
          {/* Close Button */}
          <div className="absolute top-3 right-3 z-30">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full shadow-md bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/80"
              onClick={(e) => {
                e.stopPropagation(); // Prevent double triggering
                setShowImage(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* The Image */}
          <div className="relative w-full h-full cursor-pointer">
            <Image
              src={issue.images[0].url}
              alt="Issue evidence"
              fill
              className="object-cover"
              priority // Load faster since user asked for it
            />
            {/* Optional Gradient for text readability if you add text later */}
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          </div>
        </div>
      )}
    </Card>
  );
}
