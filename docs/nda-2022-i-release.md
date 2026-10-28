# NDA I 2022 GAT — release report

28 October 2026. Series A, SDFR-F-TAG, 26-page English extract.

## Reconciliation

- All 150 numbered questions reproduced, classified and official-final: English
  50, Science 50, GS 50 (including one defence-only World History question).
- 129 new source occurrences; 21 reused canonical IDs; zero duplicate aliases.
  Historical CDS-prefixed IDs Q104/105/127/147 remain unchanged.
- Zero provisional, reasoned, withdrawn, duplicate, quarantined or awaiting-review
  dispositions. No existing key changes or material historical content repairs.
- Raw imports, submitted answers and historical snapshots remain untouched.
  Hash-guarded overlays and separate answer/content/taxonomy revisions retained.

## Source evidence and review

Original `C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2022-1.pdf`:
SHA-256 `bbad095a0e5a323aef8f839bd9ac2fbfa9a255c5ba8cd0479a5d17d93d569002`.
PDF 2–9 maps to printed 2–9; PDF 10–26 to printed 11,13,…43. Hindi counterparts
and back instructions are absent, but all 150 English MCQs are present. Exam date
not independently established and not inferred from filename.

Official UPSC key:
[Series A and other series](https://www.upsc.gov.in/sites/default/files/AnsKey-NDA-I-22-GAT-251122.pdf).
3,024,543 bytes; four scanned series pages; SHA-256
`2dcd863b5ebb9f3fcb2b03a6733df2581c220f613eb50ecec674f806d359fb81`.
Page 1 identifies NDA & NA-I-2022, Series A, GAT, NIL dropped, 150 scoring.
Filename date 25 November 2022 is not asserted as independently proven release date.
Two visual key transcriptions, column-first and row-first, agree on every cell.
Original option order preserved; no blanket letter remapping or academic key substitution.
Official Q57 D, Q112 A and Q135 C remain the scoring authority.

Full source comparisons: forward PDF 2–26, then fresh reverse PDF 26–2 comparison
against the typed transcription. Same AI reviewer, not independent human review.
Negatives, scientific units/powers, English underlining, A/B/C segments, P/Q/R/S
fragments and shared directions retained. Q91 sunlight/heat reaction conditions
are preserved beside arrows. No required diagrams, matching tables or reading
passages; new paper-specific missing-image injection is not applicable.

## Classification and counts

- All questions have concept-level primary placements, rationales and second-pass
  review. English, school Science and Q122 Industrial Revolution remain NDA/CDS,
  not automatically CSE GS. History/Art & Culture overlap is intentional.
- Q130 railway news appears in Geography, Current Affairs and the Economy mirror;
  all are one canonical question. Q148 species status has an Environment primary
  and Current Affairs additional home.
- Bounded syllabus additions: Medieval History literary sources, Current Affairs
  species conservation status, and defence World History industrial-revolution
  terminology. Physical Geography remains 11 chapters / 92 subparts; Current
  Affairs retains its seven broad sections.
- Q110 GPS leaves an inaccurate Physical Geography placement; Q117 rotation leaves
  Planets. Historical V3 selections preserve their frozen IDs despite corrected
  current classification; no selection broadening.
- CSE inventory 2,077 → 2,105 (+28 new applicable GS); NDA English 446 → 496.
  Sources unique union 2,877 → 3,006 (+129), still 58 paper identities.
  Subject overlaps are not summed into library totals.

## Local verification

- Production build and all 216 automated tests pass, including all 600 possible
  answer-option decisions through the real grading endpoint.
- Seven Chromium scenarios pass: full practice/rapid navigation/reload/submit/
  mobile results; saved-result refresh; three exact 50-question sections; complete
  PDF with every answer checked; Sources pagination/filter/union/gap checks.
- All 15 local PDF pages rendered and visually inspected, including a closer
  formula/reaction page review. No clipping or missing symbol observed; zero images
  agrees with source. Browser PDF text tests also retain reaction conditions.
- Builder `--check --source-check`, syllabus `--check`, changed-file ESLint and
  diff checks pass. One pre-existing anonymous default export warning remains.
- Full TypeScript check is not clean: existing admin import, D1 example, optional
  parent/worker types and historical fixture errors remain. No new selected-paper
  test error; no claim of clean whole-project typechecking.
- Initial exact-count assertions were reconciled to new membership. The old V3
  Planets assertion now verifies its exact frozen ID set and Q117's corrected
  Rotation and Time classification, rather than requiring obsolete labels.

## Release

Data commit `9a2867759285fded1d20d607b049a22c97f12eff` pushed normally to
`main` and `codex/pyq-selection-flow`. Exact-SHA Vercel status reports success;
latest reported deployment `AiZoJGNi6hPChbxMfwQBXWBbLJLK`.
No infrastructure, database or force-push change is included.

Live https://upscpuraan.vercel.app checked on 28 October 2026:

- Read-only checker passes all 600 option decisions: 150 eligible, zero excluded,
  English inventory 496, correct source disclosure, no inappropriate CSE leakage,
  served official-key bytes matching the reviewed SHA-256.
- Every one of the seven production Chromium scenarios passed at least once
  across two unchanged bounded runs, **not a clean single-run suite**. First run:
  six pass; PDF setup times out loading `/prepare/NDA` before export. Trace shows
  HTTP 200 document but stalled font/CSS/JS requests. Direct checks of CSS,
  framework JS and affected font then return HTTP 200 in 235–372 ms.
- Second run: six pass, including complete PDF; GS snapshot transport aborts
  after receiving HTTP 201 headers, before body completion. The identical GS
  section scenario passed in the first run. No assertion or timeout was weakened,
  no application error was silently treated as a pass, and no third retry run
  was used. Intermittent production transport reliability remains an explicitly
  recorded caveat; a uniformly green batch is not claimed.
- Production PDF contains all 150 questions and every answer matches the reviewed
  key. All 15 exported pages rendered and visually inspected; no clipping or lost
  symbols observed, including chemistry conditions and English underlines.
- Sources reports 3,006 unique available questions across 58 papers and NDA I
  2022 as 150/150, official final, English/Science/GS 50 each, no missing numbers.

Next queued source paper: NDA II 2021. No questions from that paper started here.
