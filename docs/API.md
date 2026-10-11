# API Reference

JanSamwaad uses Next.js Route Handlers under `app/api/`. The list below documents the main routes found in the repository. Request and response details can change with source updates. Use the route handler as the final source of truth.

Base URL for local development: `http://localhost:3000`.

## Issue routes

### `POST /api/issues`

Creates a civic issue. Requires an authenticated Supabase user.

JSON body fields used by the handler:

```json
{
  "description": "Damaged footpath near the bus stop",
  "latitude": 19.0001,
  "longitude": 72.0001,
  "tags": ["footpath", "safety"],
  "flagged": false,
  "images": []
}
```

The route validates the description and coordinate types, checks suspension and submission frequency, applies spam filtering, inserts the issue and optional image URLs, and attempts department routing through the `route_issue_by_point` RPC.

Success response:

```json
{ "id": 123 }
```

Possible errors include `401 Unauthorized`, `403` for a suspended account, `400` for invalid input or database insertion failure, `429` for submission frequency, and `406` for a spam rejection.

### `GET /api/issues`

Returns recent issues. Optional query parameters:

- `limit`: maximum number of records; defaults to 50.
- `status`: filter by status. The value `all` disables the filter.

The response includes related image, vote, department, and status-history data. The handler normalizes the vote count into `vote_count`.

### `GET /api/issues/near?lat={latitude}&lng={longitude}&radius={metres}`

Returns reports near a point through the Supabase `issues_nearby` RPC.

- `lat`: latitude.
- `lng`: longitude.
- `radius`: radius in metres; defaults to 300.

The route checks that latitude and longitude are finite numbers. Add range checks and a maximum radius at the server boundary before exposing this route to untrusted traffic.

### `GET /api/issues/my`

Returns reports for the authenticated user. Supports:

- `page`: page number, default 1.
- `limit`: page size, default 6.
- `status`: optional status filter.

The response contains `data` and `meta` fields. Unauthenticated requests return `401`.

### Other citizen routes

| Route | Purpose |
|---|---|
| `GET /api/issues/public` | Public issue data |
| `GET /api/issues/map` | Map data |
| `GET /api/issues/assigned` | Assigned issues for an official |
| `POST /api/issues/[id]/vote` | Vote on an issue |
| `POST /api/issues/[id]/appeal` | Submit an appeal |
| `POST /api/issues/[id]/roadblock` | Report a roadblock |

Read each handler for its exact HTTP method, payload, and authorization requirements.

## Administration routes

| Route | Purpose |
|---|---|
| `GET /api/admin/issues` | List issues; supports department and status filters |
| `PUT /api/admin/issues/[id]/status` | Update issue status and optionally assign department or official |
| `GET /api/admin/stats` | Administrative summary data |
| `/api/admin/departments` | Department management |
| `/api/admin/departments/[id]/categories` | Department category management |
| `/api/admin/officials` | Official management |
| `/api/admin/users` | User administration |
| `/api/admin/invite` and `/api/admin/invite-official` | Invitation flows |
| `/api/admin/announcements` | Create or manage announcements |

Some handlers use different HTTP methods. Check the relevant `route.ts` file before calling them.

### Update issue status

`PUT /api/admin/issues/{id}/status` expects a JSON body with a valid status. Current accepted status values are:

- `active`
- `under_progress`
- `under_review`
- `closed`

The handler checks that the signed-in profile has the `admin` or `official` role. It updates the issue and attempts to write a status-history record. Optional fields include `notes`, `department_id`, and `assignee_id`.

## Resolution proof

### `POST /api/resolve-issue`

Accepts `multipart/form-data` with:

- `issue_id`: issue identifier.
- `proof`: image file.
- `note`: optional resolution notes.

The route uploads the file to the Supabase Storage bucket named `proofs`, inserts a proof-of-work record, changes the issue status to `closed`, and writes status history. It requires an authenticated user. Verify official-role enforcement and Storage bucket policies before production use.

## Not found

The catch-all API route returns a structured `404` response for unmatched API paths. The response refers to `/openapi.json` and `/docs`; verify that these endpoints exist in the deployed version before relying on them.

## Authentication and errors

Most private routes use the Supabase server client and call `auth.getUser()`. A valid browser session is normally sent through the Supabase SSR cookies. Some endpoints are public reads; do not assume all routes require authentication.

Common HTTP statuses:

| Status | Meaning |
|---|---|
| `200` | Request completed |
| `400` | Invalid input or database operation failed |
| `401` | Authentication required |
| `403` | Authenticated user lacks permission or is suspended |
| `404` | Resource or API route not found |
| `429` | Submission rate limit reached |
| `500` | Server-side operation failed |

This file is a practical route guide. It is not a formal OpenAPI specification.
