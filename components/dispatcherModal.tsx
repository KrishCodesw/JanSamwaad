"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, MapPin, Loader2, AlertCircle, Hash } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
// 1. IMPORT THE LIBRARY
import { encode } from "@pranamphd/digipin";

interface DispatcherModalProps {
  issueId: number;
  departmentId: number;
  departmentName: string;
  lat: number;
  lng: number;
  onAssign: () => void;
}

export default function DispatcherModal({
  issueId,
  departmentId,
  departmentName,
  lat,
  lng,
  onAssign,
}: DispatcherModalProps) {
  const [open, setOpen] = useState(false);
  const [officials, setOfficials] = useState<any[]>([]);
  const [detectedRegion, setDetectedRegion] = useState<string>("Detecting...");
  const [digiPin, setDigiPin] = useState<string>(""); // State for the PIN
  const [assigning, setAssigning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      calculateDigiPin();
      detectRegionAndFetch();
    }
  }, [open]);

  // 2. CALCULATE DIGIPIN LOCALLY
  const calculateDigiPin = () => {
    if (lat && lng) {
      try {
        const pin = encode({ latitude: lat, longitude: lng });
        setDigiPin(pin);
      } catch (e) {
        console.error("DigiPIN generation failed:", e);
      }
    }
  };

  const detectRegionAndFetch = async () => {
    setLoading(true);
    let regionName = "All";

    // Basic coordinate validation
    if (!lat || !lng) {
      setDetectedRegion("Location Missing");
      fetchOfficials("All");
      return;
    }

    try {
      // Use your local proxy API to avoid CSP errors
      const url = `/api/external/geocode?lat=${lat}&lon=${lng}`;

      const geoRes = await fetch(url);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const addr = geoData.address || {};

        regionName =
          addr.neighbourhood ||
          addr.suburb ||
          addr.village ||
          addr.town ||
          addr.city_district ||
          "Unknown";

        setDetectedRegion(regionName);
      } else {
        // If Geo API fails, we still have the DigiPIN!
        setDetectedRegion("Region Lookup Failed");
      }
    } catch (e) {
      console.error("Geocoding failed", e);
      setDetectedRegion("Unknown Region");
    }

    await fetchOfficials(regionName);
  };

  const fetchOfficials = async (region: string) => {
    try {
      // Only filter by region if we successfully detected one
      const regionParam =
        region !== "All" && region !== "Unknown Region"
          ? `&region=${region}`
          : "";
      const res = await fetch(
        `/api/admin/officials?departmentId=${departmentId}${regionParam}`,
      );
      const data = await res.json();
      setOfficials(data);
    } catch (error) {
      console.error("Failed to fetch officials", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (officialId: string) => {
    setAssigning(officialId);
    try {
      await fetch(`/api/admin/issues/${issueId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee_id: officialId }),
      });
      setOpen(false);
      onAssign();
    } catch (error) {
      console.error("Assignment failed", error);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
        >
          <UserCheck className="h-3.5 w-3.5 mr-2" />
          Assign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Issue #{issueId}</DialogTitle>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-2 items-center">
            <Badge variant="outline" className="text-xs">
              {departmentName}
            </Badge>

            {/* Display Detected Region */}
            <span className="flex items-center gap-1 text-blue-400">
              <MapPin className="h-3 w-3" />
              {detectedRegion}
            </span>

            {/* 3. DISPLAY DIGIPIN */}
            {digiPin && (
              <>
                <span className="text-muted-foreground/30">|</span>
                <span className="flex items-center gap-1 text-orange-500 font-mono font-medium tracking-wide bg-orange-500/10 px-2 py-0.5 rounded">
                  {/* <Hash className="h-3 w-3" /> */}
                  DigiPin: {digiPin}
                </span>
              </>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-2 mt-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-xs">Analyzing location...</p>
              </div>
            ) : officials.length === 0 ? (
              <div className="text-center py-6 space-y-3 bg-muted/30 rounded-lg border border-dashed">
                <div className="flex justify-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No officials found specifically in{" "}
                  <strong>{detectedRegion}</strong>.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDetectedRegion("All Regions");
                    fetchOfficials("All");
                  }}
                >
                  Show All {departmentName} Officials
                </Button>
              </div>
            ) : (
              officials.map((official) => (
                <div
                  key={official.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() => handleAssign(official.id)}
                >
                  <div className="space-y-1">
                    <p className="font-medium leading-none">{official.name}</p>
                    <div className="flex items-center text-xs text-muted-foreground gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {official.region || "General"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div
                        className={`text-xs font-medium ${
                          official.workload > 10
                            ? "text-red-500 font-bold"
                            : "text-green-500"
                        }`}
                      >
                        {official.workload} Active
                        {official.workload > 10 && (
                          <span className="ml-1">⚠️</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Workload
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={assigning === official.id ? "ghost" : "default"}
                      disabled={!!assigning}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssign(official.id);
                      }}
                    >
                      {assigning === official.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Select"
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
