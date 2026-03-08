"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  images?: { url: string }[];
  flagged?: boolean;
  created_at: string;
  latitude: number;
  longitude: number;
  vote_count?: number | { count: number };
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

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// --- MAIN COMPONENT ---
export default function IssuesListClient() {
  // State: Data
  const [issues, setIssues] = useState<Issue[]>([]);

  // State: Pagination & Loading
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // State: Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 600);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  // State: Location
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Observer Ref for Infinite Scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  // Helper: Calculate Distance
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371;
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

  // --- API FETCH FUNCTION ---
  const fetchIssues = useCallback(
    async (targetPage: number, shouldAppend: boolean) => {
      try {
        if (shouldAppend) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const params = new URLSearchParams({
          page: targetPage.toString(),
          limit: "12",
          status: statusFilter,
          category: categoryFilter,
          sort: sortBy,
        });

        if (debouncedSearch) {
          params.append("search", debouncedSearch);
        }

        const res = await fetch(`/api/issues/public?${params.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to fetch");

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
        console.error("Error fetching issues:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [statusFilter, categoryFilter, sortBy, debouncedSearch],
  );

  // --- EFFECTS ---

  // 1. Get User Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        (err) => console.log("Location access denied or failed", err),
      );
    }
  }, []);

  // 2. Handle Filter Changes
  useEffect(() => {
    setPage(1);
    fetchIssues(1, false);
  }, [statusFilter, categoryFilter, sortBy, debouncedSearch, fetchIssues]);

  // 3. Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchIssues(nextPage, true);
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, page, fetchIssues]);

  // --- HANDLERS ---

  const handleUpvote = async (issueId: number) => {
    // 1. Optimistic UI: Instantly update the list state
    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id === issueId) {
          // Normalize vote_count to a number
          const currentVotes =
            typeof issue.vote_count === "object"
              ? issue.vote_count?.count || 0
              : issue.vote_count || 0;
          return { ...issue, vote_count: currentVotes + 1 };
        }
        return issue;
      }),
    );

    // 2. Fire the API call in the background
    try {
      await fetch(`/api/issues/${issueId}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch (error) {
      console.error("Vote failed", error);
      // Optional: You could revert the state here if the API fails
    }
  };
  const handleRefresh = () => {
    setPage(1);
    fetchIssues(1, false);
  };

  return (
    <div className="space-y-6">
      <AnnouncementsSection />

      {/* Header & Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Nearby Issues
            {!loading && <Badge variant="outline">{totalCount} found</Badge>}
          </CardTitle>
          <CardDescription>
            {userLocation
              ? `Displaying issues relative to your location`
              : "Showing all reported issues"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters Container */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

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
              </SelectContent>
            </Select>

            <Button
              onClick={handleRefresh}
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
      {loading ? (
        // Initial Page Load Skeletons
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No issues found matching your criteria.
            </p>
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
            >
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {issues.map((issue) => {
              const votes =
                typeof issue.vote_count === "object"
                  ? issue.vote_count?.count
                  : issue.vote_count;

              const normalizedIssue = {
                ...issue,
                vote_count: votes || 0,
              };

              const distance = userLocation
                ? calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    issue.latitude,
                    issue.longitude,
                  )
                : undefined;

              return (
                <IssueCard
                  key={issue.id}
                  issue={normalizedIssue}
                  onUpvote={handleUpvote}
                  showDistance={distance}
                />
              );
            })}

            {/* Pagination Skeletons (Shows at the bottom while fetching next page) */}
            {loadingMore && (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            )}
          </div>

          {/* Invisible Observer Target for Infinite Scroll */}
          {!loading && hasMore && (
            <div
              ref={observerTarget}
              className="h-10 w-full"
              aria-hidden="true"
            />
          )}
        </>
      )}

      {/* End of list state */}
      {!loading && !hasMore && issues.length > 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          You've reached the end of the list.
        </div>
      )}
    </div>
  );
}

// Reusable Skeleton Component
function SkeletonCard() {
  return (
    <Card className="overflow-hidden bg-card/50 border-muted">
      <CardHeader className="gap-2 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
          <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-[90%] bg-muted animate-pulse rounded" />
          <div className="h-4 w-[60%] bg-muted animate-pulse rounded" />
        </div>
        <div className="pt-4 border-t border-muted/50">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
