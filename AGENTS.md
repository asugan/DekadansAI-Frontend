# Analytics Tracking — Mixpanel

This project uses **Mixpanel** for all product analytics. Mixpanel is the single source of truth for event tracking, user identification, and behavioral data. Do not introduce any other analytics tools, SDKs, or tracking libraries without explicit instruction from a user.

---

## Before You Add or Modify Any Tracking

**Do not write Mixpanel tracking code without reading this file first.**

Wrong assumptions about platform, identity, or consent will produce broken Mixpanel data that requires manual cleanup or data deletion requests.

### Mandatory checklist before writing any Mixpanel code

- [ ] Confirm you are using the correct Mixpanel SDK for this project's platform (see Tech Stack below)
- [ ] Check if this project routes data through a CDP — if yes, send Mixpanel events through the CDP, not the Mixpanel SDK directly
- [ ] Check if consent gating is required — if this project serves EU or California users, no Mixpanel events may fire before user consent
- [ ] Review the existing Mixpanel tracking plan below before adding new events

---

## Tech Stack

| Detail | Value |
|---|---|
| **Platform** | Next.js 16 (App Router), React 19, TypeScript |
| **Mixpanel SDK** | mixpanel-browser |
| **SDK version** | ^2.80.0 |
| **Tracking method** | client-side |
| **CDP (if any)** | none |
| **Consent required** | yes (EU and CA users) |
| **Mixpanel project token location** | .env → `NEXT_PUBLIC_MIXPANEL_TOKEN` |

---

## Mixpanel Initialization

Mixpanel is initialized in:

**File:** `lib/mixpanel.ts`

```
// Mixpanel is initialized lazily on first access (client-side only).
// The SDK is initialized with opt_out_tracking_by_default: true so no events
// fire until the user explicitly consents via the consent banner.
// After consent, setConsentGranted() calls mixpanel.opt_in_tracking().
```

**Do not:**
- Initialize Mixpanel in multiple places
- Create separate Mixpanel instances per component or module
- Import mixpanel-browser directly in feature files — use the shared helpers in `lib/mixpanel.ts`

---

## Mixpanel Consent Gate

This project serves users in the EU and California. Mixpanel is initialized with `opt_out_tracking_by_default: true`. No events fire until the user explicitly accepts tracking via the consent banner (`app/consent-banner.tsx`).

- `setConsentGranted()` — called when user clicks "Accept" on the consent banner. Enables tracking.
- `setConsentDeclined()` — called when user clicks "Decline". Disables tracking and clears stored data.
- Consent state is persisted in `localStorage` under key `dekadans_analytics_consent`.

---

## Mixpanel Identity

Mixpanel identity is managed through two calls:

| Action | When to call | Code location |
|---|---|---|
| `mixpanel.identify(user_id)` | On dashboard load after social auth sign-in | `app/dashboard/page.tsx` |
| `mixpanel.reset()` | On sign-out | `app/home-nav.tsx` |

**Rules:**
- Call `mixpanel.identify()` with a stable, internal user ID (database ID or UUID) — never use email addresses as the Mixpanel distinct_id
- Call `mixpanel.identify()` **after** the user record is confirmed (after session is available, not on form submit)
- Call `mixpanel.reset()` on every logout path — this clears the Mixpanel distinct_id and generates a new anonymous ID
- Never call `mixpanel.identify()` with a different user ID without calling `mixpanel.reset()` first

---

## Mixpanel Tracking Plan

These are the Mixpanel events currently tracked in this project. **All new Mixpanel events must follow the same conventions.**

### Naming conventions

- Mixpanel event names: `snake_case`, past tense verb + noun (e.g., `report_generated`, `item_added_to_cart`)
- Mixpanel property names: `snake_case` (e.g., `sign_up_method`, `plan_type`)
- No abbreviations in Mixpanel event or property names — use full words
- Boolean Mixpanel properties: use `is_` prefix (e.g., `is_first_time`)

### Current Mixpanel events

| Mixpanel Event | Trigger | Key Properties | File |
|---|---|---|---|
| `sign_up_completed` | User first lands on dashboard after social auth | `sign_up_method` ("social"), `platform` ("web") | `app/dashboard/page.tsx` |
| `checkout_started` | User clicks a plan checkout button | `plan_slug`, `plan_name`, `source` ("homepage" or "dashboard"), `platform` ("web") | `app/pricing-plan-action.tsx`, `app/dashboard/page.tsx` |
| `checkout_completed` | Checkout return with billing now active | `plan_slug`, `plan_name` | `app/dashboard/page.tsx` |
| `api_key_created` | API key successfully created | `is_key_name_provided` | `app/dashboard/page.tsx` |
| `customer_portal_opened` | User opens Polar customer portal | `platform` ("web") | `app/dashboard/page.tsx` |
| `subscription_cancelled` | Billing transitions active to inactive after portal visit | `plan_slug`, `plan_name` | `app/dashboard/page.tsx` |
| `page_viewed` | Route change (client-side navigation) | `page_path`, `page_name`, `platform` ("web") | `app/page-view-tracker.tsx` |

---

## How to Add a New Mixpanel Event

1. **Check the tracking plan above** — if the Mixpanel event already exists, use it. Do not create duplicate Mixpanel events.
2. **Name the Mixpanel event** using the conventions above: `snake_case`, past tense, descriptive.
3. **Define Mixpanel properties** — only include properties available at the moment the event fires. Do not fetch additional data just for Mixpanel tracking.
4. **Place the Mixpanel tracking call** at the right moment:
   - Track Mixpanel events **after** the action succeeds (after DB write, after API response), not on button click or form submit
   - Track Mixpanel events **after** `mixpanel.identify()` if the event is tied to a logged-in action
5. **Update this file** — add the new Mixpanel event to the tracking plan table above.
6. **Verify in Mixpanel Live View** — confirm the event appears in Mixpanel with correct properties before considering it done.

### Mixpanel event template

```
// Track [description of what happened] in Mixpanel
import { track as mixpanelTrack } from "@/lib/mixpanel";

mixpanelTrack("[event_name]", {
  property_name: value,
  property_name: value,
});
```

---

## What Not to Do

- **Do not introduce other analytics tools.** This project uses Mixpanel. All tracking goes through Mixpanel.
- **Do not track Mixpanel events on page load** unless explicitly measuring page views. Mixpanel events represent user actions, not navigation.
- **Do not track PII as Mixpanel properties** — no emails, full names, phone numbers, IP addresses, or payment details in Mixpanel event properties.
- **Do not fire Mixpanel events inside loops** — each Mixpanel event call is a network request.
- **Do not hardcode the Mixpanel project token** — read it from `NEXT_PUBLIC_MIXPANEL_TOKEN` in the environment.
- **Do not skip `mixpanel.reset()` on logout** — failing to reset causes Mixpanel to merge the next user's events with the previous user's profile.
- **Do not call `mixpanel.identify()` before the user is authenticated** — premature identification creates orphaned Mixpanel profiles.
- **Do not fire Mixpanel events before consent** — this project serves EU and CA users. All tracking calls must respect the consent gate.
