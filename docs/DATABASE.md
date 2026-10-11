# Database and Supabase Setup

## Before you start

The repository contains multiple schema files and migrations. They may represent different iterations of the data model. Do not run every SQL file in order without review.

Files include:

- `supabase/schema.sql`
- `supabase/schema-fixed.sql`
- `supabase/schema-simple.sql`
- `supabase/admin-schema.sql`
- `supabase/department-schema.sql`
- `supabase/migrations/`
- `supabase/proof-of-work.sql`

Check the current route handlers and their table/column references. Select one compatible baseline, then apply only the migrations required for that baseline.

## Suggested setup sequence

1. Create a development Supabase project.
2. Open the SQL Editor.
3. Read the selected schema file from top to bottom.
4. Check whether it enables PostGIS, creates required enums, tables, triggers, policies, indexes, and RPC functions.
5. Apply the baseline schema.
6. Apply only the required migrations in their intended order.
7. Add required seed data for departments and region polygons.
8. Configure Auth providers and redirect URLs.
9. Create Storage buckets used by the code, including `proofs` for proof-of-work uploads.
10. Test each route with a citizen, official, administrator, and unauthenticated session.

## Core tables

The primary schema defines or references these entities:

| Table | Purpose |
|---|---|
| `profiles` | Application profile and role linked to Supabase Auth |
| `issues` | Civic issue description, location, status, and reporter |
| `issue_images` | Image URLs attached to an issue |
| `votes` | Votes or support for an issue |
| `assignments` | Department and official assignment |
| `status_history` | Audit trail for status changes |
| `departments` | Municipal or service departments |
| `regions` | Polygon boundaries mapped to departments |
| `proof_of_work` | Resolution evidence referenced by application routes |

The final table set depends on the schema variant selected. For example, some files may not include all tables used by the current app. Resolve these differences before deployment.

## PostGIS functions

### `issues_nearby(in_lng, in_lat, in_radius_m)`

Returns issues within the requested radius. The coordinates are longitude first, then latitude. The radius is in metres.

### `route_issue_by_point(in_lng, in_lat)`

Finds a region that contains the point and returns its region and department IDs. The route handler uses this result to create an assignment.

Ensure region polygons are valid, use SRID 4326, and map to existing department IDs.

## Row-level security

Review every RLS policy. At minimum, test:

- Public reads of fields intended to be public.
- Authenticated issue insertion for the current reporter.
- User access to their own profile and reports.
- Official/admin issue updates.
- Image and vote insertion rules.
- Assignment and status-history visibility.
- Admin operations that use a service-role client.

A server-side service-role client bypasses RLS. Route-level authorization is still required for each privileged operation.

## Storage

The resolution route uploads to a bucket named `proofs` and creates a public URL. Confirm that the bucket exists and that its access policy matches the privacy requirements. If evidence must not be public, use private objects and signed URLs instead.

## Schema validation checklist

Before deployment, confirm:

- Every table and column referenced by the TypeScript code exists.
- Enum values match the values accepted by route handlers.
- Foreign keys and unique constraints match expected behaviour.
- RPC function names and argument names match the caller.
- Storage bucket names match the code.
- RLS policies are enabled and tested.
- The SQL scripts can be applied to a clean development project.
- Migrations do not duplicate or conflict with baseline schema definitions.
