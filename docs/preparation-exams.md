# Preparation exam views — local implementation

## Behaviour

The top selector chooses UPSC NDA, UPSC CDS or UPSC CSE Prelims. It does not rewrite a question's source exam. Each target starts with its own source enabled; compatible CSE/CAPF/CDS/NDA sources can be enabled independently in the test cart and setup dialog. CAPF remains a source, not a fourth preparation target.

| Target | Papers / navigation |
|---|---|
| NDA | Mathematics; GAT → English, GS, Science (three parallel branches) |
| CDS | English; General Knowledge; Elementary Mathematics |
| CSE | GS Paper I; GS Paper II / CSAT |

NDA's three GAT branches are the requested editorial navigation, not three official separately scored papers. CDS displays the OTA distinction: English and GK, with maths for IMA/INA/AFA. This is a custom-practice builder, not an official marks-weighted mock-paper generator.

Paper anchors: [UPSC papers](https://www.upsc.gov.in/examinations/previous-question-papers), [NDA II 2026 notice](https://www.upsc.gov.in/sites/default/files/Notif-NDA-II-2026-Engl-200526.pdf), [CDS II 2026 examination](https://www.upsc.gov.in/examinations/Combined%20Defence%20Services%20Examination%20%28II%29%2C%202026). Topic subdivisions are editorial, not claimed verbatim official text.

## Syllabus and sharing

- Retains the existing GS chapter/subpart registry, including 11 Physical Geography chapters / 92 subparts.
- Adds detailed English, NDA Mathematics, CDS Elementary Mathematics and CSE CSAT scaffolds. English concept IDs are shared across NDA and CDS; different maths depths have distinct IDs.
- NDA maths covers algebra, matrices/determinants, trigonometry, analytical geometry, differential and integral calculus, differential equations, vectors, statistics and probability.
- CDS maths covers arithmetic, algebra, trigonometry, geometry/mensuration and statistics, without NDA calculus.
- English covers vocabulary, grammar, usage/sentence skills and comprehension, with chapter/subpart detail.
- CSAT covers comprehension/communication, reasoning, decision-making/problem solving, mental ability, numeracy and data interpretation.
- Empty topics remain browsable with disabled add actions. **No English, maths or CSAT questions are newly imported or declared verified by this change.** Existing global GS exclusions remain untouched.
- Existing non-Science GS placements are inherited, not represented as a fresh whole-bank target-applicability audit. Shared questions keep canonical IDs; counts and selections use unique unions.
- Conservative Science boundary: a question appearing anywhere in the Science placement index is available only to its source target, unless an individual approved transfer exists. This applies across additional placements too. Thus NDA Physics cannot leak back into CSE through a second Geography placement. CSE's own General Science remains available.
- `content/preparation-applicability.json` holds explicit reviewed Science transfers and future reviewed target/topic placements. Both lists start empty. Future English/maths imports must receive approved placements and independent verification, rather than be unhidden by removing a GS exclusion.

## Contracts and compatibility

- `/` defaults to CSE. `/prepare/NDA`, `/prepare/CDS`, `/prepare/CSE` select a preparation target. Existing `/exams/NDA`, `/exams/CDS`, `/exams/CSE` now expose the corresponding target view.
- `/api/pyqs/inventory?preparationExam=NDA|CDS|CSE` returns the target projection, its views and a target-qualified taxonomy version. Without the query, the legacy catalogue contract is unchanged. Invalid targets return 400.
- V4 snapshot recipes accept optional `preparationExam`. Target-aware requests use the same projection as the browser, reject invalid targets, enforce eligibility on explicit frozen memberships, and reject questions assigned to incompatible subjects. Online and PDF preparation use this same endpoint.
- Independent session-storage keys: `upsc-pyq-builder:preparation-v1:NDA|CDS|CSE`. Switching paper/section does not clear the target cart; switching target restores its own draft. Exact frozen question memberships prevent silent growth.
- Old builder drafts are neither deleted nor silently broadened. They remain accessible at `/library`; previous source-specific drafts at `/library?source=CSE` (or NDA/CDS/CAPF). Snapshot content, IDs, answers, answer/content revisions and historical grading are unchanged.
- Exit/result links accept strict local preparation routes so an NDA practice returns to NDA, not CSE.
- The separate legacy database-backed `/app` workflow is unchanged; the accepted three-panel browser and local practice/PDF paths use the new target contract. No production/database import was performed.

## Checks

Automated coverage includes target paper trees, empty scaffolds, the 92 preserved Physical Geography subparts, union counts, cross-source GS, NDA-only default selection, CSE Science exclusions, target-labelled snapshots, frozen-membership injection rejection, separate carts/reload, mobile layout and starting practice. Historical attempt, grading, PDF rendering and draft tests remain in the full suite.

This change is local only. No commit, GitHub push or deployment is included.

Final verification: build succeeded; all 177 automated tests passed; three browser scenarios passed (target/cart/exit flow, empty syllabus/mobile flow, NDA I equations/PDF regression). Targeted ESLint and `git diff --check` passed. The project-wide TypeScript command still reports unrelated existing errors in the admin import endpoint, D1 example and worker environment types; it is not represented as passing. The React review kept the catalogue server-side, used controlled/labelled selectors, preserved focus/drawer behaviour, and avoided changing the historical snapshot schema requirements.
