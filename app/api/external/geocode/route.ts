import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Latitude and Longitude required" },
      { status: 400 }
    );
  }

  try {
    // Nominatim requires a User-Agent header
    const externalRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          "User-Agent": "JanSamwaad-Civic-App/1.0",
        },
      }
    );

    if (!externalRes.ok) {
      throw new Error(`OpenStreetMap API error: ${externalRes.status}`);
    }

    const data = await externalRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Geocoding proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch location data" },
      { status: 500 }
    );
  }
}