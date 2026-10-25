# NDA I 2026 GAT — first GS batch

Historical first-batch report. For the 25 October continuation and current totals, see [the Q71–100 report](nda-2026-i-batch-2-review.md).

Review date: 24 October 2026. This is a partial local paper review, not a completed-paper claim or release.

## Reconciliation

| Source slots | Outcome in this pass |
|---|---|
| Q1–Q50 | English Part A: outside GS scope; original pages 2–7 inspected. This is not English answer verification. |
| Q51–Q70 | Complete stems and all options transcribed, classified and reread from original English pages 9, 11, 13 and 15. |
| 15 of that batch | Reasoned-verified and added locally: Q51–58, Q61–63, Q65–66, Q69–70. |
| Five of that batch | Held separately: Q59, Q60, Q64, Q67 and Q68. Not imported into scored tests. |
| Q71–Q150 | 80 questions still await this current source-review pass, including 24 already represented historical records. |

Exactly 150 source decisions: 50 out-of-scope + 15 reasoned-verified + 5 quarantined + 80 pending. The broader coverage register counts the five held items within its 85 pending slots, not as completed content/key review.

The active local library grows from 1,813 to **1,828 unique GS MCQs**. NDA I 2026 is a **partial collection of 39 available MCQs**: 24 historical records plus 15 new imports. Availability is not evidence that those 24 have been freshly source-reviewed.

## Evidence and safeguards

- Original Series A paper: `C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2026-1.pdf`; SHA-256 `1cbcd118d94cf5068d8e060a49b9e17609b4c2e533eaeaa245da69b6883bc930`.
- The original cover explicitly identifies NDA & NA Examination (I), 2026, General Ability Test and Series A. The official examination page links the same question-paper document.
- No matching official answer key has been recovered in this pass. **None of the 15 new answers is labelled official-final or official-provisional.**
- Verification uses individually linked NCERT physics chapters, Penn State's nonlinear-pendulum treatment and NASA's Kepler-law explanation, plus explicit derivations and rejection of the alternative options. Downloaded evidence hashes are frozen in `scripts/prelims-reviewed-nda-2026-i-imports.mjs`.
- The cached Prepp-branded answer table is secondary evidence only and is rejected for clearance: opening Q51–Q53 cells conflict with the independently solved original options. No automatic series/option-letter conversion was invented.
- Q57 was magnified to check that the radicals cover the numerical coefficients, not the powers of time. Formulae, superscripts, original option order and the original initial-speed symbol in Q58 are retained.
- The first-pass batch remains a staging record. Only an explicit 15-entry second-pass map controls publication; a first-pass answer alone cannot self-approve.
- The immutable 1,519-record historical bank, all 327 previously approved imports, historical IDs, saved attempts, answer revisions and the Physical Geography registry are preserved. No database write, GitHub push or deployment is included.

## Why five remain held

| Question | Evidence or ambiguity to resolve |
|---|---|
| Q59 | Attach a directly applicable primary metacentric-stability reference; generic buoyancy evidence is insufficient. |
| Q60 | Constant power gives v²=v₀²+2Pt/m. The proposed proportionality assumes a rest initial condition absent from the printed stem. |
| Q64 | The unqualified accelerating-object description needs an explicit decision about the domain before and after crossing the centre/focus. |
| Q67 | Distinguish sharp-tip corona behaviour from the primary protective function of a grounded lightning system, using primary protection evidence. |
| Q68 | Establish whether unspecified liquid entrance/exit and observation geometry justify the blanket unchanged-image statement. |

The two CDS-prefixed IDs now attributed to NDA I Q139/Q146 are flagged for provenance reassessment: their old provisional labels cite a Prepp-hosted document. They are not silently re-verified, duplicated or rewritten by this opening batch.

## Next bounded batch

Continue Q71–Q100 within this same paper. Q72 has an original circuit figure; it must not be imported as a text-only question. Then source-review Q101–Q150, reusing the existing 24 IDs where appropriate, and revisit the five holds. The paper is not complete until all those decisions are reconciled.

Machine-readable register: `content/audits/nda-2026-i-review.json`. Rebuild with `node scripts/build-nda-2026-i-review.mjs`; verify with `--check`.

## Checks completed

172 automated tests passed, including all 15 grading checks, exact answer-free snapshots, numerical cross-checks, source hashes, unchanged legacy membership and held-item exclusion. Three distinct browser tests passed for original equations/units in printable papers, partial Sources status, pagination totals, filtering, mobile width and the prior NDA II provisional-key flow. The build retains its existing chunk-size warning. All five import/review/placement/classification/coverage builders pass unchanged-output checks. All 327 previously approved import objects are unchanged.

The browser check exposed a first-click hydration race in Sources filters. Those controls now stay disabled until their event handlers are ready; no data or question eligibility changes result from that small UI safeguard.

Q57's combining vector arrow was missing from the print font. A presentation-only vector marker now renders it without changing the stored source text or notation. New reasoned-question snapshots carry an answer-free review-status tag; printable keys mark their answers with ‡ and a note explicitly stating that no matching official key was recovered. Old saved snapshot contents remain unchanged.
