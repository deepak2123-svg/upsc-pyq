# NDA II 2025 GAT — completion and release record

Reviewed 26 October 2026 under the standing paper-processing SOP.
State: **complete and production verified**.

## Source and reconciliation

- Supplied `GAT/2025-2.pdf`: Series A, bilingual Part B, English Part A,
  150 original questions, 600 marks, 150 minutes, 56 PDF pages.
- Original SHA-256: `c29b9d5bcaf73ad074a451c6416aa00696f71e6d99d2e2c78e6cc1f4f1228481`.
- English source pages 2–11; Part B English pages 13–49, odd-numbered.
- 123 new source records and 27 reused canonical IDs = 150. One of the new
  records is withdrawn; 122 newly imported questions enter scored practice.
- Final dispositions: official-final 149; official-provisional 0;
  reasoned-verified 0; withdrawn 1; duplicate 0; quarantined 0.
- Zero awaiting-review slots. **149/150 available**, not 150 scored.
- Preparation sections: English 50, Science 50, GS 49 scored. These are concept
  sets, not invented contiguous source ranges. For example Q92 is technology
  chronology, while Q132 is WMO headquarters, not Biology.

The original 27 IDs, raw records, submitted choices and saved snapshots remain.
No existing accepted answer is changed. Q91's OCR I/1 and sequence-code spacing
are nonmaterial marker/format repairs, not grounds to penalise old attempts.

## Authentic key

