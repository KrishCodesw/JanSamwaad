"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  Flag,
  Eye,
  UploadCloud,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";

// Note: Replace this import with the actual path to your digipin encoder function
import { encode } from "@pranamphd/digipin";

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

export function OfficialIssueCard({
  issue,
  onResolved,
}: {
  issue: any;
  onResolved: () => void;
}) {
  const [showImage, setShowImage] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [digiPin, setDigiPin] = useState<string | null>(null);

  // Form State
  const [note, setNote] = useState("");
  const [proofImage, setProofImage] = useState<File | null>(null);

  useEffect(() => {
    if (issue.latitude && issue.longitude) {
      try {
        const pin = encode({
          latitude: issue.latitude,
          longitude: issue.longitude,
        });
        setDigiPin(pin);
      } catch (e) {
        console.error("DigiPIN generation failed:", e);
      }
    }
  }, [issue.latitude, issue.longitude]);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofImage || !note.trim()) return;

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("issue_id", issue.id.toString());
      formData.append("note", note);
      formData.append("proof", proofImage);

      const response = await fetch("/api/issues/resolve", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to submit resolution");

      onResolved();
    } catch (error) {
      console.error("Error resolving issue:", error);
      alert("Failed to submit resolution. Please try again.");
    } finally {
      setSubmitting(false);
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
    <Card className="relative overflow-hidden flex flex-col h-full dark:bg-gray-900 dark:border-gray-700">
      <div className="flex flex-col flex-grow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-muted-foreground">
                  #{issue.id}
                </span>
                {issue.flagged && <Flag className="h-4 w-4 text-red-500" />}
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
                {issue.tags?.map((tag: string) => (
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
            {issue.images && issue.images.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowImage(true)}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 flex-grow">
          <p className="text-sm leading-relaxed dark:text-gray-300">
            {issue.description}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t dark:border-gray-700">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Reported: {formatTimeAgo(issue.created_at)}
            </div>

            {/* --- DigiPIN & External Map Link --- */}
            {digiPin && (
              <div className="flex items-center hover:text-primary transition-colors">
                <MapPin className="h-3 w-3 mr-1" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in Google Maps"
                  className="underline underline-offset-2 font-medium"
                >
                  {digiPin}
                </a>
              </div>
            )}
          </div>
        </CardContent>

        {/* Resolution Action Area */}
        <CardFooter className="bg-muted/30 dark:bg-gray-800/50 flex flex-col items-stretch p-4">
          {!isResolving ? (
            <Button
              className="w-full gap-2"
              onClick={() => setIsResolving(true)}
            >
              <CheckCircle2 className="h-4 w-4" /> Update & Resolve
            </Button>
          ) : (
            <form
              onSubmit={handleResolveSubmit}
              className="space-y-4 w-full animate-in fade-in slide-in-from-top-4"
            >
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">
                  Resolution Notes
                </label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe the actions taken..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">
                  Proof of Work (Image)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsResolving(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4 mr-2" /> Submit Proof
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" /> Timestamp will be recorded
                securely upon submission.
              </p>
            </form>
          )}
        </CardFooter>
      </div>

      {/* --- OVERLAY REVEAL SECTION --- */}
      {issue.images && issue.images.length > 0 && (
        <div
          className={`absolute inset-0 z-20 bg-background/95 backdrop-blur-sm transition-transform duration-300 ease-in-out ${
            showImage ? "translate-y-0" : "translate-y-full"
          }`}
          onClick={() => setShowImage(false)}
        >
          {/* Close Button */}
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

          {/* The Image */}
          <div className="relative w-full h-full cursor-pointer">
            <Image
              src={issue.images[0].url}
              alt="Issue evidence"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          </div>
        </div>
      )}
    </Card>
  );
}
