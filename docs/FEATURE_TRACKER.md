# Orbitly Feature Completion Tracker

Last updated: 2026-11-26  
Rule: **preserve existing UI**; mark Completed only when FE + BE + data are real (not mock).

Statuses: `Not started` · `In progress` · `Partial` · `Awaiting config` · `Awaiting testing` · `Completed` · `Blocked`

## Phase 1 — Foundation (current sprint)

| Module | Feature | Status | FE | BE | Notes |
|--------|---------|--------|----|----|-------|
| Tracker | This document | Completed | — | — | Living tracker |
| Auth | Email register/login | Completed | ✓ | ✓ | |
| Auth | Email OTP + SMTP | Partial | ✓ | ✓ | Needs production SMTP |
| Auth | Demo login UI → API | Completed | ✓ | ✓ | Brand/Creator demo buttons call `demoEnter` |
| Auth | Session persistence | Completed | ✓ | ✓ | JWT + localStorage; no force-clear |
| Auth | Google Sign-In | Awaiting config | ✓ | ✓ | Needs client IDs |
| Auth | Apple / SMS OTP / Forgot password | Not started | | | |
| Onboarding | Progress persistence | Completed | ✓ | ✓ | |
| Onboarding | Dynamic ReviewProfile | Completed | ✓ | ✓ | Reads `fields` / `answers` |
| Brand | BookingSheet → `POST /bookings` | Completed | ✓ | ✓ | Real booking IDs; UI preserved |
| Brand | Instant deck → book | Completed | ✓ | ✓ | Swipe-right opens BookingSheet |
| Creator | Work accept/reject bookings | Completed | ✓ | ✓ | Applications tab + existing cards |
| Brand | Inbox → `listMessages` | Completed | ✓ | ✓ | API list + mark-read; chat chrome kept |
| Infra | `.env.example` Instagram keys | Completed | — | — | Documented placeholders |

## Phase 2 — Verification & profiles

| Feature | Status | Blockers |
|---------|--------|----------|
| Real camera + selfie capture | Partial | Device `getUserMedia` live; liveness provider still Awaiting config |
| Business verification | Not started | |
| Instagram OAuth | Awaiting config | Meta app IDs |
| YouTube OAuth (not scrape) | Partial | Currently handle scrape |
| Real AI analysis | Not started | AI provider |

## Phase 3 — Discovery & matching

| Feature | Status | Notes |
|---------|--------|-------|
| Instant/Schedule home UI | Partial | Live available creators feed Instant deck + counts |
| Geospatial `$near` | Not started | City string filter today |
| Instant availability toggle | Completed | Creator home → `PATCH /creators/me/availability` |
| FilterSheet → AppStore | Completed | Applies category/city/availableOnly + refresh |
| Auto match dispatch | Not started | |

## Phase 4 — Chat & agreements

| Feature | Status | Notes |
|---------|--------|-------|
| Inbox list + mark-read | Completed | |
| Thread send/list API | Completed | Polling-based; WebSocket still open |
| Real-time WebSocket chat | Not started | |
| Negotiation / agreements | Not started | |

## Phase 5–6 — Payments & physical OTP tracking

| Feature | Status | Blockers |
|---------|--------|----------|
| Razorpay / payments | Not started | Gateway keys |
| Start OTP (in-app) | Completed | Brand generates → creator verifies → `in_progress` |
| Live GPS tracking | Not started | Maps + FCM |
| Collaboration timer | Not started | |

## Phase 7–9 — Campaigns, payouts, analytics, iOS

| Feature | Status | Notes |
|---------|--------|-------|
| Campaign create API | Completed | `POST /campaigns` + brand publish flow |
| Earnings / withdraw | Partial | Live balance + withdraw API; payouts gateway still needed |
| Real payouts | Not started | |
| FCM push | Awaiting config | |
| iOS Capacitor | Not started | |

## Critical wiring gaps (verified)

- Phase 1 gaps closed (booking, demo login, work accept/reject, inbox, ReviewProfile).
- Liveness provider, Razorpay, FCM, geospatial `$near`, WebSocket chat still open.

## Credentials checklist (do not hardcode)

See `server/.env.example` and root `.env.example`. Required for later phases: SMTP, Google, Meta, Razorpay, FCM, maps/routing, identity/liveness, AI.
