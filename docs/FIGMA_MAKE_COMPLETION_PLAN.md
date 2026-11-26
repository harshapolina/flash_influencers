# Orbitly End-to-End Screen Completion Plan

## Goal

Complete the existing Orbitly mobile-first prototype for both Brand and Creator roles so every visible primary action has a connected destination, editable interaction, or explicit feedback state. Preserve the current warm editorial visual language, glass navigation, existing onboarding, matching map, creator discovery, booking, collaboration acceptance, and chat flows.

This pass is a **frontend interactive prototype**:

- No backend, authentication service, payments provider, or CMS migration.
- State is realistic and connected during the current app session, but resets on page reload.
- Existing creator and campaign records remain the shared source data.
- Continue using `src/App.tsx` and `src/index.css` to match the repository’s established structure; avoid a broad refactor unrelated to completion.

## Current Baseline to Preserve

- Full common, Brand, and Creator onboarding.
- Role-specific app shells and bottom navigation.
- Brand instant/scheduled creator search, animated matching map, result deck, creator profiles, booking/request flow, and gated chat.
- Creator incoming collaboration acceptance/decline/report flow and accepted chat.
- Brand Explore search, creator detail, likes, filter sheet shell, and booking confirmation.
- Existing visual styling, motion language, safe-area behavior, and reduced-motion rules.

## Navigation and State Architecture

### Root-level route state

Add role-specific secondary route unions in `App` rather than a routing dependency:

- `BrandSubscreen`: notification center, saved creators, campaign create flow, campaign workspace, submission review, application review, payment confirmation, report/analytics, invite flow, AI assistant result, business settings pages, and support.
- `CreatorSubscreen`: notification center, opportunity brief, saved opportunities, application status, campaign workspace, deliverable submission, analytics, withdrawal, transaction history/detail, public profile, edit profile, portfolio, social accounts, pricing, availability, verification, settings/privacy, and support.

Each secondary screen receives a consistent `onBack` callback. Opening a secondary screen hides the relevant bottom navigation; closing it returns to the originating tab without losing in-session state.

### Shared prototype state

Lift state that crosses screens into `App`:

- Saved creator IDs and saved opportunity IDs.
- Creator applications and their status (`draft`, `submitted`, `shortlisted`, `accepted`).
- Brand campaign drafts and current campaign status.
- Collaboration/request status.
- Submission review status and creator deliverable milestone status.
- Creator wallet balance and withdrawal success entry.
- Brand payment status.
- Sent chat messages.
- Read/unread notifications.
- Selected filters, tabs, and date ranges where needed.

Keep strictly local display state—open sheet, selected chip, temporary form text—inside the owning screen.

### Shared interaction primitives

Create reusable components inside `App.tsx`:

- `SubscreenHeader` for back navigation, title, optional action.
- `ActionSheet` for compact selections and confirmation choices.
- `PrototypeToast` for saved, copied, sent, paid, and updated feedback.
- `ConfirmState` for full-screen/sheet success states.
- `EmptyState` for filtered lists with no results.

All icon-only controls receive `aria-label`; dialogs use `role="dialog"` and `aria-modal`; forms use labels or accessible names.

## Brand App Completion

### 1. Brand Home connections

Connect existing static controls:

- Bell opens Brand notification center with unread/read behavior.
- Workspace name opens a workspace switcher sheet; The Loom remains the active demo workspace.
- Avatar opens the Brand Profile tab.
- Search input submits to Explore with the entered query; filter opens the existing filter sheet.
- Overview/Approvals/Applications/Reports chips switch the home content summary or route to the matching destination.
- Featured campaign and “Manage campaign” open the campaign workspace.
- Stat cards route to Campaigns, collaborating creators, spend report, or approvals.
- Quick actions:
  - Create campaign → campaign creation wizard.
  - Find creators → Explore.
  - Invite → creator invite flow.
  - Ask AI → expanded AI assistant.
- “Needs attention” items open submission review, application review, or payment confirmation.
- Performance and Full report open campaign analytics.
- Application Review controls open the selected applicant review.
- AI insight “Explore creators” opens Explore with Telugu/Lifestyle filtering; “Ask AI” preloads the assistant.
- Recent activity items open the relevant campaign, creator, or transaction context.
- AI prompt send renders an inline assistant response with a useful follow-up action rather than remaining inert.

### 2. Brand Explore completion

- Saved/bookmark header opens Saved Creators.
- Category pills become selectable and filter visible creator data.
- Sort control opens Best Match, Engagement, Followers, Price Low–High, and Availability choices.
- Existing filter sheet becomes controlled: apply/reset filter values and update the results count.
- Preserve creator detail, like, and booking behavior.
- Saved Creators supports opening profiles and removing saved items, with an empty state.

