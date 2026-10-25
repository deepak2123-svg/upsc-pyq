# Paper completion and release checklist

Version 1.0 · 25 October 2026. Use with the [master SOP](paper-processing-sop.md)
and [report template](templates/paper-release-report.template.md). These boxes are
blank for each paper; this file is not an approval of any import. Record actual
command/check, environment, date, result and evidence in the paper's report.

For each gate use `pending`, `passed`, `failed`, or justified `not-applicable`.
No gate passes on an assertion alone. A missing numbered section is never N/A.

## R1 — Source identity and complete range

- [ ] Cover/content establish exam/year/session/paper/series/language; paper
  number is not mistaken for session.
- [ ] Source PDF URL/local path/hash, printed/PDF page mapping and section ranges
  recorded; combined files, duplicate copies and missing pages resolved or explicit.
- [ ] Expected question-number set and one slot per number reconcile exactly.

## R2 — Existing-record reconciliation

- [ ] Full source identity/content checked before reusing IDs or creating records.
- [ ] New + reused + unresolved slots = original expected source count.
- [ ] Duplicate aliases link to canonical occurrences and are not added as slots.
- [ ] Similar PYQs from different source occurrences retain separate identities.
- [ ] Before-values/hashes and historical aliases preserved.

## R3 — Reproduction and second visual pass

- [ ] Every stem, statement, option, direction/passage and continuation read from
  the original; negatives, symbols, numbers and units checked.
- [ ] Original option order, underlining, error segments, tables, codes and
  Arabic/Roman markers retained.
- [ ] All required original figures/maps/graphs preserved, hashed and readable.
- [ ] Separate reread recorded with honest reviewer/method/date provenance.
- [ ] No invented condition or silent rendering-time rewrite.

## R4 — Classification and target applicability

- [ ] Every published MCQ has a reviewed specific primary leaf, rationale,
  taxonomy version and classification second pass.
- [ ] Additional placements materially tested; shared questions not duplicated.
- [ ] NDA English/GS/Science, NDA Mathematics, CDS branches and CSE GS/CSAT
  boundaries checked; no automatic pure-science or mathematics transfer to CSE.
- [ ] Economic Current Affairs also available in its relevant Economy location.
- [ ] Seven Current Affairs sections preserved; Static/Event-based and supported
  dates correct; no catch-all used to hide a missing placement.
- [ ] Necessary taxonomy amendments bounded/reviewed; union counts, overlapping
  removal, exam filters and zero-source state checked.

## R5 — Authentic answer evidence and case closure

- [ ] Official search log includes current/archive/revisions/historical filename
  variants and traceable mirrors where needed.
- [ ] Latest applicable key identity/status/series/date/hash authenticated; every
  relevant cell visually checked in two agreeing programmatic transcriptions.
- [ ] Official/displayed labels and option texts map exactly, per question.
- [ ] Primary-source fallback has all-option analysis, applicable locators and
  a separate second pass; labelled independent, never official.
- [ ] Official drops/multiple answers distinguished from unreadable/unknown cells.
- [ ] Official-key academic disagreements retain normal scoring with caveats.
- [ ] Every reviewed slot has a disposition; zero awaiting-review slots for
  source-review-complete; true quarantines have exact reopening evidence.

## R6 — Safe application and historical compatibility

- [ ] Approved overlays guard expected before-hashes and preserve raw imports.
- [ ] Answer/content/taxonomy revisions change only for their respective reasons.
- [ ] Saved choices, original snapshots and frozen historical memberships remain.
- [ ] Key-only caches refresh; old materially defective snapshots are not graded
  against content the student never saw; correction notices/exclusions checked.
- [ ] Shared eligibility/placement projection used in inventory, APIs, tests,
  results and PDFs; answer-free payloads do not leak answers/explanations.
- [ ] Supported database/catalogue paths agree, or an actual limitation is
  explicitly documented and the affected release is not falsely claimed complete.

## R7 — Exhaustive grading

- [ ] Every accepted option for every eligible question grades correct.
- [ ] Every nonaccepted option for every eligible question grades incorrect.
- [ ] Prior wrong keys rejected; officially withdrawn/duplicate-alias records
  cannot penalise students or enter new tests.
