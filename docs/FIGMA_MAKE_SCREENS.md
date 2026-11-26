# Figma Make Screen Inventory

**File key:** `5eq71pyhA8nOmZw8Gg0Ey0`  
**Node:** `0:1`  
**URL:** https://www.figma.com/make/5eq71pyhA8nOmZw8Gg0Ey0/Creator-Marketing-Platform--Copy-  
**Product:** Orbitly (brand ↔ creator influencer marketplace prototype)  
**Pulled:** 2026-11-26  
**Source shape:** Monolithic `App.tsx` (8096 lines) + `index.css` (17626) + `flows.css` (1720)

## Access notes

| Tool | Result |
|------|--------|
| `whoami` | OK — `sripavantejb` / Full seat / `code_layers_enabled` |
| `get_design_context` | **ACCESS GRANTED** — returned Make source + image resource URIs |
| `get_screenshot` | Unsupported for Make |
| `download_assets` | Unsupported for Make — assets via MCP `file://figma/make/image/...` + `downloadPath` |
| `create_session` | Skipped (not supported for Make) |
| `public/favicon.png` | Not found in Make source |

## Extracted files

| Path | Role | Size / lines |
|------|------|--------------|
| `App.tsx` | Full React app (screens, sheets, onboarding, flows) | 267K / 8096 |
| `index.css` | Primary styles | 322K / 17626 |
| `flows.css` | Flow / secondary-screen styles | 32K / 1720 |
| `main.tsx` | Vite entry | 871B / 29 |
| `package.json` | Make project deps | 586B / 27 |
| `index.html` | Vite HTML shell | 440B |
| `orbitly-end-to-end-screen-completion.md` | Make plan doc | 16K / 316 |
| `assets/` | 18 content PNGs (13M) | — |

**Component count:** 43 (`export default function App` + 42 named `function` components)

---

## App shells & primary tabs

### Brand app (`appRole === "brand"`) — 5 tabs
| Tab | Component |
|-----|-----------|
| Home | `BrandHomeV2` |
| Explore | `ExploreScreen` |
| Campaigns | `CampaignScreen` |
| Inbox | `InboxScreen` |
| Profile | `ProfileScreen` |
| Nav | `BottomNav` |

### Creator app (`appRole === "creator"`) — 5 tabs
| Tab | Component |
|-----|-----------|
| Home | `CreatorHomeScreen` |
| Opportunities | `CreatorOpportunitiesScreen` |
| Work | `CreatorWorkScreen` |
| Earnings | `CreatorEarningsScreen` |
| Profile | `CreatorAppProfile` |
| Nav | `CreatorBottomNav` |

---

## Onboarding

### Entry
- `FullOnboarding` — role pick + common → role-specific steps
- `Onboarding` — alternate/legacy onboarding shell
- `CommonShell`, `RoleWelcome`, `OnboardingFields`, `ChipPicker`

### Shared / animated steps
- `AnimatedAccountSuccess`
- `AnimatedVerificationChoice`
- `FaceVerification`
- `SocialConnections`
- `AudienceInformation`
- `AnimatedLocationMap`
- `AvailabilityScheduler`
- `AIAnalysis`
- `ReviewProfile`

### Brand onboarding steps (`brandSteps`) — 21
1. Welcome to Brand Onboarding  
2. Business Information  
3. Business Details  
4. Face Verification  
5. About Your Business  
6. Products & Services  
7. Target Audience  
8. Social Media Accounts  
9. Social Account Verification  
10. Marketing Goals  
11. Influencer Categories  
12. Creator Type Preferences  
13. Target Locations  
14. Preferred Languages  
15. Campaign Requirements  
16. Marketing Budget  
17. Number of Creators  
18. Collaboration Preferences  
19. AI Business Analysis  
20. Review Your Profile  
21. Onboarding Complete  

### Creator onboarding steps (`creatorSteps`) — 21
1. Welcome to Creator Onboarding  
2. Personal Information  
3. Face Verification  
4. Location Details  
5. Creator Category  
6. Content Categories  
7. Social Media Accounts  
8. Social Account Verification  
9. Audience Information  
10. Content Performance  
11. Content Portfolio  
12. Previous Collaborations  
13. Content Formats  
14. Collaboration Preferences  
15. Preferred Brand Categories  
16. Preferred Platforms  
17. Pricing Preferences  
18. Availability  
19. Payment Information  
20. AI Creator Profile Analysis  
21. Onboarding Complete  

