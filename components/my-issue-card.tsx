"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
} from "lucide-react";
import Image from "next/image";

// (Keep your types and helper functions here or import them)
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
  latitude: number;
  longitude: number;
  vote_count?: number | { count: number };
  images?: { url: string }[];
  status_changes?: StatusChange[];
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400";
    case "under_progress":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400";
    case "under_review":
      return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400";
    case "closed":
      return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400";
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
  // This state is now ISOLATED to this specific card
  const [isImageVisible, setIsImageVisible] = useState(false);

  const getLatestStatusChange = (issue: Issue) => {
    if (!issue.status_changes || issue.status_changes.length === 0) return null;
    return issue.status_changes.sort(
      (a, b) =>
        new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    )[0];
  };

  const latestChange = getLatestStatusChange(issue);
  const voteCount =
    typeof issue.vote_count === "object"
      ? issue.vote_count?.count
      : issue.vote_count;

  return (
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
          <div className="text-right text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(issue.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm dark:text-gray-300">{issue.description}</p>

        {/* Image Toggle Logic */}
        {issue.images && issue.images.length > 0 && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsImageVisible(!isImageVisible)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary p-0 h-auto"
            >
              <span>{isImageVisible ? "Hide Image" : "View Image"}</span>
              <Eye
                className={`h-4 w-4 transition-transform duration-300 ${isImageVisible ? "rotate-180" : ""}`}
              />
            </Button>

            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${isImageVisible ? "max-h-48 mt-2" : "max-h-0"}`}
            >
              <div className="rounded-lg overflow-hidden relative h-48 w-full">
                <Image
                  src={issue.images[0].url}
                  alt="Issue photo"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        )}

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

        {/* Status History */}
        {latestChange && (
          <div className="bg-muted/50 p-3 rounded-lg text-sm dark:bg-gray-800">
            <div className="flex items-center gap-2 font-medium">
              <User className="h-3 w-3" /> Status Update
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
              <p className="text-xs italic text-muted-foreground mt-1">
                "{latestChange.notes}"
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{voteCount || 0} votes</span>
          <span>{issue.images?.length || 0} images</span>
        </div>
      </CardContent>
    </Card>
  );
}
