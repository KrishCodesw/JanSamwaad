"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  MapPin,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { CitizenVerificationModal } from "./citizen-verification-modal"; // Adjust path if needed

type StatusChange = {
  from_status: string | null;
  to_status: string;
  changed_at: string;
  notes: string | null;
  profiles: { display_name: string } | null;
};

type Issue = {
  id: number;
  status: string;
  description: string;
  tags?: string[];
  flagged?: boolean;
  created_at: string;
  updated_at?: string; // <-- ADDED
  latitude: number;
  longitude: number;
  vote_count?: number | { count: number };
  images?: { url: string }[];
  status_changes?: StatusChange[];
  proof_of_work?: { image_url: string; notes: string | null }[]; // <-- ADDED
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400";
    case "under_progress":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400";
    case "under_review":
      return "bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-200";
    case "closed":
      return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400";
    case "resolved_verified":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <AlertTriangle className="h-4 w-4" />;
    case "under_progress":
      return <Clock className="h-4 w-4" />;
    case "under_review":
      return <Eye className="h-4 w-4" />;
    case "closed":
    case "resolved_verified":
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <AlertTriangle className="h-4 w-4" />;
  }
};

const formatStatus = (status: string) =>
  status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export function MyIssueCard({ issue }: { issue: Issue }) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [fetchedImages, setFetchedImages] = useState<{ url: string }[] | null>(
    null,
  );
  const [loadingImages, setLoadingImages] = useState(false);

  // --- 7 DAY MATH LOGIC ---
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const lastUpdated = new Date(issue.updated_at || issue.created_at).getTime();
  const isExpired = Date.now() - lastUpdated > SEVEN_DAYS_MS;

  // Since this is the "My Issues" tab, the user IS the reporter inherently.
  const canVerify = issue.status === "closed" && !isExpired;

  const getLatestStatusChange = (issue: Issue) => {
    if (!issue.status_changes || issue.status_changes.length === 0) return null;
    return issue.status_changes.sort(
      (a, b) =>
        new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime(),
    )[0];
  };

  const latestChange = getLatestStatusChange(issue);
  const voteCount =
    typeof issue.vote_count === "object"
      ? issue.vote_count?.count
      : issue.vote_count;

  // Dynamically fetch images when opening modal (saves bandwidth)
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

  return (
    <>
      <Card
        className={`transition-colors dark:bg-gray-900 dark:border-gray-800 ${
          issue.flagged
            ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950"
            : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base dark:text-white">
                  #{issue.id}
                </CardTitle>
                {issue.flagged && (
                  <Badge variant="destructive" className="text-xs">
                    Urgent
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={getStatusColor(issue.status)}>
                  {getStatusIcon(issue.status)}
                </span>
                <Badge
                  className={`text-xs ${getStatusColor(issue.status)}`}
                  variant="secondary"
                >
                  {formatStatus(issue.status)}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleViewImages}
                className="h-8 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" /> View Evidence
              </Button>
              <div className="text-right text-xs text-muted-foreground mt-1">
                <div className="flex items-center gap-1 justify-end">
                  <Calendar className="h-3 w-3" />
                  {new Date(issue.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm dark:text-gray-300">{issue.description}</p>

          {/* Tags */}
          {issue.tags && issue.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {issue.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* --- CITIZEN APPEAL BANNER --- */}
          {issue.status === "closed" && canVerify && (
            <div className="mt-4 p-3 bg-red-50/50 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full animate-in fade-in">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span className="font-medium text-red-800 dark:text-red-300">
                  Did the city fix this properly?
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVerifyModalOpen(true);
                }}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                No, Needs More Work
              </Button>
            </div>
          )}

          {/* Status History */}
          {latestChange && (
            <div className="bg-muted/50 p-3 rounded-lg text-sm dark:bg-gray-800">
              <div className="flex items-center gap-2 font-medium">
                <User className="h-3 w-3" /> Latest Update
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                <span className="font-semibold text-foreground">
                  {latestChange.profiles?.display_name || "System"}
                </span>{" "}
                changed status to{" "}
                <span className="font-semibold text-foreground">
                  {formatStatus(latestChange.to_status)}
                </span>
              </p>
              {latestChange.notes && (
                <p className="text-xs italic text-muted-foreground mt-1 border-l-2 pl-2 border-primary/30">
                  "{latestChange.notes}"
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- BEFORE & AFTER MODAL --- */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-5xl h-[85vh] md:h-[75vh] flex flex-col p-0 overflow-hidden bg-[#0a0a0a] border-gray-800 shadow-2xl">
          <DialogHeader className="p-5 border-b border-white/10 bg-black/60">
            <DialogTitle className="text-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-400" />
              Issue #{issue.id} Evidence
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 w-full h-full flex flex-col md:flex-row p-6 gap-6 overflow-y-auto">
            {loadingImages ? (
              <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground gap-2">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Loading evidence...</p>
              </div>
            ) : (
              <>
                {/* LEFT SIDE: BEFORE */}
                {fetchedImages && fetchedImages.length > 0 && (
                  <div className="relative w-full min-h-[40vh] md:h-full flex-1 border border-white/10 rounded-xl overflow-hidden bg-black/50">
                    <Badge className="absolute top-3 left-3 z-10 bg-black/80 text-white border-white/20 backdrop-blur-md">
                      Before (Reported)
                    </Badge>
                    <Image
                      src={fetchedImages[0].url}
                      alt="Original Issue"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain"
                      priority
                    />
                  </div>
                )}

                {/* RIGHT SIDE: AFTER */}
                {issue.proof_of_work && issue.proof_of_work.length > 0 && (
                  <div className="relative w-full min-h-[40vh] md:h-full flex-1 border-2 border-green-500/50 rounded-xl overflow-hidden bg-black/50 shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)]">
                    <Badge className="absolute top-3 left-3 z-10 bg-green-600 text-white border-green-400 shadow-lg">
                      After (Repaired)
                    </Badge>
                    <Image
                      src={issue.proof_of_work[0].image_url}
                      alt="Repair Proof"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
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

                {fetchedImages !== null &&
                  fetchedImages.length === 0 &&
                  (!issue.proof_of_work ||
                    issue.proof_of_work.length === 0) && (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-muted-foreground text-sm font-medium">
                        No images available.
                      </p>
                    </div>
                  )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- VERIFICATION / APPEAL MODAL --- */}
      <CitizenVerificationModal
        issueId={issue.id}
        issueLat={issue.latitude}
        issueLng={issue.longitude}
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
