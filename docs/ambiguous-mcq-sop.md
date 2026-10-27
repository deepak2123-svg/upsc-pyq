# SOP: ambiguous, disputed and evidence-incomplete MCQs

Version 2.0 · 25 October 2026 · Applies to all preparation exams and PYQ sources.

Read the [master paper-processing SOP](paper-processing-sop.md) first. This document
covers exceptions within that workflow, not a separate import/publication policy.

## 1. Purpose and current policy

Publish faithful, defensibly answered questions without penalising students for defective imports or ambiguous originals. Preserve the original question, source identity and historical attempts. An unanswered research question must not become a guessed answer merely to complete a paper.

A faithful question with an authentic applicable official answer receives normal
official-answer scoring. Academic disagreement, unusual assumptions or defective
wording in the original are documented as separate editorial caveats, not grounds
alone to hide the official answer or make that question unscored. This does not
permit scoring an import missing material present in the original.

[NDA I 2026 is complete](nda-2026-i-official-completion.md): 150 questions scored
against the recovered official provisional key. Earlier pending/quarantine counts
and the scanned-paper workaround remain only in dated historical reports; they
are not the current policy or a live counter. Future paper totals come from their
own reviewed registers. Do not add reused records or duplicate aliases as extra
source slots.

## 2. Keep three decisions separate

Record each independently:

1. **Source identity/reproduction:** Is this the right paper, series, number, wording, option order, table and figure?
2. **Answer evidence:** Is the answer official final, official provisional, reasoned, or not established?
3. **Publication/scoring:** Is the faithfully displayed question safe to place in a new scored test?

Classification into a syllabus topic is a fourth, independent decision. Correct placement does not verify an answer. A matching official key establishes the examination's published answer; it does not automatically remove a missing condition or a contradiction in the stem.

## 3. Triage reasons

Give each held case one main reason and any secondary reasons. Do not call every evidence gap an ambiguous question.

| Reason | Diagnostic question | Recorded NDA I examples |
|---|---|---|
| `evidence-gap` | Is the proposed answer plausible, but a directly applicable primary source is still missing? | Q59, Q71, Q85 |
| `missing-condition` | Does the answer depend on an unstated initial value, domain, observation geometry or assumption? | Q60, Q64, Q68, Q75 |
| `wording-defect` | Does the original wording reverse a relationship, omit a necessary qualifier or permit different readings? | Q88 |
| `exception-or-model` | Does a universal statement have a relevant exception, or do reasonable models produce different answers? | Q67, Q86, Q95 |
| `reproduction-defect` | Did our import lose something that exists in the source? | Missing statement, option, exponent, table or diagram |
| `source-key-mismatch` | Could a different exam/session/series or reordered option explain the apparent disagreement? | Wrong booklet table or incorrectly labelled mirror |
| `multiple-or-no-answer` | After faithful reconstruction, are several or no options defensible? | Record the actual surviving options; do not guess the examiner's intention |

The NDA I examples identify historical research issues, not current holds. When
the matching official key has been established, retain its answer and record any
remaining academic issue as a caveat. Do not copy an old hold into a new review.

## 4. Review procedure

### Step A — Open a case and protect scoring

- Assign one stable case ID linked to the canonical question ID or, before import, its exact source occurrence.
- Keep a new unresolved import in staging, outside inventories, new snapshots and PDFs. A held new question need not be inserted into the live bank merely to record it.
- For an existing published question, record a proposed hold separately from implementing it. Any applied hold must use the shared eligibility gate, retain historical lookup and trigger the historical-scoring rules in section 7.
- Record the exact problem and the specific evidence needed to resolve it. “Needs review” alone is insufficient.
- Do not change raw records, answers, source metadata or saved attempts while investigating.

### Step B — Confirm the source before debating the answer

- Read the original cover and question pages. Confirm exam, year, session, paper, booklet series, language and printed question number from content, not filename.
- Compare the complete stem, every statement and all options. Check negatives, units, decimal points, superscripts, diagram labels and any continuation on the next page/column.
- Preserve required figures and tables. A text-only approximation cannot replace a figure-dependent question.
- If the source contains the missing material, classify the problem as an import defect and restore only what the source supports.
- If the source itself is defective, preserve it. Do not insert “initially at rest,” “normally,” “under standard conditions” or similar words to manufacture a unique answer.
- Store original-document hashes; separately label render/crop hashes and hashes of editorial reading notes. None is a substitute for another.

### Step C — Recover and match official adjudication

Search the official examination page, current key listing, archives, relevant
errata/withdrawal notices and historical official URLs (including Unicode dash,
punctuation and filename variants), then traceable mirrors of official documents.
Log actual attempts and access limitations; one unsuccessful archive search does
not establish that an official key was never released.

