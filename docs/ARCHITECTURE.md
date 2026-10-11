# Architecture

## Overview

JanSamwaad is a Next.js App Router application. The same application serves the user interface and server-side API routes. Supabase provides authentication, PostgreSQL, PostGIS functions, and object storage.

## Request path

1. A browser loads a page or interactive component.
2. The UI calls a Next.js Route Handler under `app/api/`.
3. The handler reads the user's Supabase session when required.
4. The handler validates input and checks the user's role for protected actions.
5. Data access uses either the session-aware Supabase client or a server-side admin client.
6. PostgreSQL constraints, RLS policies, indexes, and PostGIS functions support persistence and spatial queries.
7. The handler returns JSON to the client.

## Main modules

| Path | Responsibility |
|---|---|
| `app/` | App Router pages and route handlers |
| `app/api/issues/` | Citizen issue operations |
| `app/api/admin/` | Administration and official workflows |
| `app/api/resolve-issue/` | Resolution proof upload and status update |
| `components/` | Reusable UI and map components |
| `lib/supabase/` | Supabase client creation |
| `lib/` | Shared helpers, including spam filtering |
| `supabase/` | SQL schemas and migrations |
| `scripts/` | Database setup, diagnostics, and verification scripts |

## Core data flow

### Issue submission and department routing

```text
Citizen
  -> POST /api/issues
  -> Verify Supabase user
  -> Check suspension, rate, and spam rules
  -> Insert issue
  -> Insert optional image URLs
  -> route_issue_by_point(longitude, latitude)
  -> Insert department assignment when a region matches
```

Routing depends on valid region polygons and the department mappings in the database. If no region contains the point, automatic assignment may not occur.

### Nearby search

```text
Map UI
  -> GET /api/issues/near?lat=...&lng=...&radius=...
  -> issues_nearby(in_lng, in_lat, in_radius_m)
  -> PostGIS distance query
  -> JSON issue results
```

The SQL schema creates a spatial index on the issue geography column. Verify that the deployed database has the expected function and index.

### Official status update

```text
Official UI
  -> PUT /api/admin/issues/{id}/status
  -> Verify user session and role
  -> Update issue status
  -> Insert status-history entry
  -> Optionally update assignment
  -> Return updated issue
```

### Proof of resolution

The resolution route uploads an image to the `proofs` Storage bucket, writes a proof-of-work record, closes the issue, and records the transition. These writes are separate operations. They are not one database transaction, so a failed step can leave partial state.

## Authentication and privilege boundaries

- Supabase Auth identifies users.
- The `profiles` table stores application roles and related profile data.
- Session-aware clients should be used for normal user operations.
- Admin clients use the service-role key and bypass RLS. Use them only on the server and only after explicit authorization checks.
- Database RLS is a second control layer. It must be tested against the deployed schema.

## Geospatial model

The main SQL schema uses PostGIS:

- `issues.geom`: generated geography point based on longitude and latitude.
- `regions.boundary`: polygon geometry for a geographic region.
- `issues_nearby`: returns issues within a radius.
- `route_issue_by_point`: finds a containing region and its department.

The schema includes GiST indexes for spatial lookups. Department routing requires valid polygon data in SRID 4326.

## Reliability boundaries

Current application operations can span multiple database writes and Storage calls. Important examples are issue plus image insertion and resolution proof plus status history. For production use, consider database RPC functions or transactions for workflows that must succeed or fail as one unit. Add idempotency for retryable uploads and status transitions.
