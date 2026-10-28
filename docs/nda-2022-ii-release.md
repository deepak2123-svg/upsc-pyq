# NDA II 2022 GAT — release report

28 October 2026. Series A, DFRG-U-TAG, local 26-page English extract.

## Reconciliation and evidence

- All 150 numbered questions faithfully reproduced and classified: 129 new
  source occurrences and 21 reused canonical IDs; zero duplicate aliases.
  CDS-prefixed historical Q84 and Q140 IDs preserved.
- 150 official-final; zero provisional, independently verified, withdrawn,
  duplicate, quarantined or awaiting-review records. English 50, Science 50,
  GS 50, including one defence-only World History question.
- No changed existing keys or material historical content repairs. Q127
  restores printed typo “followings” rather than singular “following”; no
  semantic change, option change or historical content revision.
- Official Series A page 1 reports NIL dropped and 150 scoring questions.
  Two fresh visual transcriptions (column-first, then row-first) agree on all
  150 cells. All choices are single answers; official Q110 B and Q142 B retained
  without academically substituting a different key.

Original PDF: `C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2022-2.pdf`.
SHA-256 `796a39da9787b8795b6d44b92c5d3bcddc9693b0f1034266ada38b73298c8404`.
PDF 2–9 = printed 2–9; PDF 10–26 = printed 11,13,…43. Hindi counterpart
pages/back instructions absent; all 150 English questions are present. Exam date
not independently established, so not invented from filename or coaching key.

Official key downloaded directly from UPSC:
https://www.upsc.gov.in/sites/default/files/AnsKey-NDANAII2022-GAT-25042023.pdf.
111,990 bytes, four scanned series pages. SHA-256
`dd934215fbd23059a584da214404126e219006250fd178846d3b54d8c8632965`.
The older local `2022_II.pdf` is Prepp coaching material, not an official key;
it was not used as scoring authority. Search/access details recorded separately.
Filename date 25 April 2023 is not asserted as independently proven release date.

Two full source comparisons were performed, first forward then reverse page
order, by the same AI reviewer, not independent human review. Original wording,
option order, erroneous grammar, scientific assumptions and historical facts
remain as printed. English underlining and P/Q/R/S fragments preserved. Q59
and Q138 matching lists render as tables. No figure-dependent MCQ or shared
reading passage occurs; required-image fault injection is therefore not a new
paper-specific case (existing image-protection regressions remain).

## Classification and compatibility

- Specific existing syllabus leaves reused; no taxonomy expansion or change to
  Physical Geography's 11 chapters / 92 subparts.
- Q86 flying-shuttle inventor belongs in defence World History, not CSE.
  Q108 gas-to-solid phase change moves from legacy Geography to standalone
  Chemistry. No automatic Science/English/World History leakage into CSE.
- Q84 overlaps protected-area current affairs and environmental governance;
  Q82/83 overlap relevant health/education locations; Q143 UDAN also occupies
  Economy transport and the Economy current-affairs mirror.
- CSE-compatible inventory 2,049 → 2,077: 29 new GS records minus Q108 moved
  to Chemistry. NDA English 396 → 446. Sources union 2,748 → 2,877 (+129),
  still 58 source papers; shared placements never add duplicate records.
- Hash-guarded overlays, unchanged raw imports, IDs and saved attempts.
  Key/content/taxonomy revisions remain separate. No material repair or key-only
  migration needed; repeated application produces identical output.

## Local verification

- `npm test`: production build and all 213 automated tests passed, including
  every one of 600 accepted/nonaccepted option decisions through actual grading.
- Seven Chromium checks passed: full paper answer/rapid navigation/reload/
  submit/mobile results; saved feedback refresh; all three 50-question sections;
  full PDF with every answer compared; Sources union/pagination/filter/gap checks.
- All 15 exported PDF pages rendered and inspected, with closer review of both
  matching-table pages and formulas. No clipping/missing table/symbol observed.
  Zero required images, as in source.
- Builder `--check --source-check`, changed-file ESLint and diff checks passed.
  Pre-existing anonymous-default-export warning remains in combined bank.
- Full TypeScript check remains nonclean due to existing admin import, D1
  example, optional parent and worker types plus ignored historical fixtures.
  No new selected-paper browser-test error; no clean typecheck claimed.
- Initial suite failures were exact inventory-count expectations; reconciled
  using the new paper projection, not weakened assertions. Read-only local HTTP
  checker attempted after Playwright's managed server exited and received
  ECONNREFUSED; this was not interpreted as a grading pass. Local grading was
  exhaustively verified by the built-worker automated suite.

## Release

Local gates passed; production commit/deployment and direct verification to be
recorded after normal push. No infrastructure, database or force-push changes.
