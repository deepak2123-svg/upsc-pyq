# NDA II 2024 GAT release report

27 October 2026. Paper data/review details: `nda-2024-ii-processing.md`.

## Reconciliation

- Source: 150 numbered occurrences = 128 new + 22 reused; zero duplicate aliases.
- Dispositions: 136 reasoned-verified + 14 quarantined = 150. No official-final,
  official-provisional, withdrawn or duplicate disposition was inferred.
- Scored: 46 English + 43 Science + 47 GS = 136; 116 newly eligible, 20 reused.
- Two formerly available records (Q110/Q139) now quarantined; 12 new occurrences
  remain held. The list and reopening evidence are explicit in the processing log.
- Q107 material options repair: content revision 1, historical revision 0 excluded.
- Candidate scan provenance remains unauthenticated. It is not an official-key
  asset. All cleared answers have individual primary reasoning and a distinct
  same-AI review. No independent human review is claimed.
- CSE GS inventory: 1,942 -> 1,967 unique questions (+27 newly eligible GS,
  -2 new holds). NDA English: 200 -> 246. Subject overlap is not summed.
- Modern industries added as a bounded History leaf; Physical Geography unchanged.

## Local gates

| Gate | Result / evidence |
|---|---|
| Source identity/range/reuse | Passed, original PDF and all 22 before-record hashes checked |
| Reproduction | Passed, 150 first comparisons and fresh reverse-page reread; seven original crops |
| Classification | Passed, primary/additional paths and fresh concept/applicability review per slot |
| Answer review | Complete: 136 cleared, 14 defensible quarantine outcomes, zero awaiting review |
| Exhaustive grading | Passed all 544 accepted/rejected option decisions and historical exclusions |
| Production build/full suite | `npm test`: 201 passed, 0 failed |
| New paper browser | `npx playwright test tests/browser/nda-2024-ii.spec.ts`: 6 passed |
| Existing-flow regression | NDA I 2025, preparation-exams, print-assets: 9 passed |
| PDF | All 136 printed answers match; five decoded images; all 16 rendered pages inspected |
| Historical Q107 | Old C/D options remain displayed, excluded in results/PDF; current revision scores |
| Delayed/missing images | Existing delayed-image regression and new missing-image fault test pass |
| Determinism | Source/reasoned/runtime builders and taxonomy `--check` pass; reruns identical |
| Changed-code ESLint | 0 errors; three pre-existing warnings (default export, two unused test locals) |
| Global TypeScript | Not clean: existing admin/example/worker/optional-parent errors and old tmp baseline files; no new paper/source component error. Explicit catalogue type bounds fix JSON-union explosion. |
| Scope | No raw-bank mutation, database migration/import, infrastructure change or unrelated paper |

The failed first browser run was a test expectation issue, not suppressed: PDF
answers include the existing `‡` independently-verified marker, and fault injection
must bypass the PWA service-worker cache. The corrected test asserts the full marker
and blocks workers only inside the fault-test group. Normal flows still exercise PWA.
The initial full-suite count failures were reconciled to exact new membership;
the historical-correction test now uses the effective merged review policy.

## Deployment gate

State: **data release live-verified** on 27 October 2026.
Commit `be411a90655bcd7551eb12c3a1308090edcc3b13` pushed to main and
codex/pyq-selection-flow by normal fast-forward push. GitHub's Vercel context
reported success for that exact SHA, deployment
`rviVnoYczLGq6YGmaZ33iZQLPJ9U` in project upscpuraan under
deepakkarnal321-1406s-projects. Public URL: <https://upscpuraan.vercel.app>.
The Vercel connector required reauthentication; GitHub status plus public API
and browser checks supply confirmation. Authenticated runtime error logs/drains
were not available or inspected; no clean-log/monitoring claim is made. No
credentials or platform settings changed.

Read-only production verification command:

`node scripts/check-nda-2024-ii-release.mjs https://upscpuraan.vercel.app`

This command passed twice: 136 eligible IDs, 14 held IDs absent, 544 option
decisions, three historical exclusions, five served figure hashes and honest
Sources disclosure. Production English inventory is 246.

All six distinct production browser scenarios passed: full-paper membership,
rapid answering/reload/submission/mobile, three exact sections, PDF and historical
Q107/image failure. Five passed in the first run; the last scenario initially
waited for a pending answer-key request instead of reaching the image-decode
gate. The image request itself was correctly aborted. A fresh retry then hung
on an unrelated archive-workspace JS load; the asset separately returned HTTP
200. The fault test now seeds storage from a light same-origin static page,
uses DOM-content readiness plus explicit UI assertions, and omits the separately
tested full key while injecting the image failure. It then restores normal key
export for historical Q107. The isolated production rerun passed, with no app
runtime workaround, timeout increase or weakened image/error assertion.

The production PDF has 17 pages with the deployed fonts (local dev export had
16). Every page was rendered/visually inspected, all five figures present and
all 136 source numbers found. Every printed answer compared equal to the review.
Official-key hash is N/A: no authenticated official asset was published.
This report follow-up changes test isolation and release metadata only; it does
not change any question, answer, eligibility or figure. Do not describe this
paper as all 150 scored or official-key verified.
