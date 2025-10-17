# Onboarding (New User Guidance) — TDD Plan

This document defines a test-first implementation plan for new user onboarding. Each milestone is independently testable: write tests, implement, then iterate to green.

## Confirmed Requirements

- New user definition: no API keys AND no historical credits usage.
- Post-register redirect: when `callbackUrl` points to `/dashboard`, append `welcome=1` and redirect there. Other callback targets unchanged.
- Checklist steps (in order):
  1) Create API Key
  2) Run a test request once
  3) Choose a plan / claim trial
  4) Set language
  - Invite friends: show reward tip only (no step in the checklist)
- Visibility: show up to 7 days or until all steps completed. Allow “Skip”. Auto-collapse when an eligible step is already done (e.g., API key exists or usage > 0).
- Reward copy: show “已发放 X 积分” (X = `CreditsAmount.NewUserGet`).
- Tracking: use Sentry for event collection.
- i18n: all strings go through locales.
- Admin exception: do not show onboarding for `role=admin`.

Confirmed decisions (v1):

- Redirect query merge: preserve existing `callbackUrl` query string and append `welcome=1` (e.g., `/dashboard?a=1` → `/dashboard?a=1&welcome=1`).
- A/B experiments: OFF by default for v1 (feature scaffolding allowed behind flag; no runtime exposure).

## Feature Flags & Config

- `NEXT_PUBLIC_ONBOARDING_ENABLED` (default: `true`) — renders onboarding UI.
- `NEXT_PUBLIC_ONBOARDING_TRACKING` (default: `true`) — sends Sentry events.
- `NEXT_PUBLIC_ONBOARDING_EXPERIMENT` (default: `false`) — enables A/B assignment and reporting when set truthy.
- LocalStorage keys:
  - `onboard.v1.done` — checklist fully completed or dismissed.
  - `onboard.v1.steps` — JSON of step completion booleans.
  - `onboard.v1.firstSeenAt` — ISO timestamp for 7-day window control.

## Testing Conventions

- Test runner: Jest.
- Environments:
  - Component/pages tests: `/** @jest-environment jsdom */` with React Testing Library.
  - API route/service tests: default Node environment.
- Mocking:
  - `next/navigation`: mock `useRouter` (capture `push`, `refresh`) and `useSearchParams` (return a Map-like object with `get`).
  - `next-auth/react`: mock `signIn` returns `{ ok: true }` after successful register.
  - `@/components/auth/GoogleOneTap`: return null to avoid network.
  - Sentry tracking: mock at module boundary (e.g., `@sentry/nextjs`), assert `captureMessage` calls with tags.
  - SWR: prefer testing at component level without altering global config; where needed, stub fetch with `global.fetch = jest.fn()`.
  - Time-based logic: use `jest.useFakeTimers()` and/or inject `Date.now` where necessary.

## Data Sources

- Usage: `GET /api/dashboard` provides `creditStats` and `modelUsages`. We consider “no usage” if `creditStats.month.amount === 0` OR `modelUsages.length === 0`.
- API keys: `GET /api/apikeys` (client-side SWR in WelcomeGuide) to check existence (any status !== 'deleted').

## Sentry Events (when `NEXT_PUBLIC_ONBOARDING_TRACKING=1`)

- `onboarding_started`: shown to user
  - tags: `stepCount`, `role`, `hasApiKey`, `hasUsage`, `variant` (if A/B on)
- `onboarding_step_done`: user marks/auto-detects a step completed
  - tags: `step` (create_key | first_call | choose_plan | set_locale)
- `onboarding_dismissed`: user clicks Skip or wraps up early
- `onboarding_completed`: all steps completed
- `onboarding_callout_shown`: empty-state callout rendered

## i18n Keys (to be added in locales)

- `onboarding.title`, `onboarding.subtitle`, `onboarding.reward` (interpolate X points)
- `onboarding.step.createKey`, `onboarding.step.firstCall`, `onboarding.step.choosePlan`, `onboarding.step.setLocale`
- `onboarding.cta.createKey`, `onboarding.cta.firstCall`, `onboarding.cta.choosePlan`, `onboarding.cta.setLocale`, `onboarding.cta.skip`, `onboarding.cta.done`
- `onboarding.tip.inviteReward`
- `onboarding.callout.noUsage.title`, `onboarding.callout.noUsage.desc`, `onboarding.callout.noUsage.cta`

