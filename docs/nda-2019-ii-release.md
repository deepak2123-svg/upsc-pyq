# NDA II 2019 GAT — release report

Released and production-verified on 29 October 2026. Series A, BEM-U-TAG, original
22-page General Ability Test.

## Accounting and evidence

- All 150 source questions were reproduced and reviewed: 130 new occurrences,
  20 reused canonical IDs, no duplicate aliases and no unresolved slots.
- The official UPSC final key establishes 149 scoring questions and withdraws
  Q119. The withdrawn item remains available only to historical saved attempts.
- Eligible preparation sections are English 50, Science 50 and GS 49.
- No existing answer correction or material historical repair was required.
- Source PDF SHA-256:
  `e5af4aaeed1122ccde9c643419be63c0ee8ea65491b32713110cf64582659f30`.
- Final-key PDF SHA-256:
  `09882d43bd328ee6f6af7f745b0f09534172c6f5343f89953cc83b47fa51c58f`.

Every numbered source page received a page-oriented visual comparison. The
Series A key was independently transcribed column-first and row-first, and both
passes agree. The source-derived Q70 circuit figure is stored with a verified
content hash. Original English error segments, the Q41–45 shared passage and
scientific notation are preserved.

## Classification and compatibility

- Every eligible item has a specific reviewed primary placement; justified
  overlaps deduplicate through the canonical question ID.
- Defence World History remains outside CSE inventory. A bounded Napoleonic-era
  coalitions leaf was added instead of using a catch-all category.
- Rerunning the hash-guarded builder reproduces identical output and protects
  the frozen source register and review signoff.

## Verification

- Production build and all 231 automated tests pass. The focused import suite
  tests every one of 600 possible answer choices against the official decision.
- All seven local Chromium scenarios pass: exact 149-question practice and
  grading, three section projections, historical withdrawal handling, complete
  print/key rendering and Sources disclosure.
- Builder `--check`, changed-file ESLint and diff validation pass. ESLint reports
  four non-blocking existing-style warnings and no errors.

## Release

Data commit `25c08296cab51d4c3955c871caf931208343690e` was pushed normally to
`main` and `codex/pyq-selection-flow`. Exact-commit GitHub Vercel status reports
success for deployment `FhEg9nW54dZvge3WDAg3hkjQLijw`.

Live [UPSC Puraan](https://upscpuraan.vercel.app) verification passed:

- all 600 grading decisions, 149 eligible and one withdrawn;
- the exact answer-free 149-question snapshot and its section memberships;
- exact official-key bytes and Q70 figure asset SHA-256;
- Sources disclosure of 149/150, official final key and Q119 withdrawn; and
- all seven production Chromium scenarios in one clean run.

No infrastructure, database migration, force push or unrelated staging draft was
included. Next queued source paper: NDA I 2019.
