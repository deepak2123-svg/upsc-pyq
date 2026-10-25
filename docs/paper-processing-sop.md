# Standing SOP: process, classify, verify and publish each question paper

Version 1.0 · Adopted 25 October 2026 · Applies to all selected PYQ papers.

## 1. Purpose, precedence and standing defaults

Process **one complete selected paper at a time**, from the original PDF to a
faithful, classified, evidence-backed question bank and verified live release.
A viewable scan, OCR extraction or partially populated bank is not completion.
Do not silently defer English, Science, GS, Mathematics, CSAT or another numbered
section. Finish the current paper before beginning the next; batches are work
checkpoints, not a reason to abandon the rest of the paper.

This is the master workflow. Use [reproduction rules](mcq-reproduction-sop.md),
[exception adjudication](ambiguous-mcq-sop.md), [review templates](templates/README.md)
and the [release checklist](paper-release-checklist.md) with it. Dated batch
reports retain history but do not override this policy or the latest evidence.

Standing defaults:

- Preserve original wording, options/order, source identity and canonical IDs.
- Prefer the latest applicable official final key, then an official provisional
  key. Label provisional evidence honestly; never call a coaching key official.
- If a documented official-key search fails, primary-source reasoning with a
  separate second pass may establish an independently verified answer.
- A faithfully reproduced officially keyed question receives normal official-
  answer grading, even when an editorial disagreement needs a separate caveat.
- Never guess a letter, fabricate missing source material or substitute an
  unscored scanned-paper experience for a structured scored import.
- Complete, self-review, test, push and verify through the existing release
  workflow without routine manual approval from the user. Escalate genuine
  blockers and scope changes. A later instruction to withhold release overrides
  this default. It authorises no unrelated infrastructure/database changes,
  destructive rollback or force push, and creates no background monitor.

## 2. Stage A — Identify and register the whole paper

1. Inspect the original cover, instructions, section headings and question pages.
2. Establish exam, year, session, paper name/number, booklet series, language,
   expected numbered questions, section ranges and supported examination date.
   A paper number is not a session: GAT Paper II does not mean NDA session II.
3. Record original URL, local file, SHA-256, total PDF pages and printed/PDF page
   mapping. Distinguish original-document hashes from render/crop/note hashes.
4. Check missing pages, repeated copies, combined papers and misleading filenames.
5. Locate the matching official key early; do not independently solve an entire
   paper before checking whether its official answers are available.
6. Open a paper register with one source slot for every expected printed number.
   For a combined document, establish the selected paper's actual range; do not
   renumber it or silently expand the task to adjacent papers.

Use the [paper-register template](templates/paper-register.template.json).
Missing/unreadable items stay visible as gaps. They are not out-of-scope merely
because the current preparation view excludes them.

**Gate A:** document identity is established, expected slots are explicit and
every page/section needed for this paper is located or its gap recorded.

## 3. Stage B — Reconcile canonical records before importing

- Match exam/year/session/paper/series/question identity and the complete stem,
  options and source context. A number or short opening phrase is insufficient.
- Reuse the canonical ID for an existing source occurrence; retain aliases for
  duplicate imports. Similar questions appearing in different exams or sessions
  remain distinct PYQs, not duplicate aliases.
- Preserve expected before-hashes, original values and the exact changes proposed.
- Track new imports, reused occurrences and unresolved slots as disjoint source
  outcomes. Track duplicate alias IDs separately, linked to their canonical slot;
  do not add aliases to the original paper's question total.
- Preserve source identity corrections without silently renaming historical
  submitted snapshots. Document the corrected attribution and notice.

**Gate B:** every source slot has a reuse/new/unresolved decision. No duplicate
record is created to make the paper appear complete.

## 4. Stage C — Reproduce every question faithfully

OCR/extraction is a draft, never approval. Visually compare **every** original
question and every option, including continuations across columns/pages.

Verify complete stem, statements, passages and directions; NOT/EXCEPT/incorrect;
all labels/order; names, dates, numbers, signs, units, powers and subscripts;
underlining, blanks and error segments; matching/list headings, codes, tables,
maps, figures, graphs and labels. Preserve original printed wording, including
original defects. Do not insert conditions such as “initially at rest”.

Keep shared passages/directions linked to their original question identities and
available in standalone practice. Preserve source figure crops, source page and
asset hashes; never replace figure-dependent source material with a guessed
diagram or text approximation. Use the shared online/results/PDF formatter, not
ad hoc question-specific HTML.

Conduct a distinct second visual comparison. Record reviewer/method/date and
whether it is a different reviewer or a fresh pass by the same reviewer. Never
claim independent human review for two passes by one AI. Do not approve by
copying a first-pass status or matching a secondary transcript.

**Gate C:** each source slot has complete reviewed reproduction or an exact
documented source defect with the evidence needed to resolve it.

## 5. Stage D — Categorise and subcategorise by the tested concept

Keep the original **source exam** separate from **preparation applicability**.

