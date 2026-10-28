# NDA II 2023 GAT — release report

28 October 2026. Series A, DFTK-F-TAG; 26-page English extract.

## Source accounting and authority

- All 150 source questions reproduced and classified: 129 new occurrences and
  21 reused IDs; zero duplicate aliases. Historical CDS-prefixed Q150 ID retained.
- 150 official-final, zero provisional, reasoned, withdrawn, quarantined or
  awaiting-review records. English 50, Science 50, GS 50 (including three
  defence-only World History questions). All 150 available for scored practice.
- No changed answer keys or material content repairs among reused records.
  Raw imports, submitted answers and historical snapshots remain unchanged.
- Original local PDF SHA-256:
  `a1203c10476b980b796fe81592b22d1de6708745980737fa3f8ad9181ee261b8`.
  PDF 2–9 maps to printed 2–9; PDF 10–26 maps to printed 11,13,…43.
  Hindi counterpart pages and back instructions are not claimed present.
- Matching official final key downloaded directly from
  https://www.upsc.gov.in/sites/default/files/AnsKey-NDA-NA-II-2023-GAT-100424.pdf.
  SHA-256 `86ebf4dff8e21fa34552c431966329f3cce9ae67364791558d32c3be7cd01478`.
  Four booklet pages; Series A page 1 governs original option order. All 150 cells
  checked in column-first and row-first visual passes; programmatic comparison
  agrees. No dropped or multiple-answer cells. Filename date is not independently
  asserted as the release date. The compressed legacy mirror has different bytes.

## Reproduction and classification

Two visual source comparisons and fresh concept review by the same AI reviewer,
not independent human review. Frozen input hashes and before-values are in the
paper register, question ledger and source signoff.

Four original figure sets: Q59 semiconductor graphs, Q109 resistor arrangements,
Q116 Dalton symbols and Q131 motion graphs. No diagrams redrawn. Q131's printed
distance/time axes are preserved despite the velocity equation; official D
governs scoring. Q136 retains printed Pochampli. Draft Q106 corrected to Bhabar.
English underlined segments, complete directions and Q46–50 shared passage
(source pages 8–9) retained. Matching tables Q62, Q92 and Q143 retained.

New bounded concepts: ancient royal status/legitimacy, Bhoodan/land reforms and
geological eras; defence-only French Revolution/Terror and WWI consequences.
Physical Geography remains 11 chapters/92 subparts. Reviewed Q79 and Q124 move
from erroneous Physical placements to geological eras/Indian soils respectively.

Science, English and World History do not automatically enter CSE. Economy
Current Affairs Q141/Q149 also occupy Economy; shared placements count each ID
once. Library GS inventory 1,994 → 2,020 (+26); NDA English 296 → 346 (+50).
Sources available union 2,489 → 2,618 (+129), still 58 distinct source papers.

## Release gates

Local gates passed:

- Production build and all 207 automated tests, including 600 answer decisions,
  unique inventory/snapshot membership, historical-ID stability and no CSE leakage.
- Seven Chromium browser checks: full-paper answer/navigation/reload/submission,
  mobile result review, each 50-question section, required-image print blocking,
  complete offline PDF/answer key, and Sources filtering/count reconciliation.
- All 18 exported PDF pages rendered and inspected, with closer inspection of
  equations, matching lists and figure pages. All four original figure assets
  embedded; all 150 exported answers match the reviewed key.
- Deterministic builder/source hashes, taxonomy generation and diff checks pass.
  Changed-file ESLint has zero errors; one pre-existing anonymous default-export
  warning remains in the combined bank.
- Repository-wide `tsc --noEmit` is not clean: existing admin-import, D1 example,
  optional-parent syllabus/catalogue and worker-type errors remain (including
  ignored historical typecheck fixtures). No claim of a clean typecheck is made.

## Production verification

Data commit `dc67135e438dac7dcaa1afe8c1da8a86bf780d62` pushed normally to `main`
and `codex/pyq-selection-flow`. GitHub's Vercel status for that exact SHA reports
success, deployment `FF5XgXq4nXEbvZ4JgDxVFN1Fz5Ps`.

Live checks at https://upscpuraan.vercel.app pass: all 150 IDs reachable, 600
option decisions match the official key, zero exclusions, no inappropriate CSE
leakage, NDA English inventory 346. Served official-key and four figure hashes
match the reviewed assets. Sources lists 150/150, official final, no unavailable
numbers; its 58-paper union reconciles to 2,618 unique available questions.

Production practice/navigation/reload/results, each section and offline export
checks passed. The Sources check initially treated pre-hydration disabled Next
as the last page; readiness and row-transition assertions corrected the test
without relaxing totals. Its production rerun passes all page/filter/count checks.
No platform log/error-drain inspection is claimed; verification uses exact-commit
deployment status, public APIs, asset hashes and browser checks.

Machine-readable evidence is in `content/audits/nda-2023-ii-*`; runtime data is a
deterministic overlay with original-record hash guards. No raw import changes.