Recovered directly from UPSC after case-sensitive historical filename research:
[UPSC final key](https://www.upsc.gov.in/sites/default/files/AnsKey-NDANA-II-2025-GAT-150426.pdf).
Four pages, Series A/B/C/D; this paper uses page 1, Series A. Preserved publicly
at `/papers/nda-2025-ii-gat/official-final-key.pdf`.

SHA-256: `c997b581dccc26287dfb7746a287ccdbfbdc270c356e835eda7b5641fcfe811f`.
The filename and PDF metadata indicate 15 April 2026; a separately authenticated
release date is not asserted. The earlier Prepp watermarked mirror is only a
research/transcription lead, superseded by the direct official bytes.

All 150 Series A cells agree between column-first and row-first transcriptions
and the directly recovered official page. Q58 accepts **A and B**. Q85 is **X**,
officially dropped, and cannot enter new tests or penalise historical results.
Each of all four choices was exercised through grading: 150 accepted-option
decisions, 446 rejected-option decisions, and four excluded Q85 decisions.

Officially keyed source disagreements remain scored to UPSC with separate
caveats, rather than being silently rewritten or changed to an unscored viewer.
The original Q108 anomalous equation is preserved. Q85's faithful source wording
and all options remain inspectable on the paper page without a forced answer.

## Reproduction and classification

All 150 stems and every option read against the supplied source, then all
English source pages reopened in reverse order for a distinct second pass by
the **same AI reviewer**, not independent human review. Full details are in
`content/audits/nda-2025-ii-review.json`, the source signoff, key transcriptions,
immutable draft baseline and explicit source/classification modules.

Restored the common Q1–5 passage and all necessary common directions; original
English underlining and PQRS fragments; matching tables Q81/103/107/128; Roman
markers Q130; chemistry subscripts, exponents, units and equations. Numerous
secondary-draft option permutations were reversed to the actual Series A
order, including Q19/27/41/43/45/46/48/66/93/94 and later Part B items.
No original required figure occurs in this paper.

Every item has a specific reviewed concept and target scope. NDA/CDS English
and school Science are explicit preparation-only placements, not automatically
CSE GS. Corrected feldspar, sedimentary-rock and tropical-cyclone placements.
Added bounded Medieval India source-account coverage and Economy digital assets;
the original Physical Geography 11 chapters/92 subparts remain unchanged.
Economic Current Affairs are shared with Economy, and all overlaps count each
canonical ID once. Static questions are not labelled recent news merely because
they occur in the last ten source numbers.

## Runtime and student safeguards

- Multiple accepted options supported in single checks, full grading, cached
  feedback validation, results highlights, cloud/legacy scoring and PDF keys.
  The representative single-answer field remains compatible with older clients.
- Answer-free snapshots never carry accepted sets or explanations. Cloud public
  snapshots also omit answer-bearing source metadata.
- New membership uses the shared eligibility gate; Q85 is visibly withdrawn.
  Historical lookup remains available and submitted choices are untouched.
- Shared material remains complete in standalone practice. Printed papers can
  reference explicitly linked identical material after its first occurrence;
  mismatching/unlabelled text is never inferred or dropped.
- No database migration or production database import is required. Database-
  backed rows continue to resolve current canonical answers by existing IDs;
  the 123 new records use the app's established canonical catalogue/snapshot
  path, not an unrequested bulk database import.

## Local gate evidence

| Check | Result |
|---|---|
| `npm test` including production build | 192 passed, zero failed |
| New paper + prior-paper/preparation/asset Playwright checks | 13 passed |
| All four options through real grading and Q58 single-check route | Passed |
| Full paper, all three section launches, reload, submit, saved results, mobile | Passed |
| Full offline PDF | 17 pages; every page rendered and visually inspected |
| Every printed answer / accepted set | Compared against reviewed key in browser |
| PDF text comparison | 596 options and all prompt lines present; zero missing text |
| Required-image delay/failure regressions | Passed; incomplete printing blocked |
| Paper/source hashes and all applicable builders `--check` | Passed |
| Changed-code ESLint | Zero errors; documented unused-destructure/legacy warnings |
| Standalone TypeScript check | Not clean: ten pre-existing diagnostics; no new diagnostics |

QA evidence is local under `tmp/nda-2025-ii/`; no browser traces, private drafts,
source-machine dependencies or QA PDFs are staged. Final source inputs and
review evidence are repository-owned audit files, not the local staging folder.

An initial suite run exposed a missing Economy mirror on a new Current Affairs
record; fixed before release. Expected library totals were reconciled explicitly,
not assertions disabled. Final totals: global GS **1,909**; NDA preparation
**1,996**; CSE preparation **1,792**; source directory **2,114** eligible questions.
Subject/view totals can overlap and must not be summed.

The standalone TypeScript check was compared with an archived checkout of
`7c50a14`: the baseline has eleven diagnostics, including the catalogue union
access fixed in this release. Ten unchanged diagnostics remain in admin import,
the D1 example/worker types, and existing nullable syllabus-parent lookups.
They are not represented as a passing typecheck. The production build and full
192-test suite pass; no unrelated database or example-project changes are made.

## Production release

Release commit: `317a96cb4b7e52027e73af104d21c3b680586507`, pushed atomically to
`main` and `codex/pyq-selection-flow`. GitHub Production deployment `7322773091`
reports success for that exact SHA (not merely the Preview deployment).

Live page: https://upscpuraan.vercel.app/papers/nda-2025-ii-gat

Production checks passed on 26 October 2026:

- All 600 grading decisions: 150 accepted, 446 rejected, four excluded Q85
  checks. Every response matched the reviewed final key and accepted sets.
- Served official-key asset SHA-256 matches
  `c997b581dccc26287dfb7746a287ccdbfbdc270c356e835eda7b5641fcfe811f`.
- Live inventory membership, source counts and English/Science preparation
  separation passed; Q85 cannot enter a new scored test.
- Eight production Playwright checks passed: full online attempt, saved choices
  after reload, result review, full offline paper and every printed answer,
  English/Science/GS section launches, numbered Science chapters, preparation
  selector/source filters and responsive navigation.
- Production PDF has 17 pages; the text audit again finds all 596 options and
  all prompt lines, with no missing text.

The completion record and chronology are updated in a following documentation-
only commit. No question, key, runtime or taxonomy payload is changed by it.
NDA I 2025 is the next queued paper, not part of this completed release.
