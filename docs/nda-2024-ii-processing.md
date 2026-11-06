# NDA II 2024 GAT - complete paper processing

6 November 2026. Source review: **150/150 accounted for**. Scored availability:
**149/150**; Q123 is withdrawn. Production verification is separately recorded in
`nda-2024-ii-release.md`; do not infer deployment from this document.

## Identity, reproduction and reconciliation

- Series A, SURN-A-GAT; 150 questions, 600 marks, 150 minutes; exam 1 September 2024.
- Original: `C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2024-2.pdf`, 48 pages.
- SHA-256: `f29ca30df4cc2a58ab10f0784041075444edf1e3631fbde47e96a05482c7e819`.
- Printed/PDF numbers agree. English Q1-50: PDF 2-9; Part B English: odd pages
  11-43, Hindi: even 10-42; rough work 44-47, English instructions 48.
- **128 new source occurrences + 22 reused IDs = 150**, no duplicate aliases.
  Two historical CDS-prefixed IDs remain unchanged, with NDA source identity.
- All stems/options, statements, directions, cloze/reading passages and underlining
  visually compared with original renders, then reread in reverse-page order.
  Same AI reviewer in both passes, not independent human review.
- Seven original figure crops, hashes and page bounds in
  `content/audits/nda-2024-ii-figure-manifest.json`: Q64,67,69,70,71,72,125.
  All seven are cleared. No replacement diagrams were invented.
- Q91 duplicated printed `(c)` labels retained in `originalOptionLabels` and
  a source caveat. A-D in the app denote unchanged option positions.
- Existing Q107's C/D matching codes were materially mistranscribed. Restored
  C `A-1, B-2, C-3, D-4` and D `A-1, B-3, C-2, D-4` from source page 29.
  Content revision 0 becomes 1. Old snapshots keep original options and are
  excluded rather than graded against a question the student never saw.

## Answer provenance and decisions

Preserved archived final key: `../data/nda_answer_sources/answer_keys/2024_II.pdf`, SHA-256
`9086a5382ac12ea9b266786419d0689b88c15b00ad80d34ca755be3c0ee4ae95`.
The specific Prepp row links the preserved mirror:
<https://prepp.in/nda-exam/question%20paper%202024>.
Two visual Series A transcriptions agree on all 150 cells; Q123 is marked X.
The four-page scan identifies NDA & NA-II Exam 2024, GAT, all four series,
150 total questions, one dropped question and 149 questions taken for scoring.
Its issuer URL was not recovered, so the app labels it honestly as an archived
final key rather than claiming a directly authenticated UPSC URL. A preserved
copy is published with the paper for auditability.

Official listings/archives, historical filename variants and archival searches
did not recover the applicable provenance chain. Exact attempts/limitations:
`content/audits/nda-2024-ii-release-evidence-gap.json`. Scanner metadata is not a
release date; secondary agreement is not official authority.

Every question also retains its full four-option analysis and fresh reasoning
pass. The archived Series A cells resolve the 13 formerly ambiguous scored
questions; Q123's X cell reconciles with the key's one dropped-question total.

| Disposition | Count |
|---|---:|
| Official final | 0 |
| Official provisional | 0 |
| Reasoned verified | 149 |
| Withdrawn | 1 |
| Duplicate | 0 |
| Quarantined | 0 |
| Total | 150 |

The 13 previously quarantined scored questions now use these archived Series A
cells: Q16 D, Q21 A, Q23 B, Q24 A, Q51 B, Q58 B, Q68 D, Q70 A, Q110 D,
Q117 D, Q125 C, Q139 C and Q144 B. Their original review caveats remain in the
audit trail. Q123 is excluded as withdrawn and cannot be graded.

## Classification and integration

**50 English + 49 Science + 50 GS = 149** available. GS includes one defence
world-history item. **127 newly eligible + 22 reused eligible = 149**.
No source slot remains quarantined.

Every slot has a classification rationale and fresh same-AI concept/applicability
pass. English/Science and defence world history have reviewed NDA/CDS placements,
not automatic CSE transfer. Q150 also appears under Economy current affairs.
Q100 uses a bounded Modern industries leaf under History / Modern India /
Colonial Economy. Physical Geography is unchanged; no catch-all was introduced.

Hash-guarded overlays preserve raw imports, canonical IDs, original snapshots
and choices. Answer/content/taxonomy revisions remain separate. Answer-free
snapshot payloads contain labels, never accepted answers or explanations.
Rerunning builders does not duplicate records or increase revisions.

Inactive `content/staging/nda-2024-ii-source-draft.json` deliberately retains its
first-pass state. It is not the current bank. Approved runtime data/policy and
slot reconciliation are in `nda-2024-ii-reviewed-paper.json`,
`nda-2024-ii-review-policy.json` and `content/audits/nda-2024-ii-review.json`.
No database migration/import is part of this release; the existing catalogue/API
projection serves the questions. Sources states 149 available, Q123 withdrawn,
zero quarantined and links the preserved archived-key copy.

## Local checks

- Production build and full suite: **278/278 pass**.
- Browser checks: **7/7 pass** across the complete paper and Sources directory:
  full 149, exact three sections, rapid navigation, reload/submission/mobile,
  print/PDF, missing-image blocking and historical Q107.
- All **596** accepted/rejected option decisions checked through the grading API.
- All 149 scored key cells agree; seven images decode, with tables and underlining
  preserved. Q123 is absent from scored snapshots and is labelled withdrawn.
- Builder/hash checks, additional regressions and lint/diff results are recorded
  in the release report. Existing global type/lint errors are not called passing.

Commit, push and production deployment identity are recorded in the release
report after those gates complete.