## Milestone 1 — Post-register welcome redirect

Goal: After successful registration and auto-login, redirect to `/dashboard?welcome=1` if `callbackUrl` resolves to `/dashboard`.

Tests (add first): `tests/pages/Signin.redirect.welcome.test.tsx`

- Scenario A: `callbackUrl='/dashboard'`
  - Mock `useSearchParams` to return `{ callbackUrl: '/dashboard' }`.
  - Mock `signIn` to resolve `{ ok: true }`.
  - Expect `router.push('/dashboard?welcome=1')`.
- Scenario B: `callbackUrl='/dashboard?a=1'` (pending confirmation to preserve query)
  - Expect `router.push('/dashboard?a=1&welcome=1')`.
- Scenario C: `callbackUrl='/somewhere'`
  - Expect `router.push('/somewhere')` (unchanged).

Notes:
- Keep login flow consistent; only enhance the registration success path. If auto-login fails, fallback to original behavior.

Implementation:

- Modify `app/auth/signin/page.tsx` after register→auto login: decide redirect target according to rules above.

Acceptance:

- Tests pass. Existing login flow unaffected.

## Milestone 2 — WelcomeGuide component

Goal: A dismissible onboarding card showing a 4-step checklist, reward copy, and CTAs that trigger parent callbacks. Default show when user qualifies; hides on completion/skip.

Tests (add first): `tests/components/WelcomeGuide.test.tsx`

- Renders title, reward text (“已发放 X 积分”).
- Displays 4 steps with i18n labels in order.
- Clicking “我已完成/完成” on each step toggles state; completion persists in `localStorage`.
- “跳过” sets `onboard.v1.done='1'` and hides the card.
- Fire Sentry events when shown, step-done, dismissed, completed (mock Sentry).
- CTA buttons call props: `onGotoApiKeys/onGotoPlans/onGotoProfile/onGotoSetLocale`.

Edge cases to cover:
- When user already has API key(s), the “Create API Key” step is pre-marked.
- When usage exists (`creditStats.month.amount>0` or `modelUsages.length>0`), pre-mark “Run a test request”.
- Admin role: component hidden (via prop `isAdmin` or do-not-render gate in parent). Ensure no Sentry event fires when not rendered.

Implementation:

- Add `components/dashboard/WelcomeGuide.tsx`.
- Props: navigation callbacks + `onDismiss`.
- Internal SWR fetch to `/api/apikeys` to auto-mark createKey step if key exists.
- Auto mark firstCall if `/api/dashboard` stats/usage show activity.
- Respect admin exception (prop or context user info passed down; otherwise hide if `role==='admin'`).

Acceptance:

- Component tests green; UI renders with real i18n strings when keys are added.

## Milestone 3 — Integrate WelcomeGuide into Dashboard

Goal: Show WelcomeGuide on `/dashboard` when `welcome=1` OR within 7 days from `firstSeenAt` and the user qualifies as “new”. Provide navigation to tabs.

Tests (add first): `tests/pages/dashboard.onboarding-visibility.test.tsx`

- With `welcome=1`, shows the guide on first render; dismiss sets localStorage and hides it.
- When `onboard.v1.done='1'`, not shown even with `welcome=1`.
- Clicking “创建 API Key” switches `activeTab` to `api-keys`; other CTAs similarly.

Edge cases:
- `onboard.v1.firstSeenAt` older than 7 days: do not show unless `welcome=1` present.
- `welcome=1` present but `onboard.v1.done='1'`: do not show.
- Admin role: never show.

Implementation:

- Modify `app/dashboard/page.tsx` to
  - Read search params and localStorage to decide visibility.
  - Render `WelcomeGuide` above main content; pass `setActiveTab` callbacks.
- No backend change.

Acceptance:

- Tests pass; no regression in dashboard rendering.

## Milestone 4 — No-usage Callout

Goal: Reinforce empty state with a callout prompting API key creation when there’s no recent usage.

Tests (add first): `tests/components/NoUsageCallout.test.tsx`

- When month usage is 0 (or `modelUsages.length===0`), renders callout with CTA to create API key.
- Clicking CTA triggers parent `onNavigateTo('api-keys')`.

Implementation:

