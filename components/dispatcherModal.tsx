// "use client";

// import { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { UserCheck, MapPin, BarChart3, Loader2 } from "lucide-react";
// import { ScrollArea } from "@/components/ui/scroll-area";

// type Official = {
//   id: string;
//   name: string;
//   region: string;
//   workload: number;
// };

// interface DispatcherModalProps {
//   issueId: number;
//   departmentId: number;
//   departmentName: string;
//   // Add coordinates props
//   lat: number;
//   lng: number;
//   onAssign: () => void;
// }

// // export default function DispatcherModal({
// //   issueId,
// //   departmentId,
// //   departmentName,
// //   onAssign,
// // }: DispatcherModalProps) {
// //   const [open, setOpen] = useState(false);
// //   const [officials, setOfficials] = useState<Official[]>([]);
// //   const [loading, setLoading] = useState(false);
// //   const [assigning, setAssigning] = useState<string | null>(null);

// //   useEffect(() => {
// //     if (open) {
// //       fetchOfficials();
// //     }
// //   }, [open]);

// //   const fetchOfficials = async () => {
// //     setLoading(true);
// //     try {
// //       const res = await fetch(
// //         `/api/admin/officials?departmentId=${departmentId}`,
// //       );
// //       if (res.ok) setOfficials(await res.json());
// //     } finally {
// //       setLoading(false);
// //     }
// //   };
// export default function DispatcherModal({
//   issueId,
//   departmentId,
//   departmentName,
//   lat,
//   lng,
//   onAssign,
// }: DispatcherModalProps) {
//   const [open, setOpen] = useState(false);
//   const [officials, setOfficials] = useState<any[]>([]);
//   const [detectedRegion, setDetectedRegion] = useState<string>("Detecting...");
//   const [assigning, setAssigning] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (open) {
//       detectRegionAndFetch();
//     }
//   }, [open]);

//   const detectRegionAndFetch = async () => {
//     setLoading(true);
//     let regionName = "All";

//     try {
//       // 1. REVERSE GEOCODING (Using OpenStreetMap free API)
//       // Note: In production, cache this or store it in the DB to avoid rate limits
//       const geoRes = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
//       );
//       const geoData = await geoRes.json();

//       // Extract specific location: Suburb > Village > Town
//       regionName =
//         geoData.address.suburb ||
//         geoData.address.village ||
//         geoData.address.town ||
//         "Unknown";
//       setDetectedRegion(regionName);
//     } catch (e) {
//       console.error("Geocoding failed", e);
//       setDetectedRegion("Unknown Location");
//     }

//     // 2. FETCH OFFICIALS FOR THIS REGION
//     try {
//       // Pass the detected region to our backend
//       const res = await fetch(
//         `/api/admin/officials?departmentId=${departmentId}&region=${regionName}`,
//       );
//       const data = await res.json();
//       setOfficials(data);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleAssign = async (officialId: string) => {
//     setAssigning(officialId);
//     try {
//       await fetch(`/api/admin/issues/${issueId}/assign`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ assignee_id: officialId }),
//       });
//       setOpen(false);
//       onAssign(); // Refresh the dashboard
//     } catch (error) {
//       console.error("Assignment failed", error);
//     } finally {
//       setAssigning(null);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <Button
//           variant="outline"
//           size="sm"
//           className="h-8 border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
//         >
//           <UserCheck className="h-3.5 w-3.5 mr-2" />
//           Assign
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle>Assign Issue #{issueId}</DialogTitle>
//           <div className="flex gap-2 text-sm text-muted-foreground mt-1">
//             <span>Dept: {departmentName}</span>
//             <span>•</span>
//             {/* Show the detected region so the admin knows why these people are shown */}
//             <span className="text-blue-400"> {detectedRegion}</span>
//           </div>
//         </DialogHeader>

