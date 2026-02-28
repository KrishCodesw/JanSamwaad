"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Expand,
  Shrink,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-muted/20">
      <span className="text-muted-foreground">Loading interactive map...</span>
    </div>
  ),
});

type Issue = {
  id: number;
  status: string;
  description: string;
  latitude: number;
  longitude: number;
  flagged?: boolean;
  created_at: string;
  vote_count?: number;
  tags?: string[];
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch issues");
  const data = await res.json();
  return Array.isArray(data)
    ? data
    : Array.isArray(data.issues)
      ? data.issues
      : [];
};

export default function IssuesMap({ className }: { className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // We start this as null so we know when it's actively fetching
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );

  const {
    data: issues = [],
    error,
    isLoading,
  } = useSWR<Issue[]>("/api/issues/map?limit=200", fetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => {
          console.warn("Geolocation denied or failed, using fallback.", err);
          setUserLocation([28.6139, 77.209]); // Delhi Fallback only on error
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      );
    } else {
      setUserLocation([28.6139, 77.209]); // Fallback if geolocation isn't supported
    }
  }, []);

  const handleIssueAction = async (issueId: number, action: "upvote") => {
    console.log(`Triggering ${action} for issue ${issueId}`);
    // Add upvote API logic here
  };

  // Wait for BOTH the issues to load AND the user's location to be found
  if (isLoading || !userLocation) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle>Issues Near You</CardTitle>
              <div className="h-6 w-12 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-48 space-y-2">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground text-sm">
              {!userLocation
                ? "Finding your location..."
                : "Loading map data..."}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-red-200 bg-red-50/50`}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <MapPin className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-900">Map Error</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 mb-4">
            {error.message || "Failed to load map data."}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`${className} transition-all duration-300 ${isExpanded ? "fixed inset-4 z-50 shadow-2xl" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Issues Near You</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {issues.length} issues
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="md:hidden"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden md:flex"
            >
              {isExpanded ? (
                <Shrink className="h-4 w-4" />
              ) : (
                <Expand className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="p-0">
          <div
            className={`${isExpanded ? "h-[calc(100vh-200px)]" : "h-48 md:h-64"} transition-all duration-300`}
          >
            {/* The map is guaranteed to mount with the correct userLocation now */}
            <LeafletMap
              issues={issues}
              mapCenter={userLocation}
              onIssueAction={handleIssueAction}
            />
          </div>

          {isExpanded && (
            <div className="p-4 border-t bg-muted/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Showing {issues.length} issues on map
                </span>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span>In Progress</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Resolved</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Urgent</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
