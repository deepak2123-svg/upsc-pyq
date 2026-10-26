# NDA I 2025 GAT — completion and release record

Reviewed 26 October 2026 under the standing paper-processing SOP.
State: **complete and production verified**.

## Source and reconciliation

- Original `GAT/2025-1.pdf`: NDA & NA Examination (I), 2025, GAT, Series A,
  48 PDF pages, 150 questions, 600 marks, 150 minutes.
- Original SHA-256: `9dfd572ed540e3bdbdcafec0e0d1d123f608cf6b47f0abc3df3993cb9fefeaee`.
- English Part A pages 2–11; Part B English pages 13–43, odd-numbered.
- **126 new source occurrences + 24 reused canonical IDs = 150**. No aliases
  are newly created. Raw records, original IDs, saved snapshots and submitted
  choices are preserved.
- Dispositions: **official-final 150**; provisional, independently verified,
  withdrawn, duplicate, quarantined and awaiting review: **zero each**.
- Source review complete and **150/150 available for scored practice**.
- Preparation groups: **English 50, Science 49, GS 51**. These are tested-concept
  groups rather than contiguous source ranges. Q51 Industrial Revolution is
  defence World History; Q147 tidal energy is GS/Environment, not Chemistry.

## Authentic answer evidence

Recovered directly from UPSC:
[official final key](https://www.upsc.gov.in/sites/default/files/AnsKey-NDANA-I-2025-GAT-291025.pdf).
Preserved asset: `/papers/nda-2025-i-gat/official-final-key.pdf`.

Key SHA-256: `115854bdc3436903717b3f7cc87b9786aad3d840280e3af30b965b5231872c88`.
The four pages cover Series A/B/C/D; Series A is page 1. Its header confirms
150 total, zero dropped, 150 scored. Column-first and row-first visual
transcriptions agree on every cell. No release date is inferred solely from
the filename or PDF creation metadata. Secondary/coaching keys are not authority.

Two previous accepted answers change: **Q86 C → D; Q102 A → C**. Separate key
revisions invalidate stale feedback while keeping selected answers intact.
Q102's official C (Sikkim) conflicts with the earlier reasoned forest-percentage
answer; the original wording and option order remain, with an explicit caveat.
Other academic/wording disagreements are likewise caveats, not forced unscored
questions or silently altered official answers.

## Reproduction and classification

Every stem and all 600 options visually compared with the original pages;
a fresh reverse-page-order second pass by the same AI reviewer followed.
No independent human review is claimed. The signed source audit, immutable
raw-before hashes, exact manual transcription modules and two key passes are
linked from `content/audits/nda-2025-i-review.json` and the paper register.

Restored the Q1–5 common passage, all necessary English directions, underlined
words and PQRS fragments, matching tables Q62/81/84, Roman statements Q100,
chemical formulas, mathematical symbols, units and exponents. No required
original diagram occurs in this paper. Old Q62's column-code representation is
rendered explicitly as A/B/C/D matching pairs without changing option meaning.
The 24 prior option sets retain their meaning and order. Existing material
content revisions remain; no old snapshot is silently rewritten.

Every question has a specific primary location, rationale and separate concept
review. English, school Science and defence World History have explicit NDA/CDS
placements; they are not automatically included in CSE GS. Economic Current
Affairs are mirrored in Economy with canonical-ID deduplication. Static and
event-based tags remain distinct. Added bounded subparts for colonial local
self-government, constitutional-politics chronology and Industrial Revolution
phases/industries. Physical Geography remains 11 chapters and 92 subparts;
Current Affairs retains its seven sections.

## Runtime safeguards and counts

- Canonical overlays are deterministic and guarded by all 24 expected raw
  record hashes, transcription/classification input hashes and source/key hashes.
- Source, identity, eligibility and placements feed the existing inventory,
  snapshot, grading, saved-review and PDF paths; no competing bank or database
  migration/import is introduced.
- Answer-free snapshots contain no accepted answers or explanations.
- Six old quarantine decisions are superseded by matching official-final
  evidence; the historical policy file remains preserved.
- Retired V3 inventory memberships now use the same frozen-ID gate as their
  snapshot endpoint. Clearing a previously held item cannot broaden an old
  implicit selection. Current V4 paper membership includes all 150.
- Key corrections refresh cached results without altering submitted choices;
  materially defective historical revisions retain exclusion protection.

Reconciled local totals: global GS **1,942**, NDA preparation **2,129**, CSE
preparation **1,825**, source directory **2,247** across **58** source groups.
The bank contains 2,271 canonical records including ineligible/out-of-scope
records. View/subject totals overlap and must not be summed.

## Local verification

| Gate | Result |
|---|---|
| Production build and full automated suite | 196 passed; zero failures |
| New-paper browser checks | Five passed: full attempt, reload/results, PDF and all three sections |
| Prior-paper/preparation/Science checks | Eight passed on isolated output paths |
| Required-image delay/failure checks | Two passed; incomplete printing remains blocked |
| All four options through grading | 600 decisions: 150 accepted, 450 rejected, zero excluded |
| Former Q86/Q102 keys | Rejected; official replacements accepted |
| Full PDF | 17 pages; every rendered page visually inspected |
| Printed key | Every one of 150 cells compared with reviewed official answers |
| PDF text audit | All 600 options and prompt lines present; zero missing text |
| Hash guards and applicable builder idempotence checks | Passed |
| Changed-code ESLint / diff checks | Zero errors / clean |
| Standalone TypeScript | Ten pre-existing diagnostics; not represented as passing |

The TypeScript diagnostics remain in admin import, D1 example/worker types and
existing nullable syllabus-parent lookups; none concerns this paper's new
components/data. A first unrestricted run also scanned a temporary archived
checkout; the current-source rerun excluded QA archives and confirmed ten.
Overlapping browser runs initially collided in Playwright trace cleanup; the
affected preparation and print-asset checks passed when rerun with separate
output directories. Assertions were not disabled. Newly changed library totals
and official clearances replace stale expectations explicitly.

QA artifacts remain local under `tmp/nda-2025-i/`. Unreviewed intake/OCR drafts,
prior-paper staging, browser traces and generated QA PDFs are not committed.

## Production release

Release commit: `c8112cbe9a6a449b14366e0176cd85ef4e7ef105`, pushed atomically to
`main` and `codex/pyq-selection-flow`. GitHub Production deployment `7331201808`
reports success for that exact SHA.

Live page: https://upscpuraan.vercel.app/papers/nda-2025-i-gat

Production checks passed on 26 October 2026:

- All 600 grading decisions matched: 150 accepted, 450 rejected, zero excluded.
- Served official-key SHA-256 matches the reviewed original bytes above.
- All 150 appear in NDA; English, school Science and defence World History
  remain outside automatic CSE GS membership. Counts match the local totals.
- Eight production browser checks passed: full-paper attempt, saved answers,
  reload, submission/results/caveat review, full offline PDF and all 150 printed
  answers, exact English/Science/GS section membership, numbered Science chapters,
  preparation/source controls, separate carts and mobile navigation.
- Production PDF is 17 pages, all 600 options/prompt lines present; every page
  rendered and visually inspected. Production font metrics differ from local
  rendering but there is no clipping, missing symbol or broken matching table.

The linked machine-readable release record updates the paper register separately
from immutable source/editorial approval. This follow-up changes only release
documentation and register generation; question, answer and taxonomy payloads
remain unchanged. Next queued paper: **NDA II 2024 GAT**.

Deployment evidence uses GitHub's Production status for the intended commit;
authenticated Vercel runtime logs, drains and monitoring were not inspected.