//         <ScrollArea className="max-h-[60vh] pr-4">
//           <div className="space-y-2 mt-2">
//             {loading ? (
//               <Loader2 className="animate-spin mx-auto" />
//             ) : officials.length === 0 ? (
//               <div className="text-center py-6 space-y-3">
//                 <p className="text-muted-foreground">
//                   No officials found in <strong>{detectedRegion}</strong>.
//                 </p>
//                 <Button
//                   variant="secondary"
//                   onClick={() => {
//                     // Re-fetch without the region parameter
//                     fetch(`/api/admin/officials?departmentId=${departmentId}`)
//                       .then((r) => r.json())
//                       .then(setOfficials);
//                     setDetectedRegion("All Regions");
//                   }}
//                 >
//                   Show All Department Officials
//                 </Button>
//               </div>
//             ) : (
//               officials.map((official) => (
//                 <div
//                   key={official.id}
//                   className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
//                   onClick={() => handleAssign(official.id)}
//                 >
//                   <div className="space-y-1">
//                     <p className="font-medium leading-none">{official.name}</p>
//                     <div className="flex items-center text-xs text-muted-foreground gap-3">
//                       <span className="flex items-center gap-1">
//                         <MapPin className="h-3 w-3" />
//                         {official.region}
//                       </span>
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-4">
//                     <div className="text-right">
//                       <div
//                         className={`text-xs font-medium ${
//                           official.workload > 10
//                             ? "text-red-500 font-bold"
//                             : "text-green-500"
//                         }`}
//                       >
//                         {official.workload} Active Issues
//                         {official.workload > 10 && (
//                           <span className="ml-1">⚠️ Overloaded</span>
//                         )}
//                       </div>
//                       <p className="text-[10px] text-muted-foreground">
//                         Workload
//                       </p>
//                     </div>
//                     <Button
//                       size="sm"
//                       disabled={!!assigning}
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleAssign(official.id);
//                       }}
//                     >
//                       {assigning === official.id ? (
//                         <Loader2 className="h-4 w-4 animate-spin" />
//                       ) : (
//                         "Select"
//                       )}
//                     </Button>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </ScrollArea>
//       </DialogContent>
//     </Dialog>
//   );
// }

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
import { UserCheck, MapPin, Loader2, AlertCircle } from "lucide-react"; // Added AlertCircle
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [assigning, setAssigning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      console.log("📍 Modal Opened. Coords:", lat, lng); // Debug Log 1
      detectRegionAndFetch();
    }
  }, [open]);

  const detectRegionAndFetch = async () => {
    setLoading(true);
    let regionName = "All";

    // 1. CHECK COORDINATES VALIDITY
    if (!lat || !lng) {
      console.warn("⚠️ Coordinates missing for issue #" + issueId);
      setDetectedRegion("Location Not Provided");
      // Fallback: Just fetch all officials without region filter
      fetchOfficials("All");
      return;
    }

    try {
      // 2. REVERSE GEOCODING
      // Use our local proxy to avoid CSP/CORS errors
      const url = `/api/external/geocode?lat=${lat}&lon=${lng}`;
      console.log("🌍 Fetching address from:", url); // Debug Log 2

      const geoRes = await fetch(url);

      if (!geoRes.ok) throw new Error(`Nominatim API Error: ${geoRes.status}`);

      const geoData = await geoRes.json();
      console.log("📬 GeoData received:", geoData); // Debug Log 3

      if (geoData.error) throw new Error(geoData.error);

      const addr = geoData.address || {};

      // MORE ROBUST FIELD CHECKING
      // Prioritize smaller localities, then districts, then city
      regionName =
        addr.neighbourhood ||
        addr.suburb ||
        addr.residential ||
        addr.village ||
        addr.town ||
        addr.city_district ||
        addr.city ||
        "Unknown";

      console.log("✅ Detected Region Name:", regionName); // Debug Log 4
      setDetectedRegion(regionName);
    } catch (e) {
      console.error("❌ Geocoding failed:", e);
      setDetectedRegion("Unknown Location");
      regionName = "All"; // Fallback to fetching everyone if geo fails
    }

    // 3. FETCH OFFICIALS
    await fetchOfficials(regionName);
  };

  const fetchOfficials = async (region: string) => {
    try {
      const url = `/api/admin/officials?departmentId=${departmentId}&region=${region}`;
      console.log("👥 Fetching officials from:", url); // Debug Log 5

      const res = await fetch(url);
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
          <div className="flex gap-2 text-sm text-muted-foreground mt-1 items-center">
            <Badge variant="outline">{departmentName}</Badge>
            <span>•</span>
            <span className="flex items-center gap-1 text-blue-400">
              <MapPin className="h-3 w-3" />
              {detectedRegion}
            </span>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-2 mt-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-xs">Locating area & finding experts...</p>
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
                        {official.region || "General Region"}
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