- Add `components/dashboard/NoUsageCallout.tsx`.
- Integrate into `components/dashboard/DashboardContent.tsx` (top of main/side content), pass-through navigation callback.

Acceptance:

- Tests pass; callout coexists with chart layout.

## Milestone 5 — Welcome Email

Goal: After successful registration and bonus grant, send a welcome email with quick-start pointers.

Tests (add first):

- `tests/service/welcome-email.test.ts` — mock transporter; assert subject/from/html contain expected strings.
- `tests/api/auth.register.welcome-email.test.ts` — mock verification, user creation, and `sendWelcomeEmail`; assert it’s called on successful register (non-blocking on failure).

Implementation:

- Add `sendWelcomeEmail(to)` to `app/lib/email.js` and call it in `app/api/auth/register/route.js` after bonus grant.

Acceptance:

- Tests pass; SMTP-configured envs can send real emails.

## Milestone 6 — Tracking (Sentry)

Goal: Central helper to send onboarding events to Sentry with consistent tags.

Tests (add first): `tests/service/onboarding.tracking.test.ts`

- Mock Sentry; assert `captureMessage` called with proper name and tags for show/step/dismiss/complete.

Implementation:

- Add `lib/track.ts` exporting `trackOnboardingEvent({ name, tags })`.
- Call from `WelcomeGuide` and `NoUsageCallout` when enabled.

Acceptance:

- Tests pass; events only fire when flag enabled.

## Milestone 7 — i18n

Goal: Add all onboarding keys in locales and verify rendering in multiple languages.

Tests (add first): `tests/i18n/onboarding.i18n.test.tsx`

- Render `WelcomeGuide` with mocked `useT()`; assert Chinese/English strings.

Implementation:

- Add keys to `locales` (zh/en). Wire up components to use `useT().t`.

Acceptance:

- Tests pass; no missing keys.

## Milestone 8 — Optional A/B Experiments (Pending Enablement)

Value: Compare different onboarding variants (e.g., banner vs card; 4 steps vs 3 steps), measure lift in activation (API key created or first usage) and TTV. Useful to iterate toward the most effective guidance.

Design:

- Assignment: cookie `onboarding_variant=A|B` (or persisted in user meta); ratio configurable.
- Exposure: variants control UI form-factor or copy.
- Measurement: use Sentry tags `variant=A|B` + conversion events (API key create / first usage).
- Disable by default; behind flag `NEXT_PUBLIC_ONBOARDING_EXPERIMENT`.

Tests (add first): `tests/service/onboarding.ab-assign.test.ts`

- Variant assignment stable per user; Sentry tags include variant.

Implementation (later if enabled):

- Small wrapper to read/write the variant cookie and expose to components.

Acceptance:

- Tests pass; experiments can be turned on/off without code change.

## Metrics & Acceptance

- Activation: user creates API key or records first usage within 24h.
- TTV: time from registration to first usage.
- Retention: D1 / D7.
- Onboarding completion rate: fraction of users finishing all steps.

## Rollback Plan

- Flip `NEXT_PUBLIC_ONBOARDING_ENABLED=false` to hide UI instantly.
- Revert redirect logic by guarding with env flag.

## Implementation Checklists Per Milestone

- Before coding: write the tests, commit tests.
- Implement minimal code to satisfy tests.
- Run tests locally; ensure only relevant scope is changed.
- If breakages occur, refine implementation without widening scope.
- Record Sentry event taxonomy in code comments where tracking is called.

## Test Execution

- Run all onboarding-related tests:
  - `npm test -- -t "onboarding"`
  - or per file, e.g., `npm test -- tests/pages/Signin.redirect.welcome.test.tsx`

---

Appendix: Step Completion Logic

- Create API Key: completed if `/api/apikeys` returns at least one non-deleted key.
- Run a test request: completed if dashboard usage shows any model usage or monthly amount > 0.
- Choose plan / trial: completed if `userPackage` present in `/api/dashboard` and `isActive=true`.
- Set language: completed if `userInfo.locale` present; CTA navigates to Profile page or language selector.

---

# Session Update — Implemented Milestones 1–8 (tests-first)

This section summarizes the concrete changes implemented during this session, aligned with the TDD plan.

1) Milestone 1 — Post-register welcome redirect
- Tests: `tests/pages/Signin.redirect.welcome.test.tsx`
- Impl: `app/auth/signin/page.tsx` — after successful auto-login, if `callbackUrl` path is `/dashboard`, preserve original query and append `welcome=1`.

