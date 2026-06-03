---
name: Auth Architecture
description: Two auth systems coexist — Clerk for applicants, express-session for officers. Route layout and how they interact.
---

# Dual Auth Architecture

## Route Layout
- `/` — Public landing page
- `/sign-in/*?` `/sign-up/*?` — Clerk UI for applicants
- `/portal/*` — Applicant portal (Clerk-protected via `<Show when="signed-in">`)
- `/officer/*` — Officer portal (session-protected via `useAuth()` hook → `/api/auth/me`)

## How They Coexist
- `<ClerkProvider>` wraps the entire React app (for applicant routes)
- `<AuthProvider>` (session-based) wraps only the `OfficerSection` component
- The `useAuth()` hook is completely independent of Clerk — it checks `req.session.userId` via `/api/auth/me`
- On the API: `clerkMiddleware()` is mounted globally in `app.ts`; officer routes check `req.session.userId`; applicant routes use `getAuth(req)` from `@clerk/express`

## Key Files
- `artifacts/api-server/src/app.ts` — mounts both session middleware and Clerk middleware
- `artifacts/api-server/src/routes/index.ts` — `requireOfficerAuth` guards `/farmers`, `/loan-applications`, `/loans`, `/dashboard`
- `artifacts/api-server/src/routes/applicant.ts` — all applicant routes use `requireApplicantAuth` (Clerk)
- `artifacts/agripride/src/App.tsx` — `ClerkProvider` at top, `AuthProvider` nested inside `OfficerSection`

**Why:** Loan officers use a simple username/password internal system (no need for social login); farmers/applicants need modern auth with Google.
