# NDA II 2026 GAT — completion and release report

Reviewed 25 October 2026. Source review complete; application release live-verified
below. This supersedes the earlier GS-only import
accounting for this paper; it does not approve other NDA papers.

## Reconciliation

| Section | Original numbers | Scored questions |
|---|---|---:|
| English | 1–50 | 50 |
| Science | 51–100 | 50 |
| GS | 101–150 | 50 |
| Total | 1–150 | 150 |

50 new English occurrences, 100 reused canonical IDs, zero duplicate aliases,
zero unresolved slots. Dispositions: official-final 0; official-provisional 150;
reasoned-verified 0; withdrawn 0; duplicate 0; quarantined 0. All 150 eligible
for normal scored NDA practice. No scanned/unscored substitute.

## Source and answer evidence

- Supplied original: `C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2026-2.pdf`.
  Series A; English/Hindi; 52 PDF pages. Cover identity compared directly;
  English pages 2–7 and odd pages 9–47 read completely in two distinct passes.
- Original SHA-256:
  `cc524b288fb4136f50ae648face0bd648a8a0c1f0753e9e8c5130f723cc9a987`.
- [Official UPSC provisional key](https://www.upsc.gov.in/sites/default/files/ProvAnsKey-GAT-NDANA-II-26-160926.pdf),
  released 16 September 2026, Series A page 1, zero dropped questions.
  Downloaded afresh; original bytes match the previously preserved key.
- Key SHA-256:
  `1d86b52baed1a38607c7203bbccfb3625c78168cf351484bc5b6a45c101d01f3`.
  Public copy: `/papers/nda-2026-ii-gat/official-provisional-key.pdf`.
- Every cell transcribed column-first and row-first, then compared
  programmatically. Original option order retained; all 100 prior answer letters
  agree. No answer changes and no material wording/option repairs required.
- No later applicable final/revised key was recovered in the documented search.
  This is not a claim that no later key exists. Clearly labelled provisional.
- Same AI reviewer performed the fresh second visual/classification pass;
  this is not independent human review. Detailed per-question evidence and
  classification decisions: `content/audits/nda-2026-ii-review.json`.

## Reproduction and classification

All directions repeated as needed for standalone use. Underlining, PQRS fragments,
error segments and all options retained. Six English paired tables preserved:
Q43–46 two pairs each, Q47–48 three pairs each. Q84/Q90 retain scientific paired
tables; Q126 retains Roman-left and letter-right matching lists. No required
figure in this paper. Original false propositions are not rewritten into truths.

English assigned specific vocabulary, grammar and usage subparts for NDA and CDS.
Added a bounded Foreign phrases leaf. Q123 Luddism and Q124 British industrial
conditions now belong to defence World History; added Labour movements leaf.
They remain scored and accessible to NDA/CDS, not automatically CSE GS.
All existing justified GS cross-placements retained. Science follows the existing
explicit target-applicability gate, not automatic CSE inclusion.

Taxonomy amendment boundaries: Foreign phrases covers borrowed expressions such
as *ipso facto*, not ordinary English synonyms, idioms or one-word substitutions.
Labour movements covers industrial-era protests such as Luddism, not Indian
labour legislation or present-day employment policy. Existing stable leaves and
their order are retained; the new leaves append within their bounded chapters.

Official scoring retained with separate caveats for Q29 (underlined “in spite”),
Q43 (passive paraphrase), Q56 (magnetic inverse-square wording) and Q107
(latitude versus its sine). These caveats do not make the questions unscored.

## Application and compatibility

Raw bank and prior pilot imports unchanged. Overlay guards all 100 before-hashes;
reapplication does not increment revisions. New occurrences added once. Existing
answer/content revisions and historical snapshots/choices preserved. Separate
preparation taxonomy version advanced; draft storage keys and frozen memberships
remain intact. Legacy draft interface remains at `/library`.

Full and section launches use frozen exact question sets, normal snapshots,
local attempt persistence, scoring/results and offline PDF flow. Answers stay
out of test payloads. Sources lists both complete 2026 GAT papers.

Global GS pool: 1,884 unique questions (two World History removals).
Sources: 1,989 available questions including 100 English and five defence World
History questions from both complete GAT papers. NDA source preparation pool:
800 unique questions. Subject totals may overlap and are not summed.

No production database import or migration is performed. This release uses the
existing file-backed public catalogue and normal practice routes. Database
catalogue expansion is not claimed.

## Verification record

- Production build and full automated suite: 184/184 passed locally.
- Exhaustive selected-paper grading: all 150 accepted answers correct, all 450
  alternatives incorrect, zero exclusions. Previous paper regression included.
- Browser checks: 12/12 passed in the consolidated run, covering exact 50-item
  section launches, full-paper grading/reload/results, NDA I regression,
  preparation/source filters, legacy drafts and explicit Add remaining.
- Full offline PDF: 150 question blocks and every key answer compared in the
  browser. All 20 rendered pages visually inspected; no clipping, missing symbols
  or broken tables. Q47–48 correctly have three pairs, not two.
- A pre-hydration section-selector click was caught and fixed; controls now wait
  for readiness. Older draft tests were updated to the intentionally preserved
  `/library` route and current Finalise test controls, while retaining exact-set
  and no-silent-broadening assertions. Failed diagnostic runs are not counted as
  passes; the final consolidated run passed without retries.
- Builder `--check --source-check`, placement/coverage reconciliation and
  `git diff --check`: passed locally; rerun before commit.
- Changed code ESLint: zero errors, two existing warnings (anonymous default
  export and unused source-coverage import). Full repository lint also scans
  generated Playwright traces and older test `any` annotations; that command
  is not claimed clean. No assertions weakened to hide those findings.
- React review keeps answer-bearing data server-side; client receives only
  answer-free recipes and title. Section controls wait for hydration.

## Release — live verified

Application commit: `b15275df7085ded37ebfe75bf166b6366f56a1c9`, pushed atomically
to `main` and `codex/pyq-selection-flow` through the existing GitHub workflow.
GitHub's Vercel commit status reports success. Production deployment record
`7315243615` reports success for that exact SHA (Preview record is separate).

- [Live scored paper](https://upscpuraan.vercel.app/papers/nda-2026-ii-gat)
- [Production deployment evidence](https://api.github.com/repos/deepak2123-svg/upsc-pyq/deployments/7315243615/statuses)
- Production URL for that commit:
  `https://upscpuraan-7s1k9cgy1-deepakkarnal321-1406s-projects.vercel.app`.
- Six production browser checks passed without retries: all three exact sections,
  full-paper answers/reload/submission/results, offline PDF/every answer,
  preparation targets and source directory counts/mobile display.
- Separate production API sweep passed: 150 accepted answers, 450 rejected
  alternatives, zero exclusions; NDA/CSE membership boundaries, 100 NDA English
  questions and 1,884 global GS questions confirmed.
- Served official-key SHA-256 equals the reviewed `1d86b52b…01f3` bytes above.
- Vercel MCP inspection requires reauthentication. Exact-commit deployment
  identity instead established through public GitHub deployment/status records
  and live application checks. Runtime log access was unavailable; no claim of
  a clean platform-wide error log is made.
- A standalone Node fetch check encountered an `ECONNRESET` while receiving a
  response body. The same full checks were rerun using bounded Playwright HTTP
  requests and passed; the six production browser checks also passed. The
  failed transport run is not counted as successful verification.

This report-only follow-up records the already verified application commit;
it does not change application data or source-review decisions. Next paper
remains NDA II 2025; it has not been started.
