Persisted SWR Cache

Scope
- Adds a cache-first experience for selected API endpoints using SWR + localStorage persistence.
- Endpoints (allowlist):
  - `/api/referrals/summary`
  - `/api/referrals/invites`
  - `/api/packages/credits`
  - `/api/apikeys`
  - `/api/dashboard` (and subpaths)

TTL
- Soft TTL: 5 minutes (kept and revalidated in the background).
- Hard TTL: 24 hours (dropped on load if exceeded).

Behavior
- On mount: reads cached data immediately for allowed keys, then revalidates.
- On updates: writes back to localStorage with a small debounce.
- Persistence only runs in the browser; SSR is unaffected.
- UI "last updated" indicator is disabled by request.

Implementation
- Provider: `createPersistedSWRProvider` in `lib/cache/swrPersist.ts`.
- Wired in `app/providers.tsx` via `<SWRConfig provider=...> ... </SWRConfig>`.
- IndependentPackages refactored to SWR to benefit from persistence.
- ReferralContent already used SWR and automatically benefits.

Testing
- `tests/components/PersistedSWR.provider.test.tsx`: unit test for provider (cache-first, update, persist, hard TTL drop).
- `tests/components/ReferralContent.cache-persist.test.tsx`: renders cached summary/invites first, then fresh.
- `tests/components/IndependentPackages.cache-persist.test.tsx`: renders cached packages first, then fresh.

Feature Flag
- If needed, the provider can be disabled by removing it in `app/providers.tsx` or by guarding with an env var (not enabled by default to keep changes minimal).

