# Paper review templates

Use these within the [standing SOP](../paper-processing-sop.md). They are blank
editorial evidence envelopes, **not** runtime policies, JSON Schemas, import
commands or proof that a review occurred. Nulls, empty arrays and false flags
mean unfilled/unapproved; do not bulk-convert them to approvals.

| Template | Use |
| --- | --- |
| [Paper register](paper-register.template.json) | One selected source paper, expected numbers, page/section map, one slot per number and linked review records |
| [Question review](question-review.template.json) | Full reproduction, classification, answer evidence, second passes, disposition and revisions for each source occurrence |
| [Exception case](ambiguous-mcq-case.template.json) | Additional research/counterarguments for a disputed or incomplete question; link from its ordinary review row |
| [Release report](paper-release-report.template.md) | Human-readable reconciliation, local/production evidence and release outcome |

## How to populate

1. Pick a stable paper ID from verified source identity. Copy the register into
   the paper's existing audit/register area; extend existing records rather than
   inventing another live bank. Link legacy ledger paths where already present.
2. Populate `expectedQuestionNumbers` with the actual printed range; create one
   `questionSlots` entry per number using the structure in `questionSlotFields`.
   Do not add `questionSlotFields` itself as a real question.
3. Fill one question review per source occurrence, keyed by canonical ID or a
   stable staged source ID until resolved. Several review records may live in
   one ledger; links may identify a row rather than requiring one file per MCQ.
4. Reuse paper-level document/search/key-transcription evidence by ID. Keep
   per-question key cell and exact option mapping in each review. Do not copy a
   shared approval into every row without actually performing its review.
5. Link exception cases and taxonomy amendments only where needed. Preserve
   reviewer identity, method/date and same-reviewer-versus-different-reviewer
   provenance. Never label two AI passes independent human review.
6. Derive totals from question slots/ledgers. Do not manually adjust counters to
   match a desired publication total. Preserve all previous evidence/revisions.

## Decisions and safe completion

- Workflow: `not-started`, `in-progress`, `source-review-complete`,
  `local-verified`, `release-blocked`, `live-verified`. A state is earned by its
  evidence/gates, not merely assigned because a template was filled.
- Final dispositions: `official-final`, `official-provisional`,
  `reasoned-verified`, `withdrawn`, `duplicate`, `quarantined`.
- Source accounting actions: `new`, `reused`, `unresolved`. Duplicate import
  aliases are separately linked to the canonical source slot, not extra numbers.
- Accepted-answer arrays must contain the actual displayed option labels and
  retain the original official accepted labels plus any exact mapping. Empty
  arrays do not mean withdrawn without official evidence. Multiple accepted
  options require runtime support/tests before release; these templates do not
  add that support.
- The exception template retains legacy singular answer fields for compatibility.
  Fill them only for a single accepted option; leave them null for multiple
  answers and record the complete accepted sets in the arrays. Never turn one
  member of an accepted set into the sole runtime answer.
- `classification` needs primary and justified additional placements, target
  applicability with the specific placement IDs in each target view, taxonomy
  version, rationale and a distinct second pass.
- Official evidence needs matching identity, preserved PDF/hash, cell locator,
  agreeing double transcription and option-text mapping. Reasoned evidence needs
  an unsuccessful official search, all-option analysis, primary locators and a
  separate reasoning review. Keep original-defect caveats separate from official
  grading; missing source material in our import is still a blocker.
- `duplicate` refers to an alias of the **same** occurrence. Similar questions
  from different exams/sessions retain distinct identities. Resolve the canonical
  disposition when calculating source-paper answer totals, so aliases do not
  inflate those totals.
- `source-review-complete` requires all expected slots inspected/adjudicated and
  no awaiting-review rows; it can still have quarantines/withdrawals. Eligible
  counts and release state remain separate. Incomplete reproduction cannot be
  marked passed merely because an official letter exists.
- Checklist results: `pending`, `passed`, `failed`, or `not-applicable` with a
  concrete rationale. Do not mark missing tests not-applicable or a failed
  production check passed because GitHub accepted the push.

Use [the release checklist](../paper-release-checklist.md) for required gate IDs
and [the NDA I report](../nda-2026-i-official-completion.md) as a dated example,
not as prefilled evidence for another paper. No runtime bank, status, count or
saved attempt is changed by these documents.
