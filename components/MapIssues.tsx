"use client";

import { useEffect, useState } from "react";
import { Map, MapMarker, MapPopup, MapControls } from "@/components/ui/map";
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

  // UI States
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // 👇 CHANGED: Controlled View State instead of generic Ref
  const [viewState, setViewState] = useState({
    longitude: 77.209, // Default: Delhi
    latitude: 28.6139,
    zoom: 12,
  });

  useEffect(() => {
    // 1. Get User Location & Update State
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Simply update the state, and the map will re-render there
          setViewState((prev) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            zoom: 14, // Zoom in closer for user location
          }));
        },
        () => console.log("Location access denied, staying at default.")
      );
    }

    // 2. Load Issues
    const loadIssues = async () => {
      try {
        const res = await fetch("/api/issues?limit=100");
        if (!res.ok) throw new Error("Failed to fetch issues");
        const data = await res.json();
        const fetchedIssues = Array.isArray(data) ? data : data.issues || [];
        setIssues(fetchedIssues);
      } catch (err) {
        console.error("Error loading issues:", err);
        setError("Failed to load issues.");
        setIssues([]);
      } finally {
        setLoading(false);
      }
    };

    loadIssues();
  }, []);

  const getStatusColor = (status: string, flagged?: boolean) => {
    if (flagged) return "bg-red-500 border-red-600";
    switch (status) {
      case "under_progress":
        return "bg-amber-500 border-amber-600";
      case "under_review":
        return "bg-violet-500 border-violet-600";
      case "closed":
        return "bg-emerald-500 border-emerald-600";
      default:
        return "bg-blue-500 border-blue-600";
    }
  };

  if (error) {
    return (
      <Card className={`${className} border-red-200 bg-red-50/50`}>
        <CardContent className="p-6 text-center flex flex-col items-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <p className="text-red-700 font-medium">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-4 bg-white hover:bg-red-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Reload
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`${className} transition-all duration-500 ease-in-out border-border/50 shadow-sm ${
        isExpanded ? "fixed inset-4 z-50 shadow-2xl h-[calc(100vh-2rem)]" : ""
      }`}
    >
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              Civic Issues Map
            </CardTitle>
            <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5">
              {issues.length} Active
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hidden md:flex"
              onClick={() => setIsExpanded(!isExpanded)}
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
        <CardContent className="p-0 relative bg-muted/10">
          <div
            className={`${
              isExpanded ? "h-[calc(100%-4rem)]" : "h-[400px] md:h-[500px]"
            } w-full relative transition-all duration-300`}
          >
            <Map
              {...({
                ...viewState,
                onMove: (evt: any) => setViewState(evt.viewState),
                mapStyle:
                  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
              } as any)}
            >
              <MapControls />

              {/* RENDER MARKERS */}
              {issues.map((issue) => (
                <MapMarker
                  key={issue.id}
                  latitude={issue.latitude}
                  longitude={issue.longitude}
                  anchor="center"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    setSelectedIssue(issue);
                  }}
                >
                  <div className="group relative cursor-pointer">
                    <div
                      className={`
                        w-5 h-5 rounded-full border-2 border-white shadow-lg 
                        transition-transform hover:scale-125
                        ${getStatusColor(issue.status, issue.flagged)}
                      `}
                    />
                  </div>
                </MapMarker>
              ))}

              {/* RENDER POPUP */}
              {selectedIssue && (
                <MapPopup
                  latitude={selectedIssue.latitude}
                  longitude={selectedIssue.longitude}
                  onClose={() => setSelectedIssue(null)}
                  className="min-w-[250px] max-w-[300px]"
                >
                  <div className="space-y-2 p-1">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-semibold text-sm capitalize">
                        {selectedIssue.status.replace("_", " ")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(
                          selectedIssue.created_at
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">
                      {selectedIssue.description}
                    </p>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px] h-5">
                        Votes: {selectedIssue.vote_count ?? 0}
                      </Badge>
                      {selectedIssue.tags?.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] h-5"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </MapPopup>
              )}
            </Map>
          </div>

          {isExpanded && (
            <div className="absolute bottom-6 left-6 right-6 bg-background/95 backdrop-blur p-3 rounded-lg border shadow-lg z-10 flex flex-wrap gap-4 text-xs justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                Active
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>In
                Progress
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-500"></div>
                Review
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                Resolved
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
