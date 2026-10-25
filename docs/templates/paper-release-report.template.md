# Paper completion and release report: [verified paper identity]

Template only. Replace placeholders with actual evidence; do not infer approval
from this file. Follow the [standing SOP](../paper-processing-sop.md) and
[release checklist](../paper-release-checklist.md).

## Identity and review state

- Paper ID / exam / year / session / paper / series / language:
- Original PDF URL, local reference, SHA-256 and page mapping:
- Expected printed numbers and total:
- Paper register / question ledger / exception case references:
- Review date and honest reviewer/pass provenance:
- Source review: pending / complete, with evidence:
- Release: not released / blocked / live verified:

## Reconciliation — source slots, not sums of placements

| Source accounting | Count |
| --- | ---: |
| Expected original source numbers | pending |
| New canonical occurrences | pending |
| Reused canonical occurrences | pending |
| Unresolved source slots | pending |
| Duplicate alias records (separate; not extra source slots) | pending |

Assert expected = new + reused + unresolved. Resolve aliases to their canonical
source occurrence before calculating the following disposition totals.

| Final disposition | Source-slot count |
| --- | ---: |
| official-final | pending |
| official-provisional | pending |
| reasoned-verified | pending |
| withdrawn | pending |
| duplicate | pending |
| quarantined | pending |
| Awaiting review (must be zero for source-review-complete) | pending |

- Sum of mutually exclusive source dispositions plus awaiting review:
- Eligible unique questions / expected original total:
- Section-by-section expected / reviewed / eligible / excluded counts:
- Unavailable original numbers, reasons and exact reopening evidence:
- If eligible < expected: student-facing availability label and full-paper impact:

## Evidence and changes

- Official key issuer, final/provisional status, release date, identity/series,
  URL, preserved hash, cells and two-pass comparison evidence:
- Official search gaps and independently verified question IDs with primary
  locators, option analysis and second review:
- Official drops, multiple-answer cells and runtime behaviour (if applicable):
- Answer changes: ID / before / after / key revision / evidence:
- Reproduction repairs: ID / before / after / content revision / evidence:
- Primary/additional syllabus placements and preparation-target decisions:
- Taxonomy amendments, overlap/dedup counts and source-filter checks:
- Editorial caveats kept separate from official scoring:
- Preserved IDs, aliases, original snapshots and submitted choices:

## Local verification

For each command/check include date, environment, actual result and evidence.

- Checklist gates R1–R10:
- Production build / full automated suite / browser tests / changed-file lint:
- Every accepted and every nonaccepted option grading:
- Withdrawals, former wrong keys, multiple-answer cells where present:
- Historical revision/snapshot and saved-answer safety:
- Import idempotence / expected before-hashes / diff check:
- Full paper and section launch, rapid navigation, reload, submission/results:
- Desktop/mobile and source labels:
- Full PDF path, page count, all-page render review and text/figure checks:
- Every printed key entry compared; delayed/missing-image protection:
- Failures or not-applicable checks with concrete rationale:

## Release and production verification

- Later user restriction, if any; otherwise standing SOP release instruction:
- Intended remote, branches, exact reviewed commit and clean scoped diff:
- Deployment identity, commit match, ready state and evidence:
- Live paper URL; source/section totals and verification labels:
- Live grading and critical browser/PDF evidence:
- Served official-key asset SHA-256 match:
- Inspection/logging limitations and fallback checks actually performed:
- Production failures, fixes and rerun results (retain initial failures honestly):
- Final outcome: live verified / blocked, with specific reason:

Do not mark the release live on push alone. Do not claim background monitoring,
an unperformed human review, or completion of unrelated source-paper queues.
