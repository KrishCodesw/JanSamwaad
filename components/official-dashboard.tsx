"use client";

import { useEffect, useState, useCallback } from "react";
import { OfficialIssueCard } from "./official-issue-card";
import { ResolvedIssueCard } from "./resolved-issue-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  AlertCircle,
  Loader2,
  Briefcase,
  CheckCircle2,
} from "lucide-react";

export default function OfficialDashboard() {
  const [pendingIssues, setPendingIssues] = useState<any[]>([]);
  const [resolvedIssues, setResolvedIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both pending and resolved issues simultaneously
      const [pendingRes, resolvedRes] = await Promise.all([
        fetch(`/api/issues/assigned?status=pending`),
        fetch(`/api/issues/assigned?status=resolved`),
      ]);

      if (!pendingRes.ok || !resolvedRes.ok) {
        throw new Error("Failed to fetch issues");
      }

      const pendingData = await pendingRes.json();
      const resolvedData = await resolvedRes.json();

      setPendingIssues(pendingData.data || []);
      setResolvedIssues(resolvedData.data || []);
    } catch (error) {
      console.error("Error fetching issues:", error);
      setError("Failed to load your tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

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
          <Button onClick={fetchIssues} variant="outline" className="ml-auto">
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
              Resolution Desk
            </CardTitle>
          </div>
          <Button
            onClick={fetchIssues}
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
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="pending">
              Pending Tasks
              <Badge variant="secondary" className="ml-2 bg-background">
                {pendingIssues.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved History
              <Badge variant="secondary" className="ml-2 bg-background">
                {resolvedIssues.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="pending" className="mt-0">
                {pendingIssues.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-primary/20 rounded-lg text-muted-foreground">
                    You currently have no assigned issues. Great job!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {pendingIssues.map((issue) => (
                      <OfficialIssueCard
                        key={issue.id}
                        issue={issue}
                        onResolved={fetchIssues}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* RESOLVED TAB CONTENT */}
              <TabsContent value="resolved" className="mt-0">
                {resolvedIssues.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-primary/20 rounded-lg text-muted-foreground">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
                    You haven't resolved any issues yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {/* 2. Map using the new ResolvedIssueCard */}
                    {resolvedIssues.map((issue) => (
                      <ResolvedIssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
