<div align="center">

# JanSamwaad
**Civic Issue Reporting and Resolution Management Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-Spam_Filter-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

[Live Demo](https://jansamwaad.vercel.app) | [Report Bug](https://github.com/your-username/jansamwaad/issues) | [Request Feature](https://github.com/your-username/jansamwaad/issues)

</div>

## Overview
JanSamwaad is a civic technology platform designed to facilitate the reporting and management of local infrastructure and maintenance issues. It provides a centralized system for citizens to submit reports and for municipal authorities to track, verify, and resolve these issues using automated routing and moderation workflows.

## System Features

### Automated Spam Mitigation and User Moderation
* **Heuristic Filtering:** Implements real-time velocity tracking and keyword filtering to reject invalid or malicious submissions at the application layer.
* **Asynchronous Moderation:** Suspicious reports are placed in a moderation queue and processed via background cron jobs using the Google Gemini API.
* **Policy Enforcement:** Automated suspension system for user accounts that exceed predefined submission violation thresholds.

### Spatial Data Routing
* **Geospatial Assignment:** Utilizes Supabase PostGIS to automatically route submitted issues to the correct municipal department or administrative ward based on geographic coordinates.

### Evidence and Verification Workflow
* **Issue Reporting:** Requires photographic evidence and precise geolocation data for all new submissions.
* **Resolution Proof:** Mandates photographic confirmation and operational notes from authorities upon marking an issue as resolved.
* **Citizen Review:** Provides a strict 7-day review period for reporters to appeal the resolution status if the physical issue remains unaddressed.

### Role-Based Access and Interfaces
* **Citizen Interface:** Features interactive map views, radius-based spatial filtering, and personal submission tracking.
* **Official Console:** Provides secure, segregated queues for pending, appealed, and resolved tasks with administrative state management controls.

## Technical Stack

| Component | Technology |
|---|---|
| **Frontend** | React 19, Next.js (App Router), Tailwind CSS, Shadcn UI |
| **Backend** | Next.js Server Actions and API Routes |
| **Database** | Supabase (PostgreSQL), PostGIS for Spatial Querying |
| **Authentication** | Supabase Auth (Email/Password, OAuth) |
| **Moderation** | Google Generative AI SDK |
| **Mapping** | React-Leaflet, OpenStreetMap |

## Local Development Setup

Follow these instructions to configure the project locally.

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/jansamwaad.git](https://github.com/your-username/jansamwaad.git)
cd jansamwaad