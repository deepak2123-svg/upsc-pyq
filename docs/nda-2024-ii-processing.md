# NDA II 2024 GAT - individual review complete

27 October 2026. Source review: **150/150 accounted for**. Scored availability:
**136/150**. Production verification is separately recorded in
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
  Five are cleared; Q70/Q125 remain held. No replacement diagrams invented.
- Q91 duplicated printed `(c)` labels retained in `originalOptionLabels` and
  a source caveat. A-D in the app denote unchanged option positions.
- Existing Q107's C/D matching codes were materially mistranscribed. Restored
  C `A-1, B-2, C-3, D-4` and D `A-1, B-3, C-2, D-4` from source page 29.
  Content revision 0 becomes 1. Old snapshots keep original options and are
  excluded rather than graded against a question the student never saw.

## Answer provenance and decisions

Candidate scan: `../data/nda_answer_sources/answer_keys/2024_II.pdf`, SHA-256
`9086a5382ac12ea9b266786419d0689b88c15b00ad80d34ca755be3c0ee4ae95`.
The specific Prepp row links the preserved mirror:
<https://prepp.in/nda-exam/question%20paper%202024>.
Two visual Series A transcriptions agree on 150 cells (Q123 is X). This does
not authenticate official origin, latest revision or an official withdrawal.
The scan is not published as an official asset.

Official listings/archives, historical filename variants and archival searches
did not recover the applicable provenance chain. Exact attempts/limitations:
`content/audits/nda-2024-ii-release-evidence-gap.json`. Scanner metadata is not a
release date; secondary agreement is not official authority.

Every question instead received full four-option analysis and a fresh distinct
reasoning pass, using primary-publisher URLs/locators, source-passage evidence
or explicit calculations. The question ledger records same-AI review honestly.
Q37 is C and Q42 is A on that reasoning, not purported official corrections.
Earlier candidate-derived approvals are preserved as history, not bulk-copied.

| Disposition | Count |
|---|---:|
| Official final | 0 |
| Official provisional | 0 |
| Reasoned verified | 136 |
| Withdrawn | 0 |
| Duplicate | 0 |
| Quarantined | 14 |
| Total | 150 |

| Held Q | Exact conflict |
|---:|---|
| 16 | Implies/suggests permit competing grammatical continuations. |
| 21 | Has spilt versus should have spilt depends on unstated intent. |
| 23 | Shouldn't and wouldn't both permit advice in context. |
| 24 | Could help versus emphatic did help permits competing readings. |
| 51 | Lysosome statements B and D are both false as printed. |
| 58 | Both phosphorus and sulphur have polyatomic elemental molecules. |
| 68 | Intracloud versus induced-ground charge readings compete. |
| 70 | Printed schematic velocity profiles do not uniquely settle the answer. |
| 110 | NCERT granite listing conflicts with standard geological terminology. |
| 117 | Bone meal and urea both contain nitrogen; not restricted to principal nutrient. |
| 123 | Constant friction gives absent 5 N; variable friction is underspecified. |
| 125 | Initial force explanation and increased parachute drag are both true. |
| 139 | Laterite nutrient claims vary by region/conditions; no uniquely supported answer. |
| 144 | Jakarta and New Delhi both hosted named 2023 festivals; no date supplied. |

Reopening requires an authenticated applicable UPSC cell/revision or directly
applicable primary evidence resolving the recorded competing interpretation
without altering the question. Q123 is not labelled officially withdrawn.
Previously available Q110/Q139 now fail eligibility and are excluded from old
scores without changing submitted choices.

## Classification and integration

**46 English + 43 Science + 47 GS = 136** cleared. GS includes one defence
world-history item. **116 newly eligible + 20 reused eligible = 136**.
The remaining 12 new occurrences and two reused IDs remain quarantined.

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
projection serves the questions. Sources states 136 available, 14 quarantined
and unresolved official provenance, with no added paper-launch links.

## Local checks

- Production build and full suite: **201/201 pass**.
- New browser checks: **6/6 pass**: full 136, exact three sections, rapid navigation,
  reload/submission/mobile, PDF, missing-image block and historical Q107.
- All **544** accepted/rejected option decisions checked through grading API.
- All 136 printed key cells agree; five images decoded, tables/underlining present.
- Export rendered into **16 PNG pages**, all visually inspected, with enlarged
  tall figures and Q107/Q108 tables. No clipping or missing labels; all 136
  original source numbers found in PDF text. The long shared passages retain
  their original wording; small final answer-key page is an existing print layout.
- Builder/hash checks, additional regressions and lint/diff results are recorded
  in the release report. Existing global type/lint errors are not called passing.