---

## Brand discovery / matching

| Component | Purpose |
|-----------|---------|
| `BrandHomeV2` | Brand home hub |
| `CreatorSearchPreferences` | Instant / scheduled search prefs |
| `CreatorMatchLoader` | Animated matching map / loader |
| `InstantCreatorDeck` | Match result deck |
| `ExploreScreen` | Search + creator grid |
| `CreatorDetail` | Creator profile overlay |
| `FilterSheet` | Explore filters |
| `BookingSheet` | Book / request collaboration |
| `SectionTitle` | Section header helper |

---

## Secondary prototype flows (`FlowName` → `PrototypeFlowScreen`) — 18

Routed via `activeFlow` / `AppFlow`:

| FlowName | Likely UI |
|----------|-----------|
| `notifications` | Notification center |
| `saved-creators` | Saved creators (brand) |
| `saved-opportunities` | Saved opportunities (creator) |
| `campaign-create` | Create campaign |
| `brand-campaign` | Brand campaign workspace |
| `creator-campaign` | Creator campaign workspace |
| `submissions` | Submission review |
| `applications` | Application review |
| `payment` | Payment confirmation |
| `brand-analytics` | Brand analytics |
| `creator-analytics` | Creator analytics |
| `invite` | Invite flow |
| `ai-assistant` | AI assistant result |
| `opportunity` | Opportunity brief |
| `withdraw` | Withdrawal |
| `transactions` | Transaction history |
| `brief-preview` | Brief preview |
| `profile-section` | Profile settings subsections |

### Flow helpers
- `PrototypeFlowScreen` — generic secondary screen router
- `CampaignWorkspaceFlow`
- `AnalyticsFlow`
- `ProfileSectionFlow`
- `FlowChoices`, `ToggleRow`

---

## Shared chrome / utilities

| Component | Purpose |
|-----------|---------|
| `App` (default export) | Root state machine |
| `StatusBar` | Mobile status bar |
| `Icon` | Inline SVG icon set |
| Mock data | `creators[]`, `campaigns[]` |

---

## Component checklist (all components in `App.tsx`) — 43

1. `Icon`
2. `App` (default export)
3. `FullOnboarding`
4. `AnimatedAccountSuccess`
5. `AnimatedVerificationChoice`
6. `CommonShell`
7. `RoleWelcome`
8. `ChipPicker`
9. `OnboardingFields`
10. `AvailabilityScheduler`
11. `FaceVerification`
12. `SocialConnections`
13. `AudienceInformation`
14. `AnimatedLocationMap`
15. `AIAnalysis`
16. `ReviewProfile`
17. `Onboarding`
18. `StatusBar`
19. `CreatorHomeScreen`
20. `CreatorOpportunitiesScreen`
21. `CreatorWorkScreen`
22. `CreatorEarningsScreen`
23. `CreatorAppProfile`
24. `CreatorBottomNav`
25. `BrandHomeV2`
26. `InstantCreatorDeck`
27. `CreatorSearchPreferences`
28. `CreatorMatchLoader`
29. `SectionTitle`
30. `ExploreScreen`
31. `CampaignScreen`
32. `InboxScreen`
33. `ProfileScreen`
34. `BottomNav`
35. `PrototypeFlowScreen`
36. `FlowChoices`
37. `ToggleRow`
38. `CampaignWorkspaceFlow`
39. `AnalyticsFlow`
40. `ProfileSectionFlow`
41. `CreatorDetail`
42. `FilterSheet`
43. `BookingSheet`

---

## Assets (`assets/`)

18 content PNGs (hashed filenames from Make), ~13M total.  
Downloaded from MCP URIs `file://figma/make/image/5eq71pyhA8nOmZw8Gg0Ey0/<hash>.png` via `FetchMcpResource` + `downloadPath`.  
`public/favicon.png` was listed in Make resources but returned “not found” — no favicon saved.

## Plan doc

`orbitly-end-to-end-screen-completion.md` — Orbitly end-to-end screen completion plan (frontend prototype; no backend).
