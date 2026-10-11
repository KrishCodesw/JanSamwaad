<div align="center">

# JanSamwaad

**Civic Infrastructure Reporting and Resolution Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![PostGIS](https://img.shields.io/badge/PostGIS-Spatial_Data-336791?logo=postgresql)](https://postgis.net/)

[Live Demo](https://jansamwaad.vercel.app) · [Issues](https://github.com/KrishCodesw/JanSamwaad/issues)

</div>

JanSamwaad is a civic technology platform for reporting, locating, tracking, and resolving local infrastructure problems. Citizens can submit issues with descriptions and coordinates. Public users can discover reports in an area. Officials can manage issue status, assignments, and resolution evidence.

> **Project status:** Active development. Review the deployment and security notes before using the system for real public-service workflows. The live demo may differ from the current source.

## Contents

- [Main capabilities](#main-capabilities)
- [Technology stack](#technology-stack)
- [System architecture](#system-architecture)
- [Requirements](#requirements)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Run and build](#run-and-build)
- [Application workflows](#application-workflows)
- [API overview](#api-overview)
- [Repository layout](#repository-layout)
- [Testing and quality checks](#testing-and-quality-checks)
- [Deployment](#deployment)
- [Security and operational notes](#security-and-operational-notes)
- [Known limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)

## Main capabilities

### Citizen reporting
- Submit civic issues with a description and geographic coordinates.
- Attach image URLs to reports.
- View public issues and filter by status.
- Find nearby issues with a radius-based geospatial query.
- View personal reports and their status history.
- Vote for issues and submit an appeal or roadblock report where supported by the API.

### Official and administrator workflows
- View issue queues and filter by department or status.
- Assign issues to departments and officials.
- Update issue status and record status history.
- Upload proof-of-work evidence when an official reports an issue as resolved.
- Manage departments, categories, officials, invitations, announcements, and administrative data through protected routes.

### Abuse controls
- Apply text-based spam filtering to issue descriptions.
- Limit rapid submissions.
- Add spam strikes and suspend accounts after repeated violations.

### Geospatial routing
- Use PostgreSQL with PostGIS to find nearby reports.
- Use region polygons to route an issue to a mapped department.
- Use spatial indexes to support geographic queries.

## Technology stack

| Area | Technology |
|---|---|
| Web framework | Next.js 15 App Router |
| UI | React 19, Tailwind CSS, Radix UI components |
| Language | TypeScript |
| Database | Supabase PostgreSQL |
| Geospatial queries | PostGIS |
| Authentication | Supabase Auth and `@supabase/ssr` |
| Maps | MapLibre GL, React Leaflet, React Map GL |
| Geographic identifiers | `@pranamphd/digipin` |
| Charts | Recharts |
| Deployment | Vercel configuration and Dockerfile |
| Automation | GitHub Actions |

See `package.json` for the exact dependency versions.

## System architecture

```text
Browser
  |
  v
Next.js App Router (pages and UI components)
  |
  +--> Next.js Route Handlers (/app/api/**)
  |       |
  |       +--> Supabase server client (user session / RLS)
  |       +--> Supabase admin client (privileged server operations)
  |       +--> PostGIS RPC functions (nearby search and region routing)
  |
  v
Supabase
  +--> Auth users and application profiles
  +--> Issues, images, votes, assignments, status history
  +--> Departments, regions, proof of work and admin data
  +--> Storage buckets for uploaded evidence
```

The app uses Next.js route handlers for backend operations. Supabase provides identity, database access, row-level security (RLS), geospatial functions, and object storage. Server-only admin operations use the service-role key. That key must never be exposed to browser code.

More details are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Requirements

- Node.js 22 or a compatible Node.js version for the current Docker setup.
- npm and Git.
- A Supabase project.
- Access to the Supabase SQL Editor and project API settings.
- A modern browser for the map interface.

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/KrishCodesw/JanSamwaad.git
cd JanSamwaad
```

### 2. Install dependencies

```bash
npm ci
```

Use `npm install` if you do not have a current lockfile or need to update dependencies intentionally.

### 3. Configure environment variables

Copy the checked-in example file:

**macOS/Linux**
```bash
cp .env.local.example .env.local
```

**Windows PowerShell**
```powershell
Copy-Item .env.local.example .env.local
```

Set the values from your Supabase project. See [Environment variables](#environment-variables). Do not commit `.env.local` or real secrets.

### 4. Configure Supabase

1. Create or select a Supabase project.
2. Open the SQL Editor.
3. Review the schema files in `supabase/` before running any script.
4. Apply the schema and migrations required by the current application.
5. Enable the required authentication methods.
6. Create and configure the Storage buckets used by the app, including `proofs` if you use the resolution upload workflow.
7. Add department and region boundary data if you want automatic geographic routing.

**Important:** The repository contains several schema variants and migrations. Do not run every SQL file in sequence without reviewing them. Start with [docs/DATABASE.md](docs/DATABASE.md) and verify the schema expected by the current code.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

The repository includes `.env.local.example`. The main variables are:

| Variable | Use | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key | Public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Public key name used by some server routes | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server-side database operations | **Secret** |
| `NEXT_PUBLIC_BASE_URL` | Base URL used by deployment/build configuration where needed | Public |

Set the public key variables consistently to the publishable/anon key from your Supabase project. Some source files use different variable names, so check the code path you are running.

Never prefix a secret with `NEXT_PUBLIC_`. Next.js can embed variables with this prefix into browser bundles. Never commit a service-role key.

## Database setup

The `supabase/` directory contains SQL schemas, admin and department schema files, and migrations. The main schema uses PostGIS and defines core entities such as:

- `profiles`
- `issues`
- `issue_images`
- `votes`
- `assignments`
- `status_history`
- `departments`
- `regions`

The application also uses related tables for proof of work and administration. Their exact definitions can differ between schema variants. Confirm that the deployed schema matches the queries in `app/api/`.

Read [docs/DATABASE.md](docs/DATABASE.md) before applying SQL.

## Run and build

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Start the production server after a successful build:

```bash
npm run start
```

Run the repository's agent-readiness check:

```bash
npm run test:agent
```

The current `lint` script is `next lint`. Next.js 15 setups can differ in lint command support. If it fails, use the configured ESLint CLI and review the installed versions. Do not treat a successful build alone as proof that all workflows work.

## Application workflows

### Submit and route an issue
1. A citizen signs in.
2. The client sends a description, latitude, longitude, tags, and optional image URLs to `POST /api/issues`.
3. The server checks the session, suspension state, submission rate, and spam rules.
4. The server inserts the issue and image records.
5. The `route_issue_by_point` PostGIS RPC finds a containing region and department.
6. The server creates an assignment when a matching region exists.

### Find nearby reports
The client calls `GET /api/issues/near?lat=...&lng=...&radius=...`. The route calls the `issues_nearby` database function. The radius is in metres.

### Process and resolve an issue
1. An official or administrator views the management queue.
2. An authorized official updates the status and may assign a department or assignee.
3. Status changes are recorded in `status_history`.
4. The resolution workflow accepts a proof image and notes, writes proof-of-work data, and changes the issue status to `closed`.

See [docs/API.md](docs/API.md) for route details.

## API overview

The backend is implemented with Next.js Route Handlers under `app/api/`. Main route groups include:

| Route group | Purpose |
|---|---|
| `/api/issues` | Create and list issues |
| `/api/issues/near` | Geographic radius search |
| `/api/issues/my` | Current user's reports |
| `/api/issues/public` | Public issue data |
| `/api/issues/map` | Map-oriented issue data |
| `/api/issues/[id]/vote` | Vote on an issue |
| `/api/issues/[id]/appeal` | Appeal a status or resolution |
| `/api/issues/[id]/roadblock` | Report a resolution roadblock |
| `/api/admin/issues` | Admin issue queue |
| `/api/admin/issues/[id]/status` | Update status and assignment |
| `/api/admin/departments` | Department management |
| `/api/admin/officials` | Official management |
| `/api/admin/announcements` and `/api/announcements` | Announcements |
| `/api/resolve-issue` | Upload proof and close an issue |

This table is a route-group summary, not a complete OpenAPI contract. Read the route handlers for the current request and response schemas. See [docs/API.md](docs/API.md).

## Repository layout

```text
JanSamwaad/
├── app/
│   ├── api/                 # Next.js backend route handlers
│   ├── admin/               # Administrative pages
│   ├── about/               # About page
│   ├── issues/              # Issue pages
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── components/              # Reusable UI and map components
├── lib/                     # Supabase clients and shared helpers
├── public/                  # Static assets
├── scripts/                 # Database and verification utilities
├── supabase/                # SQL schemas and migrations
├── .github/workflows/       # CI and repository automation
├── .env.local.example       # Environment variable template
├── Dockerfile               # Container build
├── package.json             # Dependencies and commands
├── vercel.json              # Vercel function and header configuration
└── docs/                    # Project documentation
```

Some folders contain additional modules. Use the repository tree as the authoritative file list.

## Testing and quality checks

Run the checks relevant to your change:

```bash
npm run build
npm run test:agent
```

Also test the relevant flow in a Supabase development project. Check authentication, RLS, map queries, image uploads, role permissions, and status transitions. Do not test destructive schema changes against production data.

## Deployment

The repository includes Vercel configuration and a multi-stage Dockerfile.

- **Vercel:** Configure the required environment variables in Project Settings, then deploy the selected branch.
- **Docker:** The Dockerfile uses Node.js 22 and expects Next.js standalone output. Confirm `output: "standalone"` is configured in `next.config.*` before building the image. Public Supabase variables are build arguments in the Dockerfile.
- **Supabase:** Apply the reviewed database schema and migrations, configure Auth, RLS, Storage buckets, and region data.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Security and operational notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. It bypasses normal RLS protections.
- Review every route that uses an admin client. Perform authorization checks before privileged database operations.
- Verify RLS policies against the real production schema. A policy in a SQL file does not prove that the deployed project uses it.
- Validate latitude, longitude, radius, IDs, text lengths, uploaded file size, and file type on the server.
- Restrict CORS to trusted origins when cross-origin access is required. The current `vercel.json` sets `Access-Control-Allow-Origin: *` for API routes.
- Protect official invitation and administration routes.
- Do not use the platform as an emergency response service.
- Do not publish private citizen details or sensitive location data without a clear policy.

## Known limitations and items to verify

- Multiple SQL schema variants exist. The exact deployment sequence and schema compatibility must be confirmed.
- Some routes use a privileged Supabase client. Review role checks and input validation before production use.
- The resolution workflow writes to Storage and several tables in separate operations. A failure between writes can leave partial state.
- The Vercel configuration allows all origins for API CORS. This may be too broad for production.
- The Dockerfile requires Next.js standalone output. Confirm the Next.js configuration before using it.
- The `lint` command may need an update for the installed Next.js version.
- Automated test coverage for end-to-end civic workflows is not established by the repository scripts alone.

These are review items, not claims that every deployment is affected. Test them against the exact environment and schema.

## Contributing

1. Open an issue to describe a bug or proposed change.
2. Create a branch for the change.
3. Keep the change focused and add tests where possible.
4. Run `npm run build` and `npm run test:agent`.
5. Test relevant flows against a development Supabase project.
6. Open a pull request with a clear summary, screenshots when useful, and test results.

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## License

No root-level license file was identified during this review. Until a license is added, do not assume that the code is available for unrestricted reuse.
