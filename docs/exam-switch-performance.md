# Exam switching performance — 26 October 2026

## Changes

- Cache the three static preparation inventories per server module/deployment and deeply freeze them. No user/cart data enters this cache. Eligibility still comes from the reviewed build inputs; deployment invalidates the cache.
- Pass an explorer projection with empty graph edges to the home, preparation and legacy exam entry pages. The inventory API retains its full graph contract. Question membership, taxonomy versions and counts are unchanged.
- Prefetch other exam routes after restoration, staggered at 1.2/2.4 seconds, and on pointer/focus intent. Skip prefetch for Save-Data and reported 2G connections. Use the existing router cache rather than another persistent catalogue cache.
- Announce the target immediately during a navigation transition and prevent conflicting selector clicks.
- Reuse one selection index per inventory object with a WeakMap. Unchanged saved membership restoration retains inventory identity; changed historical memberships still receive a separate projection. Memoize frozen membership independently of folder navigation.

## Measurements

Baseline live Chromium: first switches 726–1,392 ms, repeat client-cached CSE 108–119 ms. With 4x CPU slowdown and a 206-question cart: first switches 1,506–1,742 ms; repeat switches 243–289 ms. No normal-desktop long tasks; slowed CPU produced 60–93 ms tasks. These are samples, not latency guarantees.

Decoded route payload, before / after (local production build after):

| Exam | Before, bytes | After, bytes |
| --- | ---: | ---: |
| NDA | 1,062,036 | 630,801 |
| CSE | 918,399 | 546,218 |
| CDS | 949,076 | 564,431 |

Approximately 40% less decoded route data. Baseline network compression already reduced the former payloads to about 89–101 KB; decoded-byte reductions must not be reported as equivalent network-byte savings.

Local warm NDA inventory endpoint including JSON serialization: about 9 ms after caching versus roughly 65 ms previously. First-generation costs remain, and network/server latency varies.

## Verification

- Production build; complete automated suite (198 passing tests).
- Ten targeted browser tests: prefetch, slow navigation feedback, Save-Data, separate carts and reload, source choices, deep links, desktop/mobile and reduced-motion selector, NDA Mathematics/English/Science landing flows.
- Six additional browser tests passed: online setup, frozen-draft preservation/migration, overlapping additions and exact PDF union, delayed original diagrams and missing-image print protection (16 local browser tests total).
- Public inventory retains graph edges; explorer payload stays below 800 KB; repeated requests do not mutate cached membership.
- Changed-file ESLint passes. Whole-repository ESLint (excluding ignored local scratch artifacts) reports 68 errors and 14 warnings in existing unrelated files, including explicit `any` usage in older browser tests. This release does not claim a clean whole-repository lint result.

No question data, answer keys, source eligibility, saved-attempt format, service-worker policy or infrastructure configuration was changed. Branch-by-branch loading remains a possible later optimisation if post-release measurements justify its added migration complexity.
