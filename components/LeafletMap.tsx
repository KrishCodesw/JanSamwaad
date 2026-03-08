"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { ThumbsUp, LocateFixed } from "lucide-react";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const pulseCss = `
  @keyframes map-pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(var(--pulse-color), 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(var(--pulse-color), 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(var(--pulse-color), 0); }
  }
  .marker-pin {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 3px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 3px 6px rgba(0,0,0,0.4);
  }
  .marker-pulse {
    animation: map-pulse 2s infinite;
  }
  /* Removes the default transparent background Leaflet adds to divIcons */
  .custom-cluster-icon {
    background: transparent;
  }
`;

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = pulseCss;
  document.head.appendChild(style);
}

function MapResizeUpdater({ isExpanded }: { isExpanded: boolean }) {
  const map = useMap();

  useEffect(() => {
    // Wait for the CSS transition (300ms) to finish before recalculating
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [isExpanded, map]);

  return null;
}

const mapPinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`;

const createCustomIcon = (issue: Issue) => {
  let colorHex = "#3b82f6";
  let pulseRgb = "59, 130, 246";

  if (issue.status === "under_progress") {
    colorHex = "#f59e0b";
    pulseRgb = "245, 158, 11";
  } else if (issue.status === "closed") {
    colorHex = "#10b981";
    pulseRgb = "16, 185, 129";
  }

  if (issue.flagged) {
    colorHex = "#ef4444";
    pulseRgb = "239, 68, 68";
  }

  const isHotIssue =
    issue.flagged || (issue.vote_count && issue.vote_count > 10);
  const pulseClass = isHotIssue ? "marker-pulse" : "";

  return L.divIcon({
    html: `
      <div 
        class="marker-pin ${pulseClass}" 
        style="background-color: ${colorHex}; --pulse-color: ${pulseRgb};"
      >
        ${mapPinSvg}
      </div>
    `,
    className: "bg-transparent border-0",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// --- NEW: Highly visible custom cluster icons ---
const createClusterCustomIcon = function (cluster: any) {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `
      <div style="
        background-color: #0f172a; /* Slate 900 */
        color: white; 
        width: 40px; 
        height: 40px; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-weight: 800; 
        font-size: 15px;
        border: 3px solid white; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.4);
      ">
        ${count}
      </div>
    `,
    className: "custom-cluster-icon",
    iconSize: L.point(40, 40, true),
  });
};

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

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
      const currentCenter = map.getCenter();
      if (currentCenter.lat !== center[0] || currentCenter.lng !== center[1]) {
        map.flyTo(center, map.getZoom(), { animate: true, duration: 1.5 });
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [center, map]);
  return null;
}

function LocateControl() {
  const map = useMap();
  const locateUser = () => {
    map.locate().on("locationfound", function (e) {
      map.flyTo(e.latlng, 15);
    });
  };

  return (
    <div className="leaflet-top leaflet-right mt-16 mr-2 z-[400]">
      <div className="leaflet-control leaflet-bar shadow-md">
        <button
          onClick={(e) => {
            e.preventDefault();
            locateUser();
          }}
          className="bg-white  flex items-center justify-center hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors rounded-sm"
          title="Find my location"
          aria-label="Find my location"
        >
          <LocateFixed className="w-full" />
        </button>
      </div>
    </div>
  );
}

type LeafletMapProps = {
  issues: Issue[];
  mapCenter: [number, number];
  onIssueAction?: (issueId: number, action: "upvote") => void;
  isExpanded?: boolean;
};

export default function LeafletMap({
  issues,
  mapCenter,
  isExpanded = false,
  onIssueAction,
}: LeafletMapProps) {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={mapCenter}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        className="rounded-b-lg z-0"
      >
        <MapUpdater center={mapCenter} />
        <MapResizeUpdater isExpanded={isExpanded} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocateControl />

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={40}
          iconCreateFunction={createClusterCustomIcon} // <-- Applied the new custom cluster logic here
        >
          {issues.map((issue) => (
            <Marker
              key={issue.id}
              position={[issue.latitude, issue.longitude]}
              icon={createCustomIcon(issue)}
            >
              <Popup className="rounded-lg shadow-lg">
                <div className="text-sm space-y-2 p-1 min-w-[200px]">
                  <div className="flex justify-between items-start">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-semibold text-white ${
                        issue.flagged ? "bg-red-500" : "bg-blue-500"
                      }`}
                    >
                      {issue.status.replace("_", " ").toUpperCase()}
                    </span>
                    <span className="text-slate-600 text-xs font-bold flex items-center gap-1.5">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {issue.vote_count ?? 0}
                    </span>
                  </div>

                  <p className="font-semibold mt-2 leading-tight text-slate-900">
                    {issue.description}
                  </p>

                  <p className="text-xs text-slate-500 font-medium">
                    {new Date(issue.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>

                  {/* <div className="pt-3 border-t mt-2">
                    <button
                      onClick={() => onIssueAction?.(issue.id, "upvote")}
                      className="w-full bg-slate-100 text-slate-800 py-1.5 rounded-md text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      Upvote
                    </button>
                  </div> */}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
