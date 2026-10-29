# NDA II 2019 GAT — release report

Prepared for release on 29 October 2026. Series A, BEM-U-TAG, original
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

The release requires the builder check, full automated suite, changed-file
ESLint, diff validation and the dedicated Chromium paper scenarios to pass.
After deployment, the same exact-commit release will be checked for all 600
answer decisions, the answer-free 149-question snapshot, key and figure hashes,
Sources metadata and production browser scenarios.

## Release

Pending commit, deployment and production verification. Next queued source
paper: NDA I 2019.
