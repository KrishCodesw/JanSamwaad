"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export function CitizenVerificationModal({
  issueId,
  onSuccess,
}: {
  issueId: number;
  onSuccess?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"initial" | "locating" | "form" | "success">(
    "initial",
  );
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setStep("initial");
        setLocation(null);
        setNotes("");
        setError(null);
      }, 300);
    }
  };

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
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setStep("form");
      },
      (err) => {
        console.error("Location Error:", err);
        setError(
          "We couldn't verify your location. Please ensure GPS is enabled for this site.",
        );
        setStep("initial");
      },
      // Force high accuracy so the 50-meter Digipin lock works reliably
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
      // Trigger parent refresh after 2 seconds so they can see the success message
      if (onSuccess) {
        setTimeout(() => {
          setIsOpen(false);
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
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Needs More Work
        </Button>
      </DialogTrigger>

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

          {/* STEP 1: Get GPS */}
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

          {/* STEP 2: Loading GPS */}
          {step === "locating" && (
            <div className="space-y-4 text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Acquiring high-accuracy GPS coordinates...
              </p>
            </div>
          )}

          {/* STEP 3: The Form */}
          {step === "form" && (
            <div className="space-y-4">
              <div className="bg-green-50 text-green-700 p-2 rounded text-xs flex items-center gap-2 border border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                Location acquired. Ready to submit feedback.
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  What is wrong with the repair?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="e.g., They just filled the pothole with loose gravel and it washed away."
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

          {/* STEP 4: Success */}
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
