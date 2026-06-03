---
name: Clerk Setup
description: Replit-managed Clerk configuration details, routing rules, appearance setup for this project.
---

# Clerk Setup — AgriPride

## App
- App ID: `app_3EdsFNv4ePJIWv8kxqjyQQdEAPQ`
- Env vars auto-set: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`

## Supported Login Methods
- **Email** (password + verification)
- **Google** SSO
- **NOT supported:** SMS/phone — Replit-managed Clerk does not support phone auth

## Critical Routing Rules
- Routes MUST be `path="/sign-in/*?"` and `path="/sign-up/*?"` (verbatim — the `/*?` is required)
- `<SignIn>` and `<SignUp>` MUST have `routing="path"` and full path: `path={\`${basePath}/sign-in\`}`
- `publishableKey` MUST be `publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)` from `@clerk/react/internal`
- `proxyUrl={clerkProxyUrl}` is unconditional (empty in dev, auto-set in prod)

## Vite / CSS Requirements
- `tailwindcss({ optimize: false })` in `vite.config.ts` — prevents Clerk theme breakage in prod
- `@layer theme, base, clerk, components, utilities;` MUST be before `@import "tailwindcss"` in `index.css`
- `cssLayerName: "clerk"` in the appearance object

## Appearance
- Theme: `shadcn` from `@clerk/themes`
- Primary: `#2D5A1B` (forest green matching brand)
- Font: Plus Jakarta Sans
- Logo: `/public/logo.svg` (green sprout on dark green background)

**Why:** Tailwind v4 with lightningcss reorders `@layer` imports from `@clerk/themes/*.css` at build time unless `optimize: false` is set.
