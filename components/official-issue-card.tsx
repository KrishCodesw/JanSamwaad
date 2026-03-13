"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Clock,
  Flag,
  Eye,
  EyeOff,
  UploadCloud,
  CheckCircle2,
  Loader2,
  X,
  Camera,
  Upload,
  AlertOctagon,
  AlertTriangle,
} from "lucide-react";

import { encode } from "@pranamphd/digipin";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400",
  under_progress:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400",
  under_review: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400",
  closed: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
};

const CATEGORY_COLORS: Record<string, string> = {
  pothole: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400",
  streetlight:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400",
  sanitation:
    "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
  water: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400",
  traffic:
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400",
  park: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400",
};

function dataURLtoFile(dataurl: string, filename: string) {
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) return null;
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export function OfficialIssueCard({
  issue,
  onResolved,
}: {
  issue: any;
  onResolved: () => void;
}) {
  const [showImageOverlay, setShowImageOverlay] = useState(false);
  const [showReferenceImage, setShowReferenceImage] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [digiPin, setDigiPin] = useState<string | null>(null);

  const [isRoadblockModalOpen, setIsRoadblockModalOpen] = useState(false);
  const [roadblockNote, setRoadblockNote] = useState("");
  const [submittingRoadblock, setSubmittingRoadblock] = useState(false);

  const [note, setNote] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isBackCamera, setIsBackCamera] = useState(true);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (issue.latitude && issue.longitude) {
      try {
        const pin = encode({
          latitude: issue.latitude,
          longitude: issue.longitude,
        });
        setDigiPin(pin);
      } catch (e) {
        console.error("DigiPIN generation failed:", e);
      }
    }
  }, [issue.latitude, issue.longitude]);

  const handleRoadblockSubmit = async () => {
    if (!roadblockNote.trim()) return;
    setSubmittingRoadblock(true);

    try {
      const response = await fetch(`/api/issues/${issue.id}/roadblock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: roadblockNote }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to report roadblock");
      }

      setIsRoadblockModalOpen(false);
      onResolved();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSubmittingRoadblock(false);
    }
  };

  const startCamera = async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (!videoRef.current) {
      setCameraError("Video element not ready. Please try again.");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "Your browser doesn't support camera access. Please upload an image.",
      );
      return;
    }

    try {
      setCameraError(null);
      setCameraLoading(true);

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: "environment" } },
        });
        setIsBackCamera(true);
      } catch (backError) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          setIsBackCamera(true);
        } catch (envError) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setIsBackCamera(false);
        }
      }

      if (!stream) throw new Error("No camera stream available");

      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current
          ?.play()
          .then(() => {
            setCameraActive(true);
            setCameraLoading(false);
          })
          .catch(() => {
            setCameraError("Could not start video playback");
            setCameraLoading(false);
          });
      };
    } catch (err) {
      setCameraLoading(false);
      setCameraActive(false);
      setCameraError("Could not access camera. Please try uploading.");
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
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) return;

      if (!isBackCamera) {
        context.scale(-1, 1);
        context.translate(-canvas.width, 0);
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (!isBackCamera) {
        context.setTransform(1, 0, 0, 1, 0, 0);
      }

      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedImage(dataUrl);
      stopCamera();
    } catch (err) {
      console.error("Error capturing image:", err);
      setCameraError("Failed to capture image.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setCapturedImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setCapturedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancelResolution = () => {
    setIsResolving(false);
    stopCamera();
    removeImage();
    setNote("");
    setShowReferenceImage(false);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!note.trim()) {
      alert("Please enter a resolution note.");
      return;
    }
    if (!capturedImage) {
      alert("Please provide a proof of work image.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("issue_id", issue.id.toString());
      formData.append("note", note);

      const proofFile = dataURLtoFile(capturedImage, "proof-of-work.jpg");
      if (proofFile) {
        formData.append("proof", proofFile);
      } else {
        throw new Error("Failed to process image file.");
      }

      const response = await fetch("/api/resolve-issue", {
        method: "POST",
        body: formData,
      });

      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        throw new Error(`Server returned invalid response.`);
      }

      if (!response.ok)
        throw new Error(data.error || "Failed to submit resolution");

      onResolved();
    } catch (error: any) {
      console.error("Error resolving issue:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <Card
        className={`relative overflow-hidden flex flex-col h-full dark:bg-black dark:border-gray-700 transition-all ${
          issue.appeal_count > 0
            ? "border-red-500 shadow-sm shadow-red-900/20"
            : ""
        }`}
      >
        {/* --- RED APPEAL BANNER --- */}
        {issue.appeal_count > 0 && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-sm">
              <AlertTriangle className="h-4 w-4" />
              Citizen Rejected Repair
            </div>
            <Badge variant="destructive" className="bg-red-600">
              {issue.appeal_count}{" "}
              {issue.appeal_count === 1 ? "Appeal" : "Appeals"}
            </Badge>
          </div>
        )}

        <div className="flex flex-col flex-grow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-muted-foreground">
                    #{issue.id}
                  </span>
                  {issue.flagged && <Flag className="h-4 w-4 text-red-500" />}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className={
                      STATUS_COLORS[issue.status] ||
                      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400"
                    }
                  >
                    {issue.status.replace("_", " ")}
                  </Badge>
                  {issue.tags?.map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={`border-gray-200 dark:border-gray-700 ${
                        CATEGORY_COLORS[tag] ||
                        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400"
                      }`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              {/* EYE ICON TO OPEN MODAL */}
              {(issue.images?.length > 0 ||
                issue.proof_of_work?.length > 0) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowImageOverlay(true)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-3 flex-grow">
            <p className="text-sm leading-relaxed dark:text-gray-300">
              {issue.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t dark:border-gray-700">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Reported: {formatTimeAgo(issue.created_at)}
              </div>
              {digiPin && (
                <div className="flex items-center hover:text-primary transition-colors">
                  <MapPin className="h-3 w-3 mr-1" />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 font-medium"
                  >
                    {digiPin}
                  </a>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="bg-muted/30 dark:bg-black flex flex-col items-stretch p-4">
            {!isResolving ? (
              <div className="flex gap-2 w-full">
                <Button
                  className="flex-1 gap-2"
                  onClick={() => setIsResolving(true)}
                >
                  <CheckCircle2 className="h-4 w-4" /> Resolve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => setIsRoadblockModalOpen(true)}
                >
                  <AlertOctagon className="h-4 w-4" /> Escalate
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleResolveSubmit}
                className="space-y-4 w-full animate-in fade-in slide-in-from-top-4"
              >
                {issue.images && issue.images.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-foreground">
                        Resolution Notes
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                        onClick={() =>
                          setShowReferenceImage(!showReferenceImage)
                        }
                      >
                        {showReferenceImage ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" /> Hide Original
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" /> View Original
                          </>
                        )}
                      </Button>
                    </div>

                    {showReferenceImage && (
                      <div className="relative h-40 w-full rounded-md border border-input overflow-hidden bg-black/5 dark:bg-white/5 animate-in zoom-in-95 duration-200">
                        <Image
                          src={issue.images[0].url || issue.images[0]}
                          alt="Before evidence"
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-contain bg-black/20"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  {!issue.images?.length && (
                    <label className="text-xs font-medium text-foreground">
                      Resolution Notes
                    </label>
                  )}
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Describe the actions taken..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    Proof of Work (Image)
                  </label>
                  <div className="border border-input bg-background rounded-md p-3">
                    {capturedImage ? (
                      <div className="relative w-full h-48 rounded-md overflow-hidden bg-black">
                        <img
                          src={capturedImage}
                          alt="Proof of Work"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        <div
                          className={`relative w-full overflow-hidden rounded-md bg-black transition-all duration-300 ${
                            cameraActive ? "h-48 sm:h-64" : "h-0"
                          }`}
                        >
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`absolute inset-0 w-full h-full object-cover ${
                              !isBackCamera ? "scale-x-[-1]" : ""
                            }`}
                          />
                        </div>

                        {cameraActive ? (
                          <div className="flex gap-2 justify-center">
                            <Button
                              type="button"
                              size="sm"
                              onClick={captureImage}
                              disabled={
                                !videoRef.current ||
                                videoRef.current.videoWidth === 0
                              }
                            >
                              <Camera className="h-4 w-4 mr-2" /> Capture
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={stopCamera}
                            >
                              Stop
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={startCamera}
                              disabled={cameraLoading}
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              {cameraLoading ? "Opening..." : "Camera"}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="h-4 w-4 mr-2" /> Upload
                            </Button>
                          </div>
                        )}

                        {cameraError && (
                          <p className="text-xs text-red-500 mt-2">
                            {cameraError}
                          </p>
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

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancelResolution}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                        Saving...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4 mr-2" /> Submit Proof
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardFooter>
        </div>
      </Card>

      <Dialog
        open={isRoadblockModalOpen}
        onOpenChange={setIsRoadblockModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertOctagon className="h-5 w-5" />
              Report Roadblock
            </DialogTitle>
            <DialogDescription>
              Escalate this issue to the Department Admin if you lack the
              budget, equipment, or jurisdiction to resolve it. This removes it
              from your active tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason for escalation <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="e.g., This requires a heavy excavator and city budget approval..."
                value={roadblockNote}
                onChange={(e) => setRoadblockNote(e.target.value)}
                rows={4}
              />
            </div>
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={submittingRoadblock || roadblockNote.trim().length < 10}
              onClick={handleRoadblockSubmit}
            >
              {submittingRoadblock ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                  Escalating...
                </>
              ) : (
                "Escalate to Admin"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- PROPER BEFORE & AFTER MODAL (FIXED CLOSE BUTTON) --- */}
      <Dialog open={showImageOverlay} onOpenChange={setShowImageOverlay}>
        <DialogContent className="max-w-5xl h-[85vh] md:h-[75vh] flex flex-col p-0 overflow-hidden bg-[#0a0a0a] border-gray-800 shadow-2xl">
          <DialogHeader className="p-5 border-b border-white/10 bg-black/60">
            <DialogTitle className="text-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-400" />
              Issue Evidence
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 w-full h-full flex flex-col md:flex-row p-6 gap-6 overflow-y-auto">
            {/* LEFT SIDE: BEFORE */}
            {issue.images && issue.images.length > 0 && (
              <div className="relative w-full min-h-[40vh] md:h-full flex-1 border border-white/10 rounded-xl overflow-hidden bg-black/50">
                <Badge className="absolute top-3 left-3 z-10 bg-black/80 text-white border-white/20 backdrop-blur-md">
                  Before (Reported)
                </Badge>
                <Image
                  src={issue.images[0].url || issue.images[0]}
                  alt="Original Issue evidence"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                  priority
                />
              </div>
            )}

            {/* RIGHT SIDE: AFTER */}
            {issue.proof_of_work && issue.proof_of_work.length > 0 && (
              <div className="relative w-full min-h-[40vh] md:h-full flex-1 border-2 border-green-500/50 rounded-xl overflow-hidden bg-black/50 shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)]">
                <Badge className="absolute top-3 left-3 z-10 bg-green-600 text-white border-green-400 shadow-lg">
                  After (Repaired)
                </Badge>
                <Image
                  src={issue.proof_of_work[0].image_url}
                  alt="Official Repair Proof"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                  priority
                />
                {issue.proof_of_work[0].notes && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pt-16">
                    <p className="text-sm text-white">
                      <span className="font-bold text-green-400">
                        Official Notes:{" "}
                      </span>
                      {issue.proof_of_work[0].notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {(!issue.images || issue.images.length === 0) &&
              (!issue.proof_of_work || issue.proof_of_work.length === 0) && (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-muted-foreground text-sm font-medium">
                    No images available.
                  </p>
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </>
  );
}