| Preparation target | Accepted organisation |
| --- | --- |
| UPSC NDA | Mathematics; GAT → English, GS, Science |
| UPSC CDS | English; General Knowledge; Elementary Mathematics |
| UPSC CSE | GS Paper I; GS Paper II / CSAT |

CAPF remains a source collection; do not create a new preparation interface as
part of a paper import. Source sections may differ from these browsing labels;
retain both without relabelling the original exam.

For each question:

1. Read the full stem/options and state what knowledge or skill resolves it.
2. Choose one primary leaf in **Subject → Section → Chapter → Subpart**, recording
   stable IDs, taxonomy version and a concept-specific rationale.
3. Add reviewed additional placements only for concepts materially tested, not
   names or passing references. Store one canonical question, not copies.
4. Decide each preparation-target transfer explicitly, including level and
   syllabus fit. NDA Physics is not automatically CSE Science; Mathematics is
   not automatically CSAT. NDA English may fit CDS English without changing its
   source identity. Allow World History where appropriate to the defence exams.
5. Place economic Current Affairs in its relevant Economy location as well.
   Buddhist/Chola architecture can overlap period history and Art & Culture.
6. Preserve the seven established Current Affairs sections and Static/Event-
   based tags. Never infer an event date from examination year. Do not conceal
   unknown placements under Miscellaneous, General Awareness or another catch-all.
7. If a genuine concept is missing, review a bounded syllabus amendment with
   stable ID, parent, order, inclusions/exclusions and overlap rules. Do not alter
   unrelated chapters or add empty labels merely to accommodate a single name.
8. Conduct a distinct classification second pass and record its rationale.

**Gate D:** every published record has approved most-specific placements and
target applicability. Other records have explicit blockers. Shared parent,
subject, source-filter and combined-test counts use canonical-ID unions.

## 6. Stage E — Recover and authenticate official adjudication

Search in order: official examination/question-paper page; current keys;
archives; revisions, errata and withdrawal notices; historical indexed official
URLs (including punctuation, Unicode dash and filename variants); then traceable
mirrors of the actual official document. Log attempts, URLs, dates, results and
access limitations. One empty archive search does not establish nonpublication.

Evidence priority is latest applicable **official final**, **official
provisional**, then **independently verified** under Stage F. A snippet,
coaching table, majority vote or model answer is only a research lead.

For each official key:

- Preserve original bytes, URL/local asset, SHA-256, issuer, release date,
  final/provisional status, applicable exam/session/paper and booklet series.
  A mirror requires a documented chain identifying the official document;
  an official-looking filename alone is insufficient.
- Inspect the header and every relevant cell visually. Match the paper from
  content, not its filename. Record page, question/cell and any revisions.
- Transcribe all cells in two distinct passes (for example column-first then
  row-first) and compare programmatically, reporting mismatches before use.
- Record official accepted answer(s), dropped cells and multiple-answer cases.
  A blank/unreadable cell is not automatically an official withdrawal.
- Check the letter **and its option text**. Preserve original option order by
  default. For a previously reordered record, record a question-level mapping,
  including both official and displayed letters/text; never infer a blanket
  cross-booklet conversion from a few apparent matches.

**Gate E:** every officially labelled answer has matching document identity,
visual cell evidence, agreeing transcriptions and explicit option mapping.

## 7. Stages F–G — Primary-source fallback and exceptional cases

If no matching official key is recoverable, record the search and solve each
affected question before consulting secondary suggestions. Assess every option
and statement using directly applicable primary documents with page/section,
publisher/edition/date, supported claim and examination-date applicability.
Record calculations, assumptions, exceptions and the strongest counterargument.
A generic related document title or inaccessible snippet is not direct evidence.

Conduct a fresh second reasoning pass. If one defensible answer survives,
publish as **Independently verified** (`reasoned-verified`), not official. If
several/no answers survive or required evidence is absent, quarantine rather
than guess. Do not hide a research gap by calling it an official withdrawal.

| Situation | Disposition and behaviour |
| --- | --- |
| Faithful source, latest applicable final cell | `official-final`; normal official-answer scoring |
| Faithful source, applicable provisional cell | `official-provisional`; normal scoring, provisional label |
| Academic/wording disagreement with either official key | Retain its official disposition and scoring; separate editorial caveat |
| No recovered key, unique primary-supported answer plus second pass | `reasoned-verified`; normal scoring, independent label |
| Matching official dropped/withdrawn cell | `withdrawn`; no student score penalty |
| Duplicate import of one source occurrence | `duplicate` alias; canonical record assessed separately |
| Incomplete/unreadable reproduction, source/series mismatch, or no uniquely defensible answer without a key | `quarantined`; exact blocker/reopening evidence |

Official multiple answers require every accepted option to grade correctly. If
the runtime cannot represent them, implement/test that support before release;
do not flatten them into one arbitrary letter. This SOP/templates do not claim
that multiple-answer runtime support already exists.

