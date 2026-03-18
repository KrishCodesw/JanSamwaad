<div align="center">

# JanSamwaad
**Civic Infrastructure Reporting and Resolution Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![PostGIS](https://img.shields.io/badge/PostGIS-Spatial_Routing-336791?style=for-the-badge&logo=postgresql)](https://postgis.net/)

[Live Demo](https://jansamwaad.vercel.app) | [Report Bug](https://github.com/your-username/jansamwaad/issues) | [Request Feature](https://github.com/your-username/jansamwaad/issues)

</div>

## Overview
JanSamwaad is a civic technology platform engineered to streamline the reporting, tracking, and resolution of local infrastructure issues. It provides a centralized interface for citizens to submit geographically accurate reports and for municipal authorities to manage resolutions through a transparent, verified workflow. 

## System Architecture and Features

### Heuristic Spam Mitigation and User Moderation
* **Application-Layer Filtering:** Implements real-time submission velocity tracking and local keyword dictionaries to reject invalid, profane, or malicious submissions before database insertion.
* **Policy Enforcement:** Automated suspension system tracks user violations. Accounts accumulating three strikes are programmatically restricted from further submissions.

### Spatial Data Routing
* **Geospatial Assignment:** Utilizes Supabase PostGIS spatial queries to automatically route submitted issues to the correct municipal department or administrative boundary based on the exact latitude and longitude of the report.

### Evidence and Verification Workflow
* **Issue Reporting:** Requires photographic evidence and precise geolocation data for all new public submissions.
* **Proof of Work:** Mandates photographic confirmation and operational notes from authorities when updating an issue status to resolved.
* **Citizen Accountability Loop:** Enforces a strict 7-day review period, allowing the original reporter to appeal the resolution status and reopen the ticket if the physical issue remains unaddressed.

### Role-Based Access and Interfaces
* **Citizen Interface:** Features interactive map views, radius-based spatial filtering, and personal submission tracking dashboards.
* **Official Console:** Provides secure, segregated queues for pending, appealed, and resolved tasks with administrative state management controls.

## Technical Stack

| Component | Technology |
|---|---|
| **Frontend** | React 19, Next.js (App Router), Tailwind CSS, Shadcn UI |
| **Backend** | Next.js Server Actions and API Routes |
| **Database** | Supabase (PostgreSQL), PostGIS for Spatial Querying |
| **Authentication** | Supabase Auth (Email/Password, OAuth) |
| **Mapping** | React-Leaflet, OpenStreetMap |

## Local Development Setup

# 1. Clone the repository
git clone https://github.com/KrishCodesw/jansamwaad.git
cd jansamwaad

# 2. Install dependencies
npm install

# 3. Configure Environment Variables
cp .env.example .env

# 4. Database Configuration
    Run the SQL script in the SQL editor of Supabase !

# 5. Initialize the Server
npm run dev