### 3. Brand campaign creation

Add a compact multi-step campaign wizard:

1. Basics: campaign name, objective, category.
2. Deliverables: formats and quantities.
3. Audience: location, language, creator tier.
4. Budget and timeline.
5. Review and publish.

Use a visible step indicator, back/continue controls, required-field validation, and a publish success state. Publishing adds the new draft/published campaign to the Campaigns list for the current session.

### 4. Brand Campaigns and workspace

- Make Active, Applications, and Completed tabs functional with counts and tailored cards/empty states.
- Plus button opens campaign creation.
- Campaign cards open a campaign workspace containing:
  - Overview and progress.
  - Creator roster.
  - Deliverables and milestones.
  - Pending approvals.
  - Budget/spend snapshot.
  - Timeline.
- Submission review displays creator media preview, caption, checklist, feedback field, Request changes, and Approve actions.
- Application review displays creator profile metrics, proposal, quote, Accept, Decline, Save, and Message actions.
- Accepting an application updates campaign roster and application state.
- Payment confirmation shows amount, campaign, creator, payment method summary, confirmation, and success receipt; update the originating task to Paid.
- Completed campaigns expose a compact performance summary and “View report.”

### 5. Brand analytics/report

Create a full report screen with:

- Date-range selector.
- Reach, views, engagement, clicks, and conversions.
- Existing chart language expanded into channel and creator breakdowns.
- Top-performing creator and content cards.
- Export button producing prototype feedback (“Report prepared”) rather than a file download.

### 6. Brand Inbox completion

- Search button expands a conversation search field.
- All/Unread/Campaigns filters update the conversation list.
- Chat search opens in-thread search UI.
- Safety button opens report/block actions with confirmation.
- Campaign brief card opens an in-app brief preview.
- Attachment and camera buttons open a media attachment sheet; choosing an item inserts a sent attachment card.
- Preserve working text send behavior and collaboration context.

### 7. Brand Profile and settings

Connect every menu item:

- Business profile: editable brand/contact/about fields with Save feedback.
- Payments & billing: payment method summary, invoices list, and add-method prototype form.
- Team management: members, roles, invite teammate form, and invite sent state.
- Subscription: current Growth plan, usage, plan comparison, and confirmation sheet for plan selection.
- Notifications: category toggles.
- Help & support: FAQ rows, contact form, and submitted state.

Brand profile notifications open the shared notification center.

## Creator App Completion

### 1. Creator Home connections

- Bell opens Creator notification center.
- Withdraw Earnings opens the withdrawal flow.
- Profile strength opens Edit Profile focused on portfolio completion.
- KPI cards route to Work, Opportunities, and Analytics.
- Matched campaign tiles open the specific opportunity brief.
- Active campaign and “View work” open the campaign workspace.
- Analytics action opens Creator Analytics.

### 2. Creator Opportunities completion

- Search field filters brands/campaigns.
- Saved header opens Saved Opportunities.
- Category chips become functional.
- Filter opens niche, format, location, pay, and availability selections.
- AI matches banner applies the recommended filter.
- Sort control supports Recommended, Highest pay, Best match, and Deadline.
- Bookmark toggles persist across the Creator app session.
- “View brief” opens a complete opportunity brief with:
  - Brand verification and overview.
  - Campaign goals.
  - Deliverables and usage rights.
  - Timeline.
  - Creator requirements.
  - Compensation and payment schedule.
  - Apply and Save actions.
- Application flow collects proposed concept, availability, quote, and optional note; review and submit produce a success state.
- Submitted applications appear in Creator Work → Applications.
- Existing incoming collaboration request/report/chat behavior remains, but chat compose and send become functional and safety opens the same report flow.

### 3. Creator Work and campaign workspace

- Active, Applications, and Completed tabs become functional.
- Calendar button opens a deadline calendar/list sheet.
- Active campaign cards and next deadline open a creator campaign workspace containing:
  - Campaign brief summary.
  - Milestone timeline.
  - Deliverables.
  - Product/shipping state.
  - Brand contact/chat entry.
  - Payment milestone summary.
- Deliverable submission flow supports media selection placeholder, caption/link, checklist, preview, submit confirmation, and an updated “In review” milestone.
- Applications tab shows submitted/shortlisted states and allows opening the original brief.
- Completed tab shows paid campaigns, rating, and View summary.

### 4. Creator Earnings completion

- Withdraw button opens:
  1. Amount selection with available-balance validation.
  2. Bank/UPI destination confirmation.
  3. Review.
  4. Processing success.
