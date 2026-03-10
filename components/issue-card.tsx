"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  X,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

import { CitizenVerificationModal } from "./citizen-verification-modal";

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
  // --- NEW: Added so we can check ownership ---
  reporter_email?: string;
  reporter_id?: string;
};

// ... (STATUS_COLORS and CATEGORY_COLORS remain exactly the same) ...
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
  currentUserEmail, // --- NEW PROP: Pass this from the parent list ---
  currentUserId, // --- NEW PROP: Pass this from the parent list ---
  initialHasUpvoted = false, // --- NEW PROP: So we know if they upvoted before this session
}: {
  issue: Issue;
  onUpvote?: (id: number) => Promise<void>;
  showDistance?: number;
  currentUserEmail?: string | null;
  currentUserId?: string | null;
  initialHasUpvoted?: boolean;
}) {
  const getLatestStatusChange = (issue: Issue): StatusChange | null => {
    if (!issue.status_changes || issue.status_changes.length === 0) return null;
    return issue.status_changes.sort(
      (a, b) =>
        new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime(),
    )[0];
  };

  const latestStatusChange = getLatestStatusChange(issue);
  const [upvoting, setUpvoting] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted);
  const [showImage, setShowImage] = useState(false);
  const [voteCount, setVoteCount] = useState(issue.vote_count || 0);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false); // <-- NEW

  const [fetchedImages, setFetchedImages] = useState<{ url: string }[] | null>(
    null,
  );
  const [loadingImages, setLoadingImages] = useState(false);

  // --- NEW: THE VISIBILITY LOGIC ---
  // Is this user the original reporter?
  const isReporter = !!(
    (currentUserEmail &&
      issue.reporter_email &&
      currentUserEmail.toLowerCase() === issue.reporter_email.toLowerCase()) ||
    (currentUserId && issue.reporter_id && currentUserId === issue.reporter_id)
  );
  // Do they have the right to verify?
  const canVerify = isReporter || hasUpvoted;
  // ---------------------------------

  useEffect(() => {
    setHasUpvoted(initialHasUpvoted);
  }, [initialHasUpvoted]);

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

  const handleViewImages = async () => {
    setShowImage(true);
    if (fetchedImages === null) {
      setLoadingImages(true);
      try {
        const res = await fetch(`/api/issues/${issue.id}/images`);
        const data = await res.json();
        setFetchedImages(data);
      } catch (error) {
        console.error("Failed to fetch images", error);
        setFetchedImages([]);
      } finally {
        setLoadingImages(false);
      }
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <Card
        className={`relative overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02] dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-700 h-full flex flex-col ${
          issue.flagged
            ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950"
            : ""
        }`}
      >
        <div className="flex flex-col h-full">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
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
                      STATUS_COLORS[issue.status] || "bg-gray-100 text-gray-800"
                    }
                  >
                    {issue.status.replace("_", " ")}
                  </Badge>
                  {issue.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={
                        CATEGORY_COLORS[tag] || "bg-gray-100 text-gray-800"
                      }
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleViewImages}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>

                {onUpvote && (
                  <Button
                    size="sm"
                    variant={hasUpvoted ? "default" : "outline"}
                    onClick={handleUpvote}
                    disabled={upvoting || hasUpvoted}
                    className="flex items-center gap-1 h-8"
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

          <CardContent className="space-y-3 flex-grow flex flex-col">
            <p className="text-sm leading-relaxed dark:text-gray-300">
              {issue.description}
            </p>

            {/* --- NEW UI: Sleek Verification Banner --- */}
            {issue.status === "closed" && canVerify && (
              <div className="mt-4 p-3 bg-red-50/50 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30 rounded-lg flex flex-col gap-3 w-full">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span className="font-medium text-red-800 dark:text-red-300">
                    Issue still not fixed?
                  </span>
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVerifyModalOpen(true);
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Needs More Work
                </Button>
              </div>
            )}
            {/* ----------------------------------------- */}
            <div className="mt-auto pt-4 space-y-2">
              {latestStatusChange && (
                <div className="bg-muted/50 dark:bg-gray-800 p-2 rounded-md text-xs dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span>
                      <span className="font-medium">
                        {latestStatusChange.profiles?.display_name ||
                          "Official"}
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
            </div>
          </CardContent>
        </div>

        {/* --- Overlay Section (Unchanged) --- */}
        <div
          className={`absolute inset-0 z-20 bg-background/95 backdrop-blur-sm transition-transform duration-300 ease-in-out ${
            showImage ? "translate-y-0" : "translate-y-full"
          }`}
          onClick={() => setShowImage(false)}
        >
          <div className="absolute top-3 right-3 z-30">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full shadow-md bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/80"
              onClick={(e) => {
                e.stopPropagation();
                setShowImage(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
            {loadingImages ? (
              <div className="flex flex-col items-center text-muted-foreground gap-2">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Loading image...</p>
              </div>
            ) : fetchedImages && fetchedImages.length > 0 ? (
              <>
                <Image
                  src={fetchedImages[0].url}
                  alt="Issue evidence"
                  fill
                  className="object-contain"
                  priority
                />
              </>
            ) : (
              fetchedImages !== null && (
                <p className="text-muted-foreground text-sm font-medium">
                  No images provided for this issue.
                </p>
              )
            )}
          </div>
        </div>
      </Card>
      <CitizenVerificationModal
        issueId={issue.id}
        issueLat={issue.latitude || 0} // <-- ADD THIS
        issueLng={issue.longitude || 0} // <-- ADD THIS
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
}
