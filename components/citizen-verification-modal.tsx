"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Navigation,
} from "lucide-react";

// --- Frontend Haversine distance calculator ---
function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371e3; // Earth's radius in meters
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const deltaP = p2 - p1;
  const deltaLon = lon2 - lon1;
  const deltaLambda = (deltaLon * Math.PI) / 180;

  const a =
    Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
    Math.cos(p1) *
      Math.cos(p2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function CitizenVerificationModal({
  issueId,
  issueLat, // <-- NEW PROP
  issueLng, // <-- NEW PROP
  isOpen,
  onClose,
  onSuccess,
}: {
  issueId: number;
  issueLat: number;
  issueLng: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"initial" | "locating" | "form" | "success">(
    "initial",
  );
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("initial");
        setLocation(null);
        setNotes("");
        setError(null);
      }, 300);
    }
  }, [isOpen]);

  const handleGetLocation = () => {
    setError(null);
    setStep("locating");

    if (!navigator.geolocation) {
      setError("Location services are not supported by your browser.");
      setStep("initial");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // --- NEW: FRONTEND DISTANCE CHECK ---
        const distance = getDistanceInMeters(
          userLat,
          userLng,
          issueLat,
          issueLng,
        );

        if (distance > 50) {
          setError(
            `Digipin Check Failed. You are ${Math.round(distance)} meters away. You must be within 50 meters to verify.`,
          );
          setStep("initial");
          return;
        }
        // ------------------------------------

        // If they pass, let them see the form!
        setLocation({ lat: userLat, lng: userLng });
        setStep("form");
      },
      (err) => {
        console.error("Location Error:", err);
        setError(
          "We couldn't verify your location. Please ensure GPS is enabled for this site.",
        );
        setStep("initial");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleSubmit = async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/issues/${issueId}/appeal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          notes: notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit verification.");
      }

      setStep("success");
      if (onSuccess) {
        setTimeout(() => {
          onClose();
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Issue Verification</DialogTitle>
          <DialogDescription>
            Help us maintain accountability by verifying if this work was
            actually completed.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-200 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {step === "initial" && (
            <div className="space-y-4 text-center py-4">
              <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Digipin Verification Required</h3>
              <p className="text-sm text-muted-foreground">
                To prevent spam, you must physically be within 50 meters of the
                issue to dispute the resolution.
              </p>
              <Button onClick={handleGetLocation} className="w-full mt-2">
                <Navigation className="h-4 w-4 mr-2" />
                Verify My Location
              </Button>
            </div>
          )}

          {step === "locating" && (
            <div className="space-y-4 text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Acquiring high-accuracy GPS coordinates...
              </p>
            </div>
          )}

          {step === "form" && (
            <div className="space-y-4">
              <div className="bg-green-50 text-green-700 p-2 rounded text-xs flex items-center gap-2 border border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                Location verified. Ready to submit feedback.
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  What is wrong with the repair?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="e.g., They just filled the pothole with loose gravel..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={loading || notes.trim().length < 5}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Rejection"
                )}
              </Button>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-4 text-center py-6">
              <div className="mx-auto bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold">Feedback Submitted</h3>
              <p className="text-sm text-muted-foreground">
                Thank you for holding the city accountable. This issue has been
                reopened.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
