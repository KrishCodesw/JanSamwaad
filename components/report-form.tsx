"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Camera, MapPin, Upload, Flag, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";

const ISSUE_CATEGORIES = [
  { value: "pothole", label: "Pothole", color: "bg-red-100 text-red-800" },
  {
    value: "streetlight",
    label: "Street Light",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "sanitation",
    label: "Sanitation",
    color: "bg-green-100 text-green-800",
  },
  { value: "water", label: "Water Issue", color: "bg-blue-100 text-blue-800" },
  {
    value: "traffic",
    label: "Traffic Signal",
    color: "bg-orange-100 text-orange-800",
  },
  {
    value: "park",
    label: "Parks & Recreation",
    color: "bg-emerald-100 text-emerald-800",
  },
  { value: "other", label: "Other", color: "bg-gray-100 text-gray-800" },
];

export function ReportForm() {
  const [description, setDescription] = useState("");
  const [landmark, setlandmark] = useState("");
  const [category, setCategory] = useState("");
  const [flagged, setFlagged] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbyIssues, setNearbyIssues] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isBackCamera, setIsBackCamera] = useState(true);
  const supabase = createClient();

  // Get current user and geolocation
  useEffect(() => {
    // Get current user email
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getCurrentUser();

    // Get geolocation and fetch nearby issues
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLat(latitude);
        setLng(longitude);

        // Fetch nearby issues to prevent duplicates
        try {
          const res = await fetch(
            `/api/issues/near?lat=${latitude}&lng=${longitude}&radius=200`
          );
          if (res.ok) {
            const data = await res.json();
            setNearbyIssues(data || []);
          }
        } catch (e) {
          console.error("Error fetching nearby issues:", e);
        }
      });
    }
  }, []);

  // Camera functions
  const startCamera = async () => {
    console.log("startCamera called");

    // Wait a bit for React to render the video element
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (!videoRef.current) {
      console.error("Video ref is null after waiting");
      setError(
        "Video element not ready. Please refresh the page and try again."
      );
      return;
    }

    console.log("Video element found:", videoRef.current);

    // Check if browser supports camera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia not supported");
      setError(
        "Your browser doesn't support camera access. Please try uploading an image instead."
      );
      return;
    }

    try {
      setError(null);
      setLoading(true);
      console.log("Requesting camera access...");

      // Start with back camera (environment) first - PRIORITY
      let stream;
      try {
        console.log("Trying back camera (environment) first...");
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        console.log("Back camera (environment) successful");
        setIsBackCamera(true);
      } catch (backError) {
        console.log(
          "Back camera failed, trying fallback environment:",
          backError
        );

        // Try fallback environment camera
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
            },
          });
          console.log("Environment camera fallback successful");
          setIsBackCamera(true);
        } catch (envError) {
          console.log("Environment camera fallback failed:", envError);

          // Last resort - front camera
          try {
            console.log("Trying front camera as last resort...");
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: "user",
              },
            });
            console.log("Front camera successful");
            setIsBackCamera(false);
          } catch (frontError) {
            console.log(
              "Front camera failed, trying basic request:",
              frontError
            );

            // Final fallback - basic request
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
            console.log("Basic camera request successful");
            setIsBackCamera(false);
          }
        }
      }

      if (!stream) {
        throw new Error("No camera stream available");
      }

      console.log("Setting video source...");
      videoRef.current.srcObject = stream;

      // Wait for video to be ready
      videoRef.current.onloadedmetadata = () => {
        console.log("Video metadata loaded, playing video...");
        videoRef.current
          ?.play()
          .then(() => {
            console.log("Video playing successfully");
            setCameraActive(true);
            setLoading(false);
          })
          .catch((playError) => {
            console.error("Error playing video:", playError);
            setError("Could not start video playback");
            setLoading(false);
          });
      };

      videoRef.current.onerror = (err) => {
        console.error("Video error:", err);
        setError("Video playback error");
        setLoading(false);
        setCameraActive(false);
      };
    } catch (err) {
      console.error("Error accessing camera:", err);
      setLoading(false);
      setCameraActive(false);

      let errorMessage = "Could not access camera. ";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMessage +=
            "Camera permission denied. Please allow camera access and try again.";
        } else if (err.name === "NotFoundError") {
          errorMessage += "No camera found on this device.";
        } else if (err.name === "NotSupportedError") {
          errorMessage += "Camera not supported on this device.";
        } else {
          errorMessage += err.message;
        }
      } else {
        errorMessage += "Unknown error occurred.";
      }
      errorMessage += " Please try uploading an image instead.";

      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (!videoRef.current?.srcObject) return;

    const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
    tracks.forEach((track) => track.stop());
    videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Camera or canvas not ready. Please try again.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Check if video has loaded and has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError("Camera not ready. Please wait a moment and try again.");
      return;
    }

    try {
      console.log("Capturing image...", {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        isBackCamera: isBackCamera,
      });

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        setError("Could not get canvas context. Please try again.");
        return;
      }

      // Apply horizontal flip for front camera only
      if (!isBackCamera) {
        context.scale(-1, 1);
        context.translate(-canvas.width, 0);
      }

      // Draw the video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Reset transform if it was applied
      if (!isBackCamera) {
        context.setTransform(1, 0, 0, 1, 0, 0);
      }

      // Convert to data URL with high quality
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

      console.log("Image captured successfully", {
        dataUrlLength: dataUrl.length,
        dataUrlStart: dataUrl.substring(0, 50),
      });

      // Set both states to ensure image is properly stored
      setCapturedImage(dataUrl);
      setImageUrl(dataUrl);

      // Stop camera after successful capture
      stopCamera();
    } catch (err) {
      console.error("Error capturing image:", err);
      setError("Failed to capture image. Please try again.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        const dataUrl = event.target.result;
        setCapturedImage(dataUrl);
        setImageUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setCapturedImage(null);
    setImageUrl("");
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submit = async () => {
    if (!description.trim() || !category) {
      setError("Please fill in description and select a category");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData = {
        description: description.trim(),
        landmark: landmark.trim(),
        flagged,
        tags: [category],
        latitude: lat,
        longitude: lng,
        images: imageUrl ? [imageUrl] : [], // This will include the captured image
        reporterEmail: userEmail,
      };

      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");

      // Success - redirect to issues page
      window.location.href = "/issues";
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = ISSUE_CATEGORIES.find(
    (cat) => cat.value === category
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Report Civic Issue
          </CardTitle>
          <CardDescription>
            Help improve your community by reporting issues that need attention
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Location Status */}
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
        <MapPin className="h-4 w-4" />
        <span className="text-sm">
          {lat && lng ? (
            <>
              Location: {lat.toFixed(5)}, {lng.toFixed(5)}
            </>
          ) : (
            "Getting your location..."
          )}
        </span>
      </div>

      {/* Nearby Issues Warning */}
      {nearbyIssues.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-600 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="text-sm text-orange-800 dark:text-orange-200">
              ⚠️ Similar Issues Nearby
            </CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              {nearbyIssues.length} issue(s) found nearby. Please check if your
              issue is already reported.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {nearbyIssues.slice(0, 3).map((issue) => (
                <div
                  key={issue.id}
                  className="p-2 bg-white rounded border dark:bg-gray-800 dark:border-gray-700"
                >
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    #{issue.id}
                  </p>
                  <p className="text-sm dark:text-white">
                    {issue.description?.substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Issue Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cat.color}>
                        {cat.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Landmark *</Label>
            <Textarea
              placeholder="Please add a landmark..."
              value={landmark}
              onChange={(e) => setlandmark(e.target.value)}
              rows={1}
            />
          </div>

          {/* Priority Flag */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="flagged"
              checked={flagged}
              onCheckedChange={(checked) => setFlagged(checked as boolean)}
            />
            <Label htmlFor="flagged" className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-red-500" />
              Mark as urgent/priority
            </Label>
          </div>

          {/* Image Capture */}
          <div className="space-y-2">
            <Label>Photo Evidence</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {capturedImage ? (
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="max-w-full h-48 object-cover rounded mx-auto"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  {/* Video element - always rendered but hidden when not active */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-48 object-cover rounded ${
                      cameraActive ? "block" : "hidden"
                    } ${!isBackCamera ? "scale-x-[-1]" : ""}`}
                  />

                  {cameraActive ? (
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={captureImage}
                        disabled={
                          !videoRef.current || videoRef.current.videoWidth === 0
                        }
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Capture
                      </Button>
                      <Button variant="outline" onClick={stopCamera}>
                        Cancel
                      </Button>
                      {cameraActive && (
                        <span className="text-xs text-gray-500 self-center">
                          Using: {isBackCamera ? "Back" : "Front"} Camera
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Add a photo to help officials understand the issue
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={startCamera}
                          variant="outline"
                          disabled={loading}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          {loading ? "Opening Camera..." : "Take Photo"}
                        </Button>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          disabled={loading}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={submit}
            disabled={
              loading || !description.trim() || !category || !lat || !lng
            }
            className="w-full"
            size="lg"
          >
            {loading ? "Submitting Report..." : "Submit Issue Report"}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
