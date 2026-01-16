"use client";

import { useEffect, useState, useCallback } from "react";
import { MyIssueCard } from "./my-issue-card"; // Import the new component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "under_progress", label: "In Progress" },
  { value: "under_review", label: "Under Review" },
  { value: "closed", label: "Closed" },
];

export default function MyIssuesClient() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchMyIssues = useCallback(
    async (targetPage: number, shouldAppend: boolean) => {
      try {
        if (shouldAppend) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const params = new URLSearchParams({
          page: targetPage.toString(),
          limit: "5", // 5 items per page
          status: statusFilter,
        });

        const res = await fetch(`/api/issues/my?${params}`);

        if (res.status === 401) {
          setError("Please sign in to view your issues");
          return;
        }

        if (!res.ok) throw new Error("Failed");

        const data = await res.json();
        const newIssues = data.data || [];
        const meta = data.meta;

        setHasMore(meta.hasMore);
        setTotalCount(meta.total);

        if (shouldAppend) {
          setIssues((prev) => [...prev, ...newIssues]);
        } else {
          setIssues(newIssues);
        }
      } catch (error) {
        console.error("Error fetching my issues:", error);
        setError("Failed to load issues.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [statusFilter]
  );

  // Initial Load & Filter Change
  useEffect(() => {
    setPage(1);
    fetchMyIssues(1, false);
  }, [statusFilter, fetchMyIssues]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMyIssues(nextPage, true);
  };

  const handleRefresh = () => {
    setPage(1);
    fetchMyIssues(1, false);
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950">
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
            Something went wrong
          </h3>
          <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg dark:text-white">
              My Reports
            </CardTitle>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="dark:border-gray-700 dark:bg-gray-900"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="dark:bg-gray-800">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary">{totalCount} Total</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      {loading && issues.length === 0 ? (
        // Simple Skeleton
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-40 bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No issues found.</p>
            <p className="text-sm mt-2">
              <Link href="/report" className="underline text-primary">
                Report your first issue
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <MyIssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}

      {/* Pagination Button */}
      {issues.length > 0 && hasMore && (
        <div className="flex justify-center py-4">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loadingMore ? "Loading..." : "Load Older Issues"}
          </Button>
        </div>
      )}
    </div>
  );
}
