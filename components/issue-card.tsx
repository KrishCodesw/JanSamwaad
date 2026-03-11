"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ThumbsUp,
  MapPin,
  Clock,
  Flag,
  Eye,
  User,
  Loader2,
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
  reporter_email?: string;
  reporter_id?: string;
  proof_of_work?: { image_url: string; notes: string | null }[];
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
  currentUserEmail,
  currentUserId,
  initialHasUpvoted = false,
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
  const [showImageModal, setShowImageModal] = useState(false);
  const [voteCount, setVoteCount] = useState(issue.vote_count || 0);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const [fetchedImages, setFetchedImages] = useState<{ url: string }[] | null>(
    null,
  );
  const [loadingImages, setLoadingImages] = useState(false);

  const isReporter = !!(
    (currentUserEmail &&
      issue.reporter_email &&
      currentUserEmail.toLowerCase() === issue.reporter_email.toLowerCase()) ||
    (currentUserId && issue.reporter_id && currentUserId === issue.reporter_id)
  );

  const canVerify = isReporter || hasUpvoted;

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
    setShowImageModal(true);
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
                  {showDistance !== undefined && (
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
      </Card>

      {/* --- PROPER BEFORE & AFTER MODAL --- */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-5xl h-[85vh] md:h-[75vh] flex flex-col p-0 overflow-hidden bg-black/95 border-gray-800 shadow-2xl">
          <DialogHeader className="p-4 pb-0 z-10 bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full">
            <DialogTitle className="text-white drop-shadow-md flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Issue Evidence
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 w-full h-full flex flex-col md:flex-row p-4 pt-16 gap-4 overflow-y-auto">
            {loadingImages ? (
              <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground gap-2">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Loading evidence...</p>
              </div>
            ) : (
              <>
                {/* LEFT SIDE: BEFORE (Original Report) */}
                {fetchedImages && fetchedImages.length > 0 && (
                  <div className="relative w-full min-h-[40vh] md:h-full flex-1 border border-white/10 rounded-xl overflow-hidden bg-black/50">
                    <Badge className="absolute top-3 left-3 z-10 bg-black/80 text-white border-white/20 backdrop-blur-md">
                      Before (Reported)
                    </Badge>
                    <Image
                      src={fetchedImages[0].url}
                      alt="Original Issue evidence"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                )}

                {/* RIGHT SIDE: AFTER (Official Proof of Work) */}
                {issue.proof_of_work && issue.proof_of_work.length > 0 && (
                  <div className="relative w-full min-h-[40vh] md:h-full flex-1 border-2 border-green-500/50 rounded-xl overflow-hidden bg-black/50 shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)]">
                    <Badge className="absolute top-3 left-3 z-10 bg-green-600 text-white border-green-400 shadow-lg">
                      After (Repaired)
                    </Badge>
                    <Image
                      src={issue.proof_of_work[0].image_url}
                      alt="Official Repair Proof"
                      fill
                      className="object-contain"
                      priority
                    />
                    {issue.proof_of_work[0].notes && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pt-16">
                        <p className="text-sm text-white">
                          <span className="font-bold text-green-400">
                            Official Notes:{" "}
                          </span>
                          {issue.proof_of_work[0].notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Fallback if nothing loads */}
                {fetchedImages !== null &&
                  fetchedImages.length === 0 &&
                  (!issue.proof_of_work ||
                    issue.proof_of_work.length === 0) && (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-muted-foreground text-sm font-medium">
                        No images available for this issue.
                      </p>
                    </div>
                  )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* ----------------------------------- */}

      <CitizenVerificationModal
        issueId={issue.id}
        issueLat={issue.latitude || 0}
        issueLng={issue.longitude || 0}
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
}
