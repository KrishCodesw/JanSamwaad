"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  MapPin,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

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
  flagged?: boolean;
  created_at: string;
  latitude: number;
  longitude: number;
  vote_count?: number;
  images?: { url: string }[];
  status_changes?: StatusChange[];
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "under_progress", label: "In Progress" },
  { value: "under_review", label: "Under Review" },
  { value: "closed", label: "Closed" },
];

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
      return <AlertTriangle className="h-4 w-4 dark:text-blue-400" />;
    case "under_progress":
      return <Clock className="h-4 w-4 dark:text-amber-400" />;
    case "under_review":
      return <Eye className="h-4 w-4 dark:text-purple-400" />;
    case "closed":
      return <CheckCircle className="h-4 w-4 dark:text-green-400" />;
    default:
      return <AlertTriangle className="h-4 w-4 dark:text-gray-400" />;
  }
};

const formatStatus = (status: string) => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function MyIssuesClient() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchMyIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/issues/my?${params}`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data || []);
      } else if (res.status === 401) {
        setError("Please sign in to view your issues");
      } else {
        setError("Failed to load your issues. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching my issues:", error);
      setError(
        "Something went wrong. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyIssues();
  }, [statusFilter]);

  const getLatestStatusChange = (issue: Issue): StatusChange | null => {
    if (!issue.status_changes || issue.status_changes.length === 0) return null;
    return issue.status_changes.sort(
      (a, b) =>
        new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    )[0];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for filters */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="h-6 w-20 bg-muted animate-pulse rounded dark:bg-gray-800"></div>
              <div className="h-8 w-20 bg-muted animate-pulse rounded dark:bg-gray-800"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-10 bg-muted animate-pulse rounded dark:bg-gray-800"></div>
              <div className="h-6 w-16 bg-muted animate-pulse rounded dark:bg-gray-800"></div>
            </div>
          </CardContent>
        </Card>

        {/* Loading skeleton for issues */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-muted animate-pulse rounded dark:bg-gray-800"></div>
                    <div className="h-6 w-24 bg-muted animate-pulse rounded dark:bg-gray-800"></div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-3 w-20 bg-muted animate-pulse rounded dark:bg-gray-800"></div>
                    <div className="h-3 w-24 bg-muted animate-pulse rounded dark:bg-gray-800"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-4 w-full bg-muted animate-pulse rounded dark:bg-gray-800"></div>
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded dark:bg-gray-800"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950">
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
            Something went wrong
          </h3>
          <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
          <Button
            onClick={fetchMyIssues}
            variant="outline"
            className="dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg dark:text-white">Filters</CardTitle>
            <Button
              onClick={fetchMyIssues}
              variant="outline"
              size="sm"
              className="dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:data-[state=open]:bg-gray-800">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge
              variant="secondary"
              className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
            >
              {issues.length} issue{issues.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      {issues.length === 0 ? (
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground dark:text-gray-400">
              No issues found.
            </p>
            <p className="text-sm text-muted-foreground mt-2 dark:text-gray-400">
              <Link
                href="/report"
                className="underline text-primary dark:text-blue-400"
              >
                Report your first issue
              </Link>{" "}
              to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => {
            const latestChange = getLatestStatusChange(issue);

            return (
              <Card
                key={issue.id}
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
                          <Badge
                            variant="destructive"
                            className="text-xs dark:bg-red-900 dark:text-red-400"
                          >
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(issue.status)}
                        <Badge
                          className={`text-xs ${getStatusColor(issue.status)}`}
                          variant="secondary"
                        >
                          {formatStatus(issue.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(issue.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {issue.latitude.toFixed(4)},{" "}
                        {issue.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm dark:text-gray-300">
                    {issue.description}
                  </p>

                  {issue.tags && issue.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {issue.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs dark:text-gray-400 dark:border-gray-700"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Latest Status Change */}
                  {latestChange && (
                    <div className="bg-muted/50 p-3 rounded-lg text-sm dark:bg-gray-800">
                      <div className="flex items-center gap-2 font-medium dark:text-white">
                        <User className="h-3 w-3" />
                        Status Update
                      </div>
                      <p className="text-muted-foreground mt-1 dark:text-gray-400">
                        <span className="dark:text-white">
                          {latestChange.profiles?.display_name || "System"}
                        </span>{" "}
                        updated this issue to "
                        <span className="font-medium">
                          {formatStatus(latestChange.to_status)}
                        </span>
                        "
                        {latestChange.notes && (
                          <>
                            <br />
                            <span className="italic">
                              Note: {latestChange.notes}
                            </span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 dark:text-gray-500">
                        {new Date(latestChange.changed_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      {issue.vote_count && (
                        <span className="text-muted-foreground dark:text-gray-400">
                          👍 {issue.vote_count} votes
                        </span>
                      )}
                      {issue.images && issue.images.length > 0 && (
                        <span className="text-muted-foreground dark:text-gray-400">
                          📷 {issue.images.length} image
                          {issue.images.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
