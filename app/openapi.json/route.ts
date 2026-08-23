import { NextResponse } from "next/server";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "JanSamvaad Public API",
    version: "1.0.0",
    description: "Machine-readable API description for JanSamvaad civic issue discovery and reporting.",
  },
  servers: [{ url: process.env.NEXT_PUBLIC_SITE_URL || "https://jansamwaad.vercel.app" }],
  paths: {
    "/api/issues": {
      get: {
        summary: "List public civic issues",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
          { name: "status", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Public issue list", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Issue" } } } } },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      post: {
        summary: "Report a civic issue",
        security: [{ supabaseSession: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateIssue" } } } },
        responses: {
          "200": { description: "Issue created" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { description: "Account suspended" },
          "429": { description: "Rate limited" },
        },
      },
    },
  },
  components: {
    securitySchemes: { supabaseSession: { type: "http", scheme: "bearer", description: "Authenticated JanSamvaad/Supabase session token." } },
    schemas: {
      Issue: { type: "object", properties: { id: { type: "string" }, description: { type: "string" }, latitude: { type: "number" }, longitude: { type: "number" }, status: { type: "string" }, created_at: { type: "string", format: "date-time" } } },
      CreateIssue: { type: "object", required: ["description", "latitude", "longitude"], properties: { description: { type: "string" }, latitude: { type: "number" }, longitude: { type: "number" }, tags: { type: "array", items: { type: "string" } }, images: { type: "array", items: { type: "string", format: "uri" } } } },
      Error: { type: "object", required: ["error"], properties: { error: { type: "object", required: ["code", "message", "hint"], properties: { code: { type: "string" }, message: { type: "string" }, hint: { type: "string" } } } } },
    },
    responses: {
      BadRequest: { description: "Invalid request", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      Unauthorized: { description: "Authentication required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      InternalError: { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
    },
  },
};

export function GET() {
  return NextResponse.json(spec, { headers: { "Cache-Control": "public, max-age=3600" } });
}
