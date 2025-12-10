JanSamwaad – Crowdsourced Civic Issue Reporting


JanSamwaad is a civic-tech platform that enables citizens to report local civic issues, see them on a live map, and track how authorities respond over time. The goal is to make everyday issues like potholes, garbage, broken street lights, and water problems visible, transparent, and easier to resolve collaboratively.


1. Problem and vision

The problem
Citizens face everyday civic issues but current channels are often:

Fragmented (different numbers/apps for different departments)

Non-transparent (no clear status, no way to track progress)

Slow (no prioritization, no data-driven planning)

This leads to frustration, duplicate complaints, and poor accountability.

The vision
JanSamwaad aims to become a single unified interface where:

Citizens can easily report local problems with location and photos

Issues are mapped, prioritized, and routed to the right authority

Progress is visible to everyone, building trust and accountability

NGOs and civic groups can use data to drive campaigns and advocacy


2. Core features
Citizen features
Report an Issue

Submit a title, description, category (pothole, garbage, water, electricity, etc.)

Attach one photo as evidence

The exact location is auto-fetched and submitted with the report

See a confirmation with a unique issue ID

Issues Near You

Interactive map (Leaflet/OpenStreetMap style) showing issues around the user

Colored markers or pins by status (e.g., Open / In Progress / Resolved)

Quick filters (category, status, distance)

List view of nearby issues with concise cards

My Issues

Personal dashboard with all issues reported by the logged-in user

Status timeline for each issue (Submitted → In Progress → Resolved → Verified)


Real-time updates

Notifications (email/SMS/WhatsApp, depending on your implementation) when:

An issue is created

Status changes (acknowledged, in progress, resolved)

Deep links that open directly to the issue page

Admin / “Official” features
Issue management dashboard

Secure login for admins/officials through RBAC (Role based access control)

Table of all issues with sorting and filters (status, category & date)

Quick view of details and photos

Ability to change status and add public updates

Issue lifecycle

Configurable status flow, for example:

New → Acknowledged → In Progress → Resolved → Verified by Citizen / Rejected

Status history with timestamps

Optional assignment to departments, wards, or officers (In progress - currently under development)

Moderation & validation

Queue of newly submitted issues that can be quickly validated

Option to reject spam/test issues with a reason visible to the citizen

Basic checks like minimum description, at least one evidence field, etc.

NGO & community features (optional / roadmap)
Read-only dashboards for partner NGOs to monitor issues in their domain or geographies

Ability to “adopt” issues, mark involvement, or add NGO-specific updates

Aggregate statistics for campaigns (e.g., “100 garbage dumps cleaned in Ward X”)


System Architecture


High-level
Frontend: Next.js (React), TypeScript, Tailwind CSS, Leaflet (OpenStreetMap) for mapping.​

Backend: Next.js API routes or Node.js/Express with REST endpoints.​

Database: Supabase (PostgreSQL).​

Auth: Email/password , Google auth plus admin roles.​

Notifications: Email provider (e.g., SMTP, Resend), optional SMS/WhatsApp integration.​

Logical components
Client App – UI components, forms, map view, state management.

API Layer – authentication, authorization, issue CRUD, listing & search, admin actions.

Geo Services – geospatial queries (issues near location/map bounds), clustering/pagination.​

Notification Service – triggered on issue creation and status changes.

Admin Panel – protected pages and endpoints for validation and lifecycle management.
