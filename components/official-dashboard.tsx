"use client";

import { useEffect, useState, useCallback } from "react";
import { OfficialIssueCard } from "./official-issue-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Loader2, Briefcase } from "lucide-react";

export default function OfficialDashboard() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignedIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/issues/assigned`);

      if (!res.ok) throw new Error("Failed to fetch assigned issues");

      const data = await res.json();
      setIssues(data.data || []);
    } catch (error) {
      console.error("Error fetching assigned issues:", error);
      setError("Failed to load your assigned tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignedIssues();
  }, [fetchAssignedIssues]);

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950">
        <CardContent className="py-6 flex items-center gap-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-300">
              Error
            </h3>
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
          <Button
            onClick={fetchAssignedIssues}
            variant="outline"
            className="ml-auto"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 dark:border-primary/20 shadow-sm bg-primary/5 dark:bg-primary/5">
      <CardHeader className="pb-4 border-b border-primary/10 dark:border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl text-primary">
              Assigned to Me
            </CardTitle>
            <Badge
              variant="secondary"
              className="ml-2 bg-primary/10 text-primary"
            >
              {issues.length} Pending
            </Badge>
          </div>
          <Button
            onClick={fetchAssignedIssues}
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/10"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            You currently have no assigned issues. Great job!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issues.map((issue) => (
              <OfficialIssueCard
                key={issue.id}
                issue={issue}
                onResolved={fetchAssignedIssues}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