Do not quarantine a faithfully reproduced officially keyed question merely for
an academic disagreement or missing-condition caveat. Do repair material lost
in our import before scoring it. Preserve a defective original as printed; a
rewritten teaching question would require a separate non-PYQ identity.

Use the [exception SOP](ambiguous-mcq-sop.md) and its case template for disputed
items. `awaiting-review` is unfinished work, not a final disposition. Work through
the remaining paper while researching a difficult item, then resolve or explicitly
quarantine it. Do not start a new paper to avoid closing the current one.

## 8. Stage H — Apply safely through existing contracts

- Apply approved overlays deterministically with expected before-hash guards.
  Preserve raw imports, PDFs, IDs/aliases, before/after values and review history.
  Stop on unexpected source changes. Re-running must not duplicate imports or
  increment revisions again.
- Keep answer-key revisions, material content revisions and taxonomy versions
  independent. Classification alone changes neither key nor content revision.
- Refresh cached key-only feedback without changing submitted choices. Preserve
  original saved snapshots; do not grade an old materially defective question
  against a repaired version the student never saw. Keep appropriate historical
  exclusions and correction notices.
- Use one shared eligibility/placement projection for inventories, selection,
  online/PDF snapshots, results and supported catalogue paths. Do not bypass it
  with a paper-specific permissive filter. Keep answers/explanations out of
  answer-free test payloads. Preserve frozen historical memberships.
- Extend existing registers/types where required; do not create a second runtime
  question bank. The templates are editorial evidence envelopes, not automatic
  import instructions or active eligibility policies.

## 9. Stages I–J — Test, release and verify live

Complete every applicable item in the [release checklist](paper-release-checklist.md).
Record command, date/environment, result and evidence; a checked box alone is
not a test. A justified not-applicable entry is allowed, but never for a numbered
section that simply has not been processed.

Required evidence:

- Exactly all expected source numbers; reviewed complete text/options/figures;
  approved placements/evidence for published MCQs; no cross-target leakage.
- Every accepted answer grades correct and **every** nonaccepted option grades
  incorrect. Test withdrawals/multiple answers and former wrong keys where present.
- Canonical union counts, overlap removal, source masks, zero-source state,
  compatibility, feedback refresh and historical material-repair safeguards.
- Full paper and applicable sections: rapid navigation, answer persistence,
  reload, submit/results, original numbering, mobile/desktop and source labels.
- Full PDF and answer key: all letters/accepted sets compared; every page
  rendered/inspected; text/symbols/tables/figures present; required-image failure
  prevents incomplete printing. Keep the header compact and the key clearly labelled.
- Production build, full automated suite, relevant browser checks, changed-file
  lint, diff check and deterministic import checks. Diagnose failures; do not
  weaken assertions or promote placeholders to approval.

After local gates pass, review the exact diff, commit only scoped changes, verify
the intended remote/branch and push through the existing GitHub workflow. Check
the deployment's exact commit and ready state. Verify live source counts/sections,
normal full-paper/section flows, grading, critical browser/PDF behaviour and
served official-key asset hash. Do not call it live merely because push succeeded.
If platform inspection is unavailable, state the limitation and use available
commit-status and direct live checks; never invent runtime-log results.

A failed gate stops release advancement and the next paper. Diagnose and repair
within scope. Escalate missing authority, irrecoverable evidence or unsafe changes;
do not perform destructive rollback or infrastructure changes by assumption.

## 10. Records, reconciliation and completion

Maintain linked **paper register**, **question review ledger** and **release
report** using the [templates](templates/README.md), extending existing registers
rather than replacing their historical records. Store actual reviewer identity,
methods, dates, rationale, evidence URLs/local hashes and revisions. Blank fields,
copied status labels and previous paper approvals are never proof.

Reconcile source occurrences and answer outcomes independently:

- Expected source numbers = new canonical imports + reused occurrences +
  unresolved source slots. Duplicate alias IDs are separate, not extra slots.
- Each slot has exactly one final question disposition after review. Resolve
  duplicate aliases to the canonical occurrence when calculating source totals.
- Report all six disposition counts, eligible unique MCQs, quarantines,
  withdrawals, section totals, corrected answers/content and target placements.
- `source review complete` requires every slot inspected/adjudicated and zero
  awaiting-review slots; it does **not** mean every slot is publishable.
- If exclusions remain, do not label a shorter eligible test the complete original
  scored paper. Show available/expected totals and explicit unavailable numbers.
  A genuine evidence gap is reported, never hidden by excluding a whole section.
- `live verified` additionally requires passed local/release gates and production
  evidence for the released commit. Keep a short final report with test results,
  commit, live link and exact remaining gaps/reopening evidence, if any.

[NDA I 2026 completion](nda-2026-i-official-completion.md) is a concrete regression
example: 150 questions, original figures/underlining, official provisional key,
two corrected prior answers and historical revision safety. It is not proof for
another paper, a claim that every future key has zero drops, or blanket approval
of future classifications. Recheck final/revised keys during the next explicit
review/release session; no background polling is implied by this SOP.