- [ ] Official multiple-answer sets represented and tested end-to-end if present;
  no single arbitrary letter substituted for an accepted set.
- [ ] Scored/excluded totals, unattempted counts and denominators correct.

## R8 — Full-paper and section experience

- [ ] Exact original full-paper membership/order and all applicable sections launch.
- [ ] Fast palette jumps/next/previous cannot answer the preceding question by
  stale controls; saved answers survive navigation, reload and submission.
- [ ] Results, explanations/caveats and provisional/independent labels correct.
- [ ] Source numbers/identity, desktop/mobile and long-content layouts checked.
- [ ] If any source numbers are unavailable, available/expected counts and exact
  exclusions visible; shorter test not called the complete original scored paper.

## R9 — Offline PDF and source assets

- [ ] Full PDF generated with compact header, correct source numbering and labels.
- [ ] Every printed accepted answer/answer set compared with reviewed evidence.
- [ ] Every exported page rendered and inspected for clipping, overlap, missing
  symbols/markers, broken tables/figures and excessive blank space.
- [ ] PDF text compared with reviewed source content; shared passages included.
- [ ] Original figures downloaded/decoded before printing; delayed/missing required
  assets block incomplete automatic and manual printing.

## R10 — Local suite, deterministic output and scoped diff

- [ ] SOP/template checks pass: `npm run test:paper-sop`.
- [ ] `npm test` passes (includes the production build and full automated suite).
- [ ] Relevant `npx playwright test` files pass for selected paper/preparation,
  saved-results and PDF flows. New structures/failure modes have regression tests.
- [ ] ESLint on changed code has no errors; existing warnings documented honestly.
- [ ] Applicable paper/import/taxonomy/coverage `--check` commands pass. Rerunning
  the paper builder produces no changes, duplicate records or revision increments.
- [ ] `git diff --check` passes; exact diff contains only authorised paper/support
  changes; no credentials, private drafts, unreviewed imports or QA artifacts staged.
- [ ] Completion report reconciles sections, six dispositions, canonical eligible
  counts, aliases and remaining evidence gaps without overstating publication.

## P1 — Commit and push

- [ ] Later user release restriction checked; otherwise standing SOP release
  applies without routine per-question approval.
- [ ] Intended repository/remote/branches and current remote state verified.
- [ ] Only reviewed scoped changes committed and pushed through existing workflow;
  no force push, destructive rollback, unrequested migration or infrastructure edit.

## P2 — Deployment identity

- [ ] Deployment is for the intended project/environment and exact pushed commit.
- [ ] Ready/success state observed; failures investigated, not ignored.
- [ ] Inspection limitations and alternative evidence recorded; no invented logs.

## P3 — Live verification and closure

- [ ] Live paper/source/section counts, target placements and evidence labels match.
- [ ] Accepted/nonaccepted grading, full-paper launch/submission/results and critical
  browser/PDF flows verified on production.
- [ ] Served official-key PDF hash equals reviewed bytes where applicable.
- [ ] Any rollout failure retained in report with diagnostic/rerun evidence.
- [ ] Final report includes commit/live URL, exact eligible/expected totals and
  genuine blockers. Only now say `live-verified`; then proceed to the next paper.

## Command guidance and boundaries

`npm test` already runs `npm run build`. Select actual relevant browser files,
and include all new formats/assets introduced by the selected paper. For example,
the completed NDA I regression uses `tests/browser/nda-original-paper.spec.ts`,
`tests/browser/nda-2026-i.spec.ts`, `tests/browser/preparation-exams.spec.ts` and
`tests/browser/print-assets.spec.ts`. Do not treat these filenames as evidence
that a future paper's distinct cases were tested.

For production checks set `PLAYWRIGHT_BASE_URL` to the **verified intended live
URL**, use fresh browser contexts and rerun diagnosed transient rollout failures.
Do not weaken assertions, disable normal PWA coverage globally, or call an
uninvestigated timeout a pass. Missing-image fault injection may isolate service
workers specifically so the injected failure actually reaches the image request.

Do not run bulk normalisation/import-apply commands as harmless checks: inspect
their effects first. A dry run is not a production database import. Templates and
this checklist create no background monitoring and no automatic answer approval.