- Inspect the document header and relevant key cell visually. Match the **actual series and question identity**.
- Record the official letter, displayed letter and exact option-text mapping if order differs. Never infer a global letter conversion from a few apparent matches.
- Keep provisional keys explicitly provisional. Use the latest applicable official revision while retaining the previous evidence/version.
- An official dropped cell means `withdrawn`. Lack of an answer or our disagreement does not by itself mean officially withdrawn.
- A coaching site, majority vote or branded answer table is a research lead, not an official key. Never relabel one as official because its filename says so.
- Preserve the key bytes/hash, issuer, release date and identity. Read all relevant
  cells in two distinct passes and compare the transcriptions programmatically.
  Record every accepted option when the official authority permits more than one;
  do not choose just one because the runtime currently expects a single letter.

### Step D — Analyse the question as printed

Apply Steps D and the reasoning part of Step E only when no matching official
answer is established. Under the user's 27 October 2026 instruction, an official
UPSC answer settles scoring; routine independent solving, speculative ambiguity
research and waiting for a future key are not prerequisites. Reproduction and
two-pass key transcription checks still apply. Existing evidence labels remain
truthful to the document, including provisional labels where actually printed.

For every material claim, use directly relevant primary documents: original standards/regulator or institution documents, primary-publisher textbooks, research, or the original historical source where appropriate. Use the facts applicable at the examination date.

Create a short decision table for **all options**, including why each alternative fails or remains viable. For statement-code questions, assess every statement before looking up the answer code.

Record:

- The literal reading and any ordinary textbook/exam-model reading.
- Every assumption that changes the answer, distinguishing explicit conditions from conventions.
- A counterexample whenever claiming a condition is missing or a universal statement is false.
- Whether an exception is material at the syllabus level. A remote technicality is not automatically grounds to reject an otherwise standard, well-defined model.
- The exact passage, document section/page, edition/date and how it supports the claim. A primary document's title or a generic related chapter is not enough.
- Any incomplete access: a snippet, indexed text, inaccessible link or paraphrased reading note must be labelled honestly. It cannot alone settle a disputed qualifier or exception. Obtain the full relevant context before resolving that dispute.

Where no matching official key is recovered, one answer surviving without adding
a material assumption may advance to reasoned verification. Multiple/no surviving
answers or insufficient direct evidence require quarantine. Where the official
key is matched, this analysis informs a separate caveat rather than replacing
official grading or claiming the official answer is scientifically indisputable.

### Step E — Conduct a distinct second pass

- Reopen the source and solve/read independently of the first proposed letter; compare the proposed answer only after deriving the result.
- Recheck all options, option ordering, source context and the strongest counterargument.
- Record reviewer identity, date, whether this is a different reviewer or a fresh pass by the same reviewer, and a concrete rationale. A second pass by the same AI must not be described as independent human review.
- Automation may suggest classifications or flag contradictions. It cannot approve a case by copying a first-pass status, a transcript or a secondary answer table.
- If the second pass disagrees on source/key identity or on a reasoned answer
  without an official key, retain both analyses and keep the case held. For a
  verified applicable official answer, retain its scoring and document the
  academic disagreement separately. Never decide by confidence or majority vote.

### Step F — Choose and apply a defensible outcome

| Outcome | Required evidence | New scored tests |
|---|---|---|
| `official-final` | Latest applicable final official cell; identity and faithful reproduction passed | Eligible; caveat separate if needed |
| `official-provisional` | Matching provisional official cell; clearly labelled; identity and faithful reproduction passed | Eligible; provisional label and separate caveat if needed |
| `reasoned-verified` | No recovered matching official key; one defensible answer; primary evidence, alternatives and second pass documented | Eligible |
| `withdrawn` | Matching official withdrawal/drop evidence | Excluded |
| `duplicate` | Same source occurrence already represented; canonical record and alias identified | Alias excluded; canonical assessed independently |
| `quarantined` | Incomplete reproduction/source identity, unresolved key mapping, or no unique defensible answer without an official key | Excluded; specify exact reopening evidence |

“Awaiting review” is an unfinished workflow state, not a final verification category. Record an explicit disposition when its review is completed; quarantine is a valid defensible outcome, not a failure to finish.

## 5. Official answer versus academic disagreement

- Retain the authentic official answer in the evidence record even if it conflicts with independent reasoning. Do not silently replace it with an editorial answer.
- Distinguish a source/option mapping mistake from a substantive disagreement before calling a key disputed.
- If the question is faithful, publish the authentic official answer with normal
  grading. Explain the ordinary model where supported and record any surviving
  academic/wording disagreement as a concise separate caveat. Do not invent a
  missing condition or an explanation claiming the disagreement is resolved.
- Missing original content in our import, uncertain source/series identity or
  unreadable required material still prevents publication until repaired.
