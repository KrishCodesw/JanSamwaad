import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { error: { code: "API_NOT_FOUND", message: "The requested API endpoint does not exist.", hint: "See /openapi.json or /docs for the supported JanSamvaad API surface." } },
    { status: 404 }
  );
}

export function POST() {
  return NextResponse.json(
    { error: { code: "API_NOT_FOUND", message: "The requested API endpoint does not exist.", hint: "See /openapi.json or /docs for the supported JanSamvaad API surface." } },
    { status: 404 }
  );
}

export function PUT() { return GET(); }
export function PATCH() { return GET(); }
export function DELETE() { return GET(); }
export function OPTIONS() { return GET(); }
