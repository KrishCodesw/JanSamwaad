"use client";

import { useEffect, useState } from "react";
import { IssueCard } from "./issue-card";
import AnnouncementsSection from "./announcements-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Filter, RefreshCw, Search } from "lucide-react";

type Issue = {
  id: number;
  status: string;
  description: string;
  tags?: string[];
  image_url?: string;
  flagged?: boolean;
  created_at: string;
  latitude: number;
  longitude: number;
  vote_count?: number;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "under_progress", label: "In Progress" },
  { value: "under_review", label: "Under Review" },
  { value: "closed", label: "Closed" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "pothole", label: "Pothole" },
  { value: "streetlight", label: "Street Light" },
  { value: "sanitation", label: "Sanitation" },
  { value: "water", label: "Water Issue" },
  { value: "traffic", label: "Traffic Signal" },
  { value: "park", label: "Parks & Recreation" },
  { value: "other", label: "Other" },
];

export default function IssuesListClient() {
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchIssues = async (lat?: number, lng?: number) => {
    try {
      const endpoint =
        lat && lng
          ? `/api/issues/near?lat=${lat}&lng=${lng}&radius=5000`
          : "/api/admin/issues";

      const res = await fetch(endpoint, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAllIssues(data || []);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const location = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserLocation(location);
          fetchIssues(location.lat, location.lng);
        },
        () => {
          // Fallback to all issues if geolocation fails
          fetchIssues();
        }
      );
    } else {
      fetchIssues();
    }
  }, []);

  // Apply filters whenever issues or filter criteria change
  useEffect(() => {
    let filtered = [...allIssues];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (issue) =>
          issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          issue.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((issue) => issue.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((issue) =>
        issue.tags?.includes(categoryFilter)
      );
    }

    // Sort
    if (sortBy === "recent") {
      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortBy === "priority") {
      filtered.sort((a, b) => {
        if (a.flagged && !b.flagged) return -1;
        if (!a.flagged && b.flagged) return 1;
        return (b.vote_count || 0) - (a.vote_count || 0);
      });
    } else if (sortBy === "distance" && userLocation) {
      filtered.sort((a, b) => {
        const distA = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          a.latitude,
          a.longitude
        );
        const distB = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          b.latitude,
          b.longitude
        );
        return distA - distB;
      });
    }

    setFilteredIssues(filtered);
  }, [
    allIssues,
    searchQuery,
    statusFilter,
    categoryFilter,
    sortBy,
    userLocation,
  ]);

  const handleUpvote = async (issueId: number) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error("Failed to upvote");

      // Update local state
      setAllIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId
            ? { ...issue, vote_count: (issue.vote_count || 0) + 1 }
            : issue
        )
      );
    } catch (error) {
      console.error("Upvote failed:", error);
      throw error;
    }
  };

  const refresh = () => {
    setLoading(true);
    if (userLocation) {
      fetchIssues(userLocation.lat, userLocation.lng);
    } else {
      fetchIssues();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading nearby issues...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Government Announcements */}
      <AnnouncementsSection />

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Nearby Issues
            {userLocation && (
              <Badge variant="outline">{filteredIssues.length} found</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {userLocation
              ? `Issues near your location (${userLocation.lat.toFixed(
                  4
                )}, ${userLocation.lng.toFixed(4)})`
              : "All reported issues"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                {userLocation && (
                  <SelectItem value="distance">Distance</SelectItem>
                )}
              </SelectContent>
            </Select>

            <Button
              onClick={refresh}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Issues Grid */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {filteredIssues.map((issue) => {
          const distance = userLocation
            ? calculateDistance(
                userLocation.lat,
                userLocation.lng,
                issue.latitude,
                issue.longitude
              )
            : undefined;

          return (
            <IssueCard
              key={issue.id}
              issue={issue}
              onUpvote={handleUpvote}
              showDistance={distance}
            />
          );
        })}
      </div>

      {filteredIssues.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No issues found matching your criteria.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your filters or check back later.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