- An unscored scan viewer is not a substitute for completing structured question
  imports, authentic answers and results. The old NDA I workaround is superseded.
- A rewritten teaching question is not an exact PYQ. If ever created, it needs a separate editorial identity and must not overwrite the original record or appear as an official question.

Record answer evidence and editorial caveats separately in review evidence. The
current single-answer grading contract must be extended and tested if a selected
paper contains an official multiple-answer cell; this SOP does not implement it.

## 6. Worked case: NDA I Q75

The registered force-time graph yields an impulse of 400 N s. For 10 kg, this fixes the velocity change at 40 m/s. It does **not** fix the final speed without an initial velocity and direction.

For example, initial velocities of +10 and +20 m/s in the force direction give final speeds of 50 and 60 m/s respectively. Both are compatible with an initially moving object. Assuming rest merely selects an intended option; it does not repair the original.

**Current decision:** `official-provisional`, accepted answer **D (40 m/s)**,
from UPSC's matching Series A Q75 cell. The original graph is reproduced and the
missing-initial-condition observation remains a separate editorial caveat. The
question is normally scored; it is not currently quarantined. The key's URL,
hash and two-pass transcription are recorded in the completion report and ledger.

Reopen on an official final/revised key or erratum, a source-reproduction issue,
or new directly applicable evidence. A coaching assumption is not a substitute
for the official evidence and must not be inserted into the PYQ's wording.

## 7. Safe application and historical attempts

Before applying any approved change:

1. Check the expected pre-change record hash and source identity. Stop on a mismatch.
2. Apply approved overlays deterministically; retain before-values, evidence and rationale. Re-running must not create duplicate records or revision increments.
3. Increment answer-key revisions for changed keys; content revisions for material wording/options/figure repairs. Classification alone changes neither.
4. Use the shared eligibility projection for new inventory, online and PDF snapshots. Deduplicate canonical IDs across shared topics and sources.
5. Preserve submitted answers and original saved snapshots. Refresh feedback for key-only corrections; never grade a materially repaired version against an earlier defective snapshot the student actually saw.
6. Held/withdrawn/duplicate-alias or materially defective historical questions must show **Excluded from score**, with null correctness/answer where appropriate, no denominator penalty, and a concise notice. Do not erase their historical IDs.
7. Verify old/mixed attempts and online/PDF agreement. Follow the master SOP's
   standing release instruction after all gates pass, unless a later user request
   explicitly withholds release. Do not request routine per-question approval.

This SOP authorises no retroactive bulk status change. Existing published records requiring a hold must be individually identified, evidenced and applied through that workflow.

## 8. Research limits and reopening

- Process one source paper at a time in batches of up to 30. Do not let a difficult held question block review of the remaining numbered questions.
- Give each held case one source-reconstruction/key-search pass and one targeted primary-evidence/second-review pass. If the exact blocker remains, record it and park the case instead of repeating the same search or forcing a letter.
- Reopen only on meaningful new evidence: recovered key/erratum, better original scan, directly applicable primary source, resolved identity, or a documented reviewer challenge.
- Recheck the official key sources at the next paper-review session and before a proposed release. This is a checklist instruction, not an automated monitor or promise of background work.
- A newer official key triggers a recorded comparison against reasoned/provisional answers and any associated quality caveats; it must not silently overwrite them.

## 9. Case record and closure checklist

Use [the case template](templates/ambiguous-mcq-case.template.json). Nulls/empty arrays mean unfilled, never approved. Minimum closure evidence:

- Stable case/question/source identity, original PDF page and hash, faithful stem/options/figures.
- Issue category, precise disputed claim, primary evidence with locators, all-option analysis and any counterexample.
- Official answer evidence separately from editorial conclusion; mapping/reordering explicitly recorded.
- First and second reviewer identities/methods, dates and rationale; disagreement retained.
- Publication/scoring decision, exact reopening evidence if held, before/after hashes and applicable revisions if changed.
- Eligibility, grading, old attempts, online/PDF rendering, unique counts and idempotence checks where application changes are made.
- A reconciliation with mutually exclusive counts: not reviewed, held, verified and deferred/out-of-scope for the stated scope. Never sum existing occurrences as extra source slots.

## 10. Close the current paper, not just the exception

Finish every numbered section using the master SOP; resolve or explicitly
quarantine each researched exception without leaving awaiting-review slots.
Report source accounting, answer dispositions, eligible canonical questions and
remaining evidence gaps separately. A completed review does not mean every
question is publishable, and a shorter test must not be advertised as the full
original scored paper. Do not start an unrelated paper to avoid closing an issue.

Use the [release checklist](paper-release-checklist.md) and report template.
Creating a case or writing this SOP changes no runtime status by itself.
