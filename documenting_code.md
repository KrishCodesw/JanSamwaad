# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Repo type: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase Auth (SSR via @supabase/ssr)

Common commands (npm)
- Install dependencies (uses package-lock.json): `npm ci`
- Start dev server (Turbopack): `npm run dev`
- Lint: `npm run lint`
- Lint with autofix: `npx next lint --fix`
- Type-check only: `npx tsc --noEmit`
- Build: `npm run build`
- Start in production (after build): `npm run start`
- Tests: not configured in this repo (no test runner or test script present)
- Run a single test: not applicable (tests are not set up)

Environment setup
- Copy `.env.example` to `.env.local` and set:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
- Supabase Auth redirect URL for local dev must be whitelisted in your Supabase project:
  - `http://localhost:3000/auth/callback`
- When env vars are missing, the app renders onboarding steps and the auth middleware becomes a no-op via `hasEnvVars`.

High-level architecture
- App Router structure (server-first)
  - `app/` contains the root layout and routes.
    - `app/layout.tsx` sets up global styles, metadata, and `next-themes` theme provider.
    - `app/page.tsx` is the landing page. It gates content based on `hasEnvVars` to show either connection steps or sign-up steps.
    - `app/protected/` is a protected area. Server component fetches auth claims; unauthenticated users are redirected to login.
  - Auth flow routes under `app/auth/`:
    - `app/auth/callback/route.ts`: Handles OAuth/code exchange via `supabase.auth.exchangeCodeForSession` and redirects to the `next` param (defaults to `/protected`).
    - `app/auth/confirm/route.ts`: Handles email OTP verification via `supabase.auth.verifyOtp`.
    - `app/auth/login|sign-up|forgot-password|update-password|sign-up-success|error`: UI routes for auth flows.

- Supabase client layers (`lib/supabase/*`)
  - `lib/supabase/server.ts` creates a server-side client with cookie integration using `createServerClient`. Important: create a fresh client per request; do not store globally.
  - `lib/supabase/client.ts` creates a browser client via `createBrowserClient` for client components.
  - `lib/supabase/middleware.ts` exports `updateSession` which:
    - Hydrates a `NextResponse`, creates a per-request server client, calls `supabase.auth.getClaims()` to validate the session, and optionally redirects unauthenticated users to `/auth/login` for non-auth routes.
    - Returns the original `supabaseResponse` to preserve cookies. If you need to change the response, follow the comments in that file to avoid desyncing cookies.
    - Caution: Avoid adding logic between client creation and `getClaims()` (see in-file notes) to prevent hard-to-debug session issues.

- Next.js middleware (`middleware.ts`)
  - Delegates to `updateSession(request)` and defines a `matcher` that excludes `_next/static`, `_next/image`, `favicon.ico`, and common image file extensions from auth checks.
  - If you add other public assets or routes that should bypass auth, update the `matcher` accordingly.

- UI & theming
  - Tailwind configured via `tailwind.config.ts` and `postcss.config.mjs`; base styles in `app/globals.css`.
  - Components follow shadcn/ui patterns (`components/ui/*`) and use `class-variance-authority` for variants.
  - Theme toggling via `next-themes` (`ThemeProvider` in root layout) and a `ThemeSwitcher` component.
  - Utility `cn()` for class merging lives in `lib/utils.ts` (clsx + tailwind-merge).

- Tooling & config
  - TypeScript strict build with bundler module resolution and path alias `@/*` (see `tsconfig.json`).
  - ESLint FlatConfig compatibility setup extending `next/core-web-vitals` and `next/typescript` (`eslint.config.mjs`).
  - `components.json` defines shadcn/ui aliases (e.g., `@/components`, `@/lib`, `@/components/ui`) consistent with TS path aliases.
  - `next.config.ts` is currently minimal.

Development tips specific to this codebase
- Auth enforcement happens in both middleware and in `app/protected` server components. If you change the auth flow, update both the middleware matcher/logic and any server component guards to keep behavior consistent.
- The onboarding guard `hasEnvVars` (in `lib/utils.ts`) intentionally disables middleware auth until Supabase env vars are provided. Keep this behavior if you want the template to be usable before configuration; remove it when you fully wire up your project.
- When editing `lib/supabase/middleware.ts`, ensure you always return the `supabaseResponse` and preserve cookies as documented in code comments to prevent session loss.

