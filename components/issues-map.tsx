"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useMemo } from "react";
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

// 👇 Dynamically import LeafletMap without SSR
const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

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

export default function IssuesMap({ className }: { className?: string }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number]>([
    28.6139,
    77.209, // fallback: Delhi
  ]);
  const [L, setLeaflet] = useState<any>(null); // store leaflet

  useEffect(() => {
    // Get user location first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => setUserLocation([28.6139, 77.209]) // fallback
      );
    }

    // Load issues
    const loadIssues = async () => {
      try {
        const res = await fetch("/api/issues?limit=100");
        if (!res.ok) {
          throw new Error("Failed to fetch issues");
        }
        const data = await res.json();
        const fetchedIssues = Array.isArray(data)
          ? data
          : Array.isArray(data.issues)
          ? data.issues
          : [];
        setIssues(fetchedIssues);
      } catch (err) {
        console.error("Error loading issues:", err);
        setError("Failed to load issues. Please try refreshing the page.");
        setIssues([]); // Ensure issues array is empty on error
      } finally {
        setLoading(false);
      }
    };

    loadIssues();

    // Load leaflet only on client
    import("leaflet").then((leaflet) => setLeaflet(leaflet));
  }, []);

  const mapCenter = useMemo(() => {
    if (issues.length > 0) {
      const lat = issues.reduce((s, i) => s + i.latitude, 0) / issues.length;
      const lng = issues.reduce((s, i) => s + i.longitude, 0) / issues.length;
      return [lat, lng] as [number, number];
    }
    return userLocation;
  }, [issues, userLocation]);

  // marker style function
  const createCustomIcon = (status: string, flagged?: boolean) => {
    if (!L) return null; // wait until leaflet is loaded

    let color = "#3b82f6";
    if (status === "under_progress") color = "#f59e0b";
    if (status === "under_review") color = "#8b5cf6";
    if (status === "closed") color = "#10b981";
    if (flagged) color = "#ef4444";

    return L.divIcon({
      html: `<div style="background:${color};width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3);"></div>`,
      className: "custom-div-icon",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  if (loading || !L) {
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
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading map...</span>
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
          <p className="text-red-700 mb-4">{error}</p>
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
      className={`${className} transition-all duration-300 ${
        isExpanded ? "fixed inset-4 z-50 shadow-2xl" : ""
      }`}
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
            className={`${
              isExpanded ? "h-[calc(100vh-200px)]" : "h-48 md:h-64"
            } transition-all duration-300`}
          >
            <LeafletMap
              issues={issues}
              mapCenter={mapCenter}
              createCustomIcon={createCustomIcon}
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
