# Orbitly — Exact Figma Make Screen Flow

Source: [Creator Marketing Platform](https://www.figma.com/make/dWMFZk1ZaZPqJFDwq4PH2X/Creator-Marketing-Platform)

## Master route

1. **Onboarding (common)** → pick Brand or Creator  
2. **Role onboarding** (brand OR creator steps)  
3. **App shell**
   - Brand → business UI  
   - Creator → influencer UI  

---

## A. Shared onboarding (common phase)

| # | Screen | Action |
|---|--------|--------|
| 0 | Splash — Orbitly | Tap anywhere → next |
| 1 | Intro — “Turn influence into real growth” | Continue / Skip |
| 2 | Choose your path | Select **Brand** or **Creator** → Continue |
| 3 | Create your account | Name / email / password → Create account |
| 4 | Verify your details | Send verification code |
| 5 | Enter verification code | OTP → Verify account |
| 6 | Account success (animated) | Continue → role onboarding |

---

## B. Brand / business onboarding (role phase)

| # | Screen |
|---|--------|
| 1 | Welcome to Brand Onboarding |
| 2 | Business Information |
| 3 | Business Details |
| 4 | Face Verification |
| 5 | About Your Business |
| 6 | Products & Services |
| 7 | Target Audience |
| 8 | Social Media Accounts |
| 9 | Social Account Verification |
| 10 | Marketing Goals |
| 11 | Influencer Categories |
| 12 | Creator Type Preferences |
| 13 | Target Locations |
| 14 | Preferred Languages |
| 15 | Campaign Requirements |
| 16 | Marketing Budget |
| 17 | Number of Creators |
| 18 | Collaboration Preferences |
| 19 | AI Business Analysis |
| 20 | Review Your Profile |
| 21 | Onboarding Complete → **Brand Dashboard** |

---

## C. Brand / business app (after onboarding)

| Tab | Screen | File |
|-----|--------|------|
| Home | BrandHomeV2 — “Grow your brand with the right voices.” | `src/features/brand/BrandHomeV2.tsx` |
| Explore | Creator marketplace | `src/features/brand/ExploreScreen.tsx` |
| Campaigns | Active / Applications / Completed | `src/features/brand/CampaignScreen.tsx` |
| Inbox | Conversations | `src/features/brand/InboxScreen.tsx` |
| Profile | Brand profile + reset | `src/features/brand/screens.tsx` |

### Brand overlays

| Overlay | When |
|---------|------|
| CreatorDetail | Open a creator |
| FilterSheet | Explore filters |
| BookingSheet | Book creator → success |

---

## D. Creator / influencer onboarding (role phase)

| # | Screen |
|---|--------|
| 1 | Welcome to Creator Onboarding |
| 2 | Personal Information |
| 3 | Face Verification |
| 4 | Location Details |
| 5 | Creator Category |
| 6 | Content Categories |
| 7 | Social Media Accounts |
| 8 | Social Account Verification |
| 9 | Audience Information |
| 10 | Content Performance |
| 11 | Content Portfolio |
| 12 | Previous Collaborations |
| 13 | Content Formats |
| 14 | Collaboration Preferences |
| 15 | Preferred Brand Categories |
| 16 | Preferred Platforms |
| 17 | Pricing Preferences |
| 18 | Availability |
| 19 | Payment Information |
| 20 | AI Creator Profile Analysis |
| 21 | Onboarding Complete → **Creator Dashboard** |

---

## E. Creator / influencer app (after onboarding)

| Tab | Screen | File |
|-----|--------|------|
| Home | Creator home / wallet | `src/features/creator/screens.tsx` |
| Opportunities | Brand campaigns feed | `src/features/creator/CreatorOpportunities.tsx` |
| Work | Active / Applications / Completed | `src/features/creator/CreatorWork.tsx` |
| Earnings | Balance / chart / transactions | `src/features/creator/CreatorEarnings.tsx` |
| Profile | Creator profile + reset | `src/features/creator/screens.tsx` |

---

## How to reach each path in the app

1. Open splash → **Skip to dashboard** = Brand (default role)  
2. Or: Splash → Intro → **Choose Creator** → Skip onboarding / finish → Creator app  
3. Profile → **Sign out / reset demo** to restart flow  