2) Milestone 2 — WelcomeGuide component (full card)
- Tests: `tests/components/WelcomeGuide.test.tsx`
- Impl: `components/dashboard/WelcomeGuide.tsx`
  - Full card: title/subtitle, reward copy, 4-step checklist, Skip, auto pre-marking (API Key/usage), Sentry tracking, server sync.
  - Local persistence: `onboard.v1.steps`, `onboard.v1.done`, `onboard.v1.firstSeenAt`.

3) Milestone 3 — Dashboard integration
- Tests: `tests/pages/dashboard.onboarding-visibility.test.tsx`
- Impl: `app/dashboard/page.tsx`
  - Renders `WelcomeGuide` at the top.
  - Visibility rules: `welcome=1` OR within 7 days unless done.
  - Adds mounted guard to avoid hydration mismatch; wraps container with `suppressHydrationWarning`.
  - Navigation callbacks switch tabs (api-keys/plans/profile).

4) Milestone 4 — No-usage Callout
- Tests: `tests/components/NoUsageCallout.test.tsx`, `tests/pages/dashboard.no-usage-callout.test.tsx`
- Impl: `components/dashboard/NoUsageCallout.tsx`, integrated in `components/dashboard/DashboardContent.tsx`.
  - CTA routes to API Keys; independent from the Welcome card.

5) Milestone 5 — Welcome email
- Tests: `tests/service/welcome-email.test.ts`, `tests/api/auth.register.welcome-email.test.ts`
- Impl: `app/lib/email.js` adds `sendWelcomeEmail(to)`; `app/api/auth/register/route.js` calls it after granting bonus (best-effort, non-blocking).

6) Milestone 6 — Tracking (Sentry)
- Tests: `tests/service/onboarding.tracking.test.ts`
- Impl: `lib/track.ts` calls `@sentry/nextjs.captureMessage(name, { level: 'info', tags })` when `NEXT_PUBLIC_ONBOARDING_TRACKING` is truthy.
- Stubs extended: `tests/obs/stubs/sentry-nextjs.ts` records messages for assertions.

7) Milestone 7 — i18n
- Tests: `tests/i18n/onboarding.i18n.test.tsx`
- Impl: adds `locales/en/onboarding.json`, `locales/zh/onboarding.json`; updates `locales/index.ts` and `app/layout.tsx` to load the `onboarding` namespace.

8) Milestone 8 — Cross-device state
- Tests: `tests/api/onboarding.state.test.ts`, `tests/pages/dashboard.onboarding-sync.test.tsx`
- Impl: `app/api/onboarding/state/route.ts` (GET/POST) to read/write onboarding state in `user_meta` (jsonb).
- Client sync:
  - `app/dashboard/page.tsx`: GET on mount; merges server state (done/firstSeenAt) with local.
  - `components/dashboard/WelcomeGuide.tsx`: POST on step done, skip, and completion.

Hydration fixes
- `app/dashboard/page.tsx` renders the Welcome card only after client mount (`mounted && showWelcome`) and uses `suppressHydrationWarning` to prevent SSR/CSR mismatch errors.

Full card vs Callout
- The full Welcome card (top of page) coexists with a content-area No-usage Callout. The Callout shows when recent usage is zero; it is separate from the full onboarding card.
- To force the full card for demos/onboarding: visit `/dashboard?welcome=1`.

Resetting state for QA
- Local reset (console):
  - `localStorage.removeItem('onboard.v1.done')`
  - `localStorage.removeItem('onboard.v1.steps')`
  - `localStorage.removeItem('onboard.v1.firstSeenAt')`
- Server reset: `POST /api/onboarding/state` with body `{"done":false,"steps":{},"firstSeenAt":null}`.

Feature flags
- `NEXT_PUBLIC_ONBOARDING_ENABLED` — UI on/off (policy-level; UI currently guards in code).
- `NEXT_PUBLIC_ONBOARDING_TRACKING` — Sentry tracking on/off ('1'|'true' to enable).
- `NEXT_PUBLIC_ONBOARDING_EXPERIMENT` — A/B scaffolding off by default.

Open option
- Optionally hide No-usage Callout when the full Welcome card is visible to reduce visual redundancy.