- Successful withdrawal reduces the visible balance and adds a transaction row for the current session.
- Calendar/date control opens range choices.
- Year selector changes chart dataset between demo years.
- View All opens transaction history with status/type filters.
- Transaction rows open transaction detail/receipt screens.

### 5. Creator Analytics

Add a dedicated screen with:

- Reach, views, engagement, and follower growth.
- Period selector.
- Performance chart.
- Platform breakdown.
- Top content cards.
- Audience summary.
- Campaign earnings contribution.

Use the existing profile and onboarding metrics so values remain internally consistent.

### 6. Creator Profile and settings

Connect Edit Profile and every menu row:

- Public profile: creator-facing profile preview using existing profile data.
- Edit profile: photo, bio, location, categories, and completion guidance.
- Portfolio: grid/list, add sample form, delete confirmation, and completion update.
- Social accounts: connected account states, sync feedback, and add account sheet.
- Pricing & packages: editable Reel, Story, UGC, and bundle rates.
- Availability: reuse the established weekly availability/calendar visual pattern with editable state.
- Verification: identity/social verification status and trust explanation.
- Settings & privacy: discovery visibility, message permissions, account privacy, and notification toggles.
- Creator support: FAQs, report issue/contact form, and submitted state.

Creator profile notifications open the shared notification center.

## Notification Centers

Provide role-specific notification lists with:

- Unread indicators.
- All/Unread filters.
- Mark all read.
- Contextual navigation for campaign, application, payment, message, or verification notifications.
- Empty state after filtering.

## Visual and Interaction Requirements

- Match current typography, rounded surfaces, lime/green and lavender accents, warm neutral canvas, and Apple-style glass navigation.
- Secondary screens use full-height mobile surfaces with deliberate hero/header treatment; avoid generic repeated cards where richer hierarchy is appropriate.
- Keep motion subtle: sheet transitions, success confirmations, progress changes, and list updates.
- Respect `prefers-reduced-motion`.
- Preserve scrollability and safe-area padding.
- No emoji; use the existing `Icon` component.
- Use existing real creator images and current campaign visual assets.
- Every visible button must do one of: navigate, mutate state, open a selector/dialog, submit, or show explicit prototype feedback. Decorative controls should be changed to non-button elements.

## Edge Cases

- Prevent blank message, application, support, and invite submissions.
- Disable forward actions until required wizard fields are complete.
- Keep selected filters removable and provide Reset.
- Show empty states for no saved items, no search matches, and empty tab categories.
- Prevent withdrawing more than the available balance or non-positive amounts.
- Ensure back/close actions do not unintentionally clear already-submitted state.
- Confirmation dialogs are required for destructive actions such as deleting portfolio content, declining applications, blocking a user, or discarding a campaign draft.
- Maintain bottom-tab state when returning from a secondary screen.

## Implementation Order

1. Add route unions, shared prototype state, shared secondary-screen primitives, toast, and back-navigation behavior.
2. Complete Creator opportunity brief/application and Brand campaign creation flows, because they create data consumed elsewhere.
3. Complete Brand and Creator campaign/workspaces, reviews, submissions, payment, and related status updates.
4. Complete earnings/withdrawal, reports, and analytics.
5. Complete both profile/settings trees and notification centers.
6. Connect all remaining home, Explore, Inbox, and secondary controls.
7. Audit every `<button>` for a handler or intentional disabled state; replace decorative buttons.
8. Add reduced-motion coverage for all new animation classes and perform formatting/build verification.

## Verification

- Run `pnpm format`.
- Run `pnpm build`.
- Manually trace these critical paths in code/state:
  - Brand onboarding → Home → Create campaign → Publish → Campaigns → campaign workspace.
  - Brand Home/Explore → creator profile → booking/request → Inbox chat.
  - Brand campaign → application review → accept → roster update.
  - Brand campaign → submission review → approve → milestone update → payment success.
  - Creator onboarding → Opportunities → brief → apply → Work Applications.
  - Creator incoming request → accept → chat.
  - Creator Work → campaign workspace → submit deliverable → In review.
  - Creator Earnings → withdraw → reduced balance and new transaction.
  - Both role profiles → every menu destination → save/back.
- Confirm all overlays/dialogs close correctly, bottom navigation is hidden on secondary screens, and no dead primary action remains.
- Treat the existing Vite bundle-size warning as non-blocking unless the changes materially worsen it.

## Completion Criteria

- Both role apps remain visually coherent and navigable from onboarding through their complete prototype journeys.
- Every current primary or secondary action has a meaningful connected result.
- Cross-screen state updates are reflected in the related list, tab, badge, balance, campaign, or milestone during the session.
- No backend capability is implied; payment, upload, export, invitation, and support actions clearly behave as prototype simulations.
- Formatting and production build succeed.
