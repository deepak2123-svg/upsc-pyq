# NDA I 2026 GAT — complete official-key import

Review date: 25 October 2026. This report supersedes the partial-batch and unscored-paper release reports.

## Authority and identity

The matching UPSC **official provisional** answer key has been recovered:

- URL: https://www.upsc.gov.in/sites/default/files/ProvAnsKey%E2%80%93GAT-NDA-I-2026-160426.pdf
- Published: 16 April 2026; four pages, 580,119 bytes.
- SHA-256: `643f6f4a48a6ce137c681ed39bdcfde86aa91f79e222011291cd7a3419c1e806`.
- Reviewed page: 1, Series A, NDA & NA (I) 2026, GAT Paper II. Paper II identifies GAT, not session II.
- All 150 answer cells were transcribed independently by column and by row and compared programmatically. The key records zero dropped questions.
- Preserved unchanged at `public/papers/nda-2026-i-gat/official-provisional-key.pdf`.
- Original question-paper SHA-256: `1cbcd118d94cf5068d8e060a49b9e17609b4c2e533eaeaa245da69b6883bc930`.

The earlier official-key search was incomplete: the recovered filename contains an en dash. Previous claims that the key was unavailable are superseded. The unrelated secondary key previously rejected remains rejected. This release does **not** describe a provisional key as final.

## Reconciliation

| Measure | Count |
| --- | ---: |
| Original numbered questions accounted for | 150 |
| English / Science / GS | 50 / 50 / 50 |
| Official-provisional scored records | 150 |
| Officially dropped / awaiting review | 0 / 0 |
| Existing IDs retained | 63 |
| Newly imported records | 87 |

The raw 1,519-record bank and previous 366-record pilot import remain unchanged. Approved changes are a deterministic overlay, guarded by expected before-hashes. Re-running the builder produces no revision increments or duplicate imports.

## Answer changes and historical safety

- Q58: previous reasoned C → official A.
- Q73: previous reasoned C → official D.
- These two changes have separate answer-key revision entries. Submitted choices are never changed; cached results refresh against the reviewed revisions.
- Existing material-reproduction repairs for Q139 and Q146 retain content revision 1. New complete-paper snapshots carry the correct revisions. Older snapshots that displayed defective content retain the pre-existing safe exclusion rule rather than being graded against wording the student did not see.
- Scientific, grammatical or wording caveats remain separate editorial notes. For faithful reproductions that the official key scores, the official examination answer determines normal grading. Notes neither silently replace that answer nor claim it is an independently established scientific fact.

## Student-facing completion

- `/papers/nda-2026-i-gat` now launches normal scored practice: full paper 150, English 50, Science 50 or GS 50, in original question order.
- Untimed practice and the 150-minute full-paper option are supported. The same frozen question set supports offline PDF generation and the official-provisional answer key.
- The previous unscored scan substitute is no longer the active paper experience. Its local draft storage is not deleted or relabelled as a submitted scored attempt.
- Original English underlining, error-identification segments, paired-word tables and matching tables are retained. Q150 preserves Roman-numeral right-hand list labels.
- Original figures for Q72–75 are included, with asset hashes and print-image readiness checks.
- English and the three defence-exam World History placements are available in NDA/CDS preparation without leaking into CSE GS. Existing target-specific science filtering remains in force.
- The Sources directory reports this paper as a complete 150-question collection with official-provisional verification. Shared placements use canonical-ID unions, not duplicate records.

## Machine-readable evidence

- `content/nda-2026-i-official-paper.json`: full records, official evidence and preserved before-values.
- `content/nda-2026-i-official-review-policy.json`: answer-free review and content revisions.
- `content/nda-2026-i-key-revisions.json`: answer-free correction revision index.
- `content/nda-2026-i-preparation-placements.json`: explicit preparation placements.
- `content/audits/nda-2026-i-review.json`: complete 150-question reconciliation.
- Updated reviewed-placement, classification and source-coverage registers retain all existing exclusions outside this completed paper.

## Verification

Automated checks cover all 150 official answers and an incorrect alternative for every question, original IDs/content, option-letter identity, four figure hashes, source accounting, target-exam boundaries, answer-free snapshots and revision refresh. Browser checks cover full-paper launch, normal submission/results, English formatting, mobile setup, original figures, offline PDF output and missing-image print protection.

The submission test exposed an existing animated-navigation race: old question buttons briefly remained active after the current index changed. Question replacement is now atomic. The new PDF launcher writes its payload to the child window's session storage, and waits for hydration before enabling launch. A full-paper print title avoids dumping every syllabus path into the PDF header. Service-worker registration failure cannot create an unhandled rejection or block practice.

Final local results: production build passed; **180/180 automated tests passed; 8/8 targeted Chromium browser tests passed**. Changed-file ESLint has zero errors (two existing warnings: native original-figure image and anonymous bank export). Official-paper, reviewed-placement, source-coverage and previous pilot-import checks pass. `git diff --check` passes. The final full-paper PDF has 19 pages; rendered English underlining, diagrams, Q150 matching lists and answer-key pages were visually inspected. All 150 printed key letters were compared with the official register. The paper's 150 records are fully resolved; unrelated source-paper import queues are not described as complete.
