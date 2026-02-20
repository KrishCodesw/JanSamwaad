"use client";

import { useState } from "react";
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
} from "lucide-react";

// (Include your STATUS_COLORS and CATEGORY_COLORS here)

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

  // Form State
  const [note, setNote] = useState("");
  const [proofImage, setProofImage] = useState<File | null>(null);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofImage || !note.trim()) return;

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("issue_id", issue.id.toString());
      formData.append("note", note);
      formData.append("proof", proofImage);
      // The exact timestamp is captured server-side when saving to `status_history`

      // Ensure you create an API route to handle this submission
      const response = await fetch("/api/issues/resolve", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to submit resolution");

      onResolved(); // Refresh the list
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
                <Badge variant="outline">
                  {issue.status.replace("_", " ")}
                </Badge>
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
          <div className="flex items-center text-xs text-muted-foreground pt-2 border-t dark:border-gray-700">
            <Clock className="h-3 w-3 mr-1" />
            Reported: {formatTimeAgo(issue.created_at)}
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

      {/* Include your overlay reveal section for the issue image here just like in the original IssueCard */}
    </Card>
  );
}
