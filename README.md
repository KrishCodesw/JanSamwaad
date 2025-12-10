# JanSamwaad – Crowdsourced Civic Issue Reporting

> JanSamwaad is a civic-tech platform that enables citizens to report local civic issues, see them on a live map, and track how authorities respond over time.

---

## 📋 Table of Contents

- [About](#about)
- [Problem and Vision](#problem-and-vision)
  - [The Problem](#the-problem)
  - [The Vision](#the-vision)
- [Core Features](#core-features)
  - [Citizen Features](#citizen-features)
  - [Admin/Official Features](#adminofficial-features)
  - [NGO & Community Features](#ngo--community-features)
- [System Architecture](#system-architecture)
  - [High-Level Overview](#high-level-overview)
  - [Logical Components](#logical-components)

---

## About

JanSamwaad is designed to make everyday civic issues like potholes, garbage, broken street lights, and water problems visible, transparent, and easier to resolve collaboratively. By providing a unified platform for citizens, authorities, and NGOs, we aim to improve accountability and accelerate issue resolution.

---

## Problem and Vision

### The Problem

Citizens face everyday civic issues but current channels are often:

- **Fragmented** – Different numbers/apps for different departments
- **Non-transparent** – No clear status, no way to track progress
- **Slow** – No prioritization, no data-driven planning

This leads to frustration, duplicate complaints, and poor accountability.

### The Vision

JanSamwaad aims to become a single unified interface where:

- **Citizens** can easily report local problems with location and photos
- **Issues** are mapped, prioritized, and routed to the right authority
- **Progress** is visible to everyone, building trust and accountability
- **NGOs and civic groups** can use data to drive campaigns and advocacy

---

## Core Features

### Citizen Features

####  Report an Issue

- Submit a title, description, and category (pothole, garbage, water, electricity, etc.)
- Attach one photo as evidence
- The exact location is auto-fetched and submitted with the report
- See a confirmation with a unique issue ID

####  Issues Near You

- Interactive map (Leaflet/OpenStreetMap style) showing issues around the user
- Colored markers or pins by status (e.g., Open / In Progress / Resolved)
- Quick filters (category, status, distance)
- List view of nearby issues with concise cards

####  My Issues

- Personal dashboard with all issues reported by the logged-in user
- Status timeline for each issue (Submitted → In Progress → Resolved → Verified)

####  Real-time Updates

Notifications (email/SMS/WhatsApp, depending on your implementation) when:
- An issue is created
- Status changes (acknowledged, in progress, resolved)
- Deep links that open directly to the issue page

---

### Admin/Official Features

####  Issue Management Dashboard

- Secure login for admins/officials through **RBAC** (Role Based Access Control)
- Table of all issues with sorting and filters (status, category & date)
- Quick view of details and photos
- Ability to change status and add public updates

####  Issue Lifecycle

Configurable status flow, for example:
```
New → Acknowledged → In Progress → Resolved → Verified by Citizen / Rejected
```

- Status history with timestamps
- Optional assignment to departments, wards, or officers *(In progress - currently under development)*

####  Moderation & Validation

- Queue of newly submitted issues that can be quickly validated
- Option to reject spam/test issues with a reason visible to the citizen
- Basic checks like minimum description, at least one evidence field, etc.

---

### NGO & Community Features

> **Note:** Optional / Roadmap features

- Read-only dashboards for partner NGOs to monitor issues in their domain or geographies
- Ability to "adopt" issues, mark involvement, or add NGO-specific updates
- Aggregate statistics for campaigns (e.g., "100 garbage dumps cleaned in Ward X")

---

## System Architecture

### High-Level Overview

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js (React), TypeScript, Tailwind CSS, Leaflet (OpenStreetMap) for mapping |
| **Backend** | Next.js API routes or Node.js/Express with REST endpoints |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Email/password, Google auth plus admin roles |
| **Notifications** | Email provider (e.g., SMTP, Resend), optional SMS/WhatsApp integration |

### Logical Components

1. **Client App** – UI components, forms, map view, state management
2. **API Layer** – Authentication, authorization, issue CRUD, listing & search, admin actions
3. **Geo Services** – Geospatial queries (issues near location/map bounds), clustering/pagination
4. **Notification Service** – Triggered on issue creation and status changes
5. **Admin Panel** – Protected pages and endpoints for validation and lifecycle management

---

## 🚀 Getting Started

1. Clone the repo

git clone https://github.com/your-username/jansamwaad.git
cd jansamwaad

2. Install dependencies

npm install
# or
pnpm install

3. Create a .env.local file (or equivalent) with values

4. Run database migrations (prisma commands)

5. Start development server 

npm run dev


## 🤝 Contributing

Contributing, suggestions, and issue reports are welcome.

Open an issue describing the bug/feature clearly.

For major changes, discuss in an issue first so design decisions are aligned.

Follow existing code style and include basic tests where relevant.

---