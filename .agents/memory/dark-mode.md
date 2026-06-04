---
name: Dark Mode
description: How dark mode is enabled and how it affects Clerk appearance and CSS.
---

# Dark Mode Configuration

## How It's Enabled
- `class="dark"` on the `<html>` element in `artifacts/agripride/index.html`
- The `.dark` CSS class variables are already defined in `index.css` — no runtime toggle needed
- Dark mode is permanent (by design), not switchable

## Clerk Dark Appearance
When dark mode is on, the Clerk appearance variables must use dark palette values:
- `colorBackground`: `#0f1a0f` (very dark green-black)
- `colorInput`: `#1a2e1a`
- `colorForeground`: `#f0fdf4`
- `colorPrimary`: `#4ade80` (bright green for contrast on dark)
- `colorNeutral`: `#2d4a2d`

## Officer Navigation Fix
After moving officer portal to `/officer/*`, the Layout.tsx nav hrefs must use `/officer`, `/officer/farmers`, `/officer/loan-applications`, `/officer/loans` — NOT `/`, `/farmers`, etc.

**Why:** Without this, clicking nav links navigates to the landing page (wrong route) instead of the officer dashboard.
