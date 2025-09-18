"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

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

export default function LeafletMap({
  issues,
  mapCenter,
  createCustomIcon,
}: {
  issues: Issue[];
  mapCenter: [number, number];
  createCustomIcon: (status: string, flagged?: boolean) => L.DivIcon | null;
}) {
  return (
    <MapContainer
      center={mapCenter}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      className="rounded-b-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {issues.map((issue) => (
        <Marker
          key={issue.id}
          position={[issue.latitude, issue.longitude]}
          icon={createCustomIcon(issue.status, issue.flagged) || undefined}
        >
          <Popup>
            <div className="text-sm space-y-1">
              <p>
                <strong>Status:</strong> {issue.status}
              </p>
              <p>
                <strong>Description:</strong> {issue.description}
              </p>
              <p>
                <strong>Votes:</strong> {issue.vote_count ?? 0}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(issue.created_at).toLocaleString()}
              </p>
              {issue.tags && issue.tags.length > 0 && (
                <p>
                  <strong>Tags:</strong> {issue.tags.join(", ")}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
