# Complete Prelims classification implementation

## Milestone 1: draft syllabus and safe classification foundation

This is an implementation progress record, **not a completion or publication claim**.

Implemented locally:

- A reproducible editorial syllabus draft covering 9 subjects, 50 sections, 168 chapters and 896 subparts.
- All 11 Physical Geography chapters and 92 subparts carried over with their original labels, order and legacy taxonomy IDs.
- Exactly seven Current Affairs sections, without Miscellaneous, Other or General Awareness sections. Static/Event-based is a classification tag, not a guessed event date.
- A standalone, typed multi-placement index: one primary placement, reviewed additional placements, unique question unions for parent and combined counts, source masks and held-record exclusion.
- A hash-based discovery register for 74 dedicated PDFs: CSE 14, CAPF 10, CDS 25, NDA GAT 25. These are discovered files, **not 74 verified paper identities**. Combined-session and question-level coverage checks are outstanding.
- An immutable baseline queue for all 1,519 existing records, partitioned into 58 paper-specific batches of at most 50.
- An initial diagnostic first-pass pilot of all 17 records currently labelled Polity. It reveals environmental, financial and international-governance topics rather than reliable existing subject labels. Fifteen have specific candidate placements; two explicitly require syllabus amendments and have no candidate placement forced on them. All 17 await second-pass review.
- Tests covering overlap, cross-subject placement, removal, source masks, pending/held exclusions, invalid approvals, hierarchy, physical preservation and source/batch accounting.

## Safety boundaries

The draft registry and new index are deliberately **not wired into the active library**. The approved plan requires a cross-subject pilot and syllabus freeze before bulk migration. Existing single-home catalogue behaviour remains active until that reviewed migration is implemented end to end.

No answer, question wording, question ID, verification disposition, snapshot or saved attempt was changed for this milestone. No new MCQ was imported or published. No production database, GitHub or deployment action was performed.

## Remaining work in required order

1. Replace generic draft boundary text with chapter-specific exclusions/cross-links and real-question examples. Resolve nature-finance and ecosystem-restoration pilot gaps without a catch-all leaf.
2. Complete a first and second pilot pass for every subject, including real Ancient/Art and Culture overlap. Freeze a reviewed syllabus version; do not relabel the draft as approved automatically.
3. Verify document covers, actual paper/session/series, ranges and hashes; account for every question number, including combined NDA 2020 material.
4. Review the 58 existing-record batches, preserving the baseline fingerprints and separate answer eligibility. Record out-of-scope decisions explicitly.
5. Implement the versioned inventory/recipe migration, exact old-selection question sets, additional-placement filters, parent and selected-count unions, empty nodes and server/database parity. Connect the new index only after those compatibility tests pass.
6. Extract and review missing source-paper MCQs in chronological exam order. Verify complete reproduction, original figures and answers before releasing any import.
7. Run the full suite and browser/PDF flows, reconcile every source question number, and present the local release diff and counts for approval.

## Commands

```powershell
npm run content:prelims-syllabus
npm run content:check-prelims-syllabus
node scripts/prepare-prelims-classification.mjs
node scripts/prepare-prelims-pilot.mjs
node --test tests/question-placements.test.mjs
npm test
```

Preparation refuses to overwrite an existing register if its baseline changes. Review it through an explicit migration rather than deleting review history. Syllabus generation is deterministic and supports a read-only freshness check.

## Validation for this milestone

- `npm test`: production build succeeded; **81 tests passed**, zero failed. Includes six new placement/syllabus/register tests and the previous audit, grading, snapshot, rendering and selection regression tests.
- `node scripts/build-prelims-syllabus.mjs --check`: passed.
- Repeated preparation of source/register and pilot artifacts: passed without replacing existing data.
- Baseline bank SHA-256 comparison: unchanged. Explicit comparison of all preserved Physical Geography chapter/subpart labels and subpart order: passed.
- `git diff --check`: passed (Git reports existing LF/CRLF conversion warnings).
- Browser/PDF checks for the future active V2 migration have **not** been performed; that migration is not yet implemented or activated.

## Milestone 2: source coverage and local live multi-placement pilot

The preceding sections record the earlier milestone. The following supersedes its statement that no imports or runtime integration exist; the full nine-subject draft still is not activated.

### Source work

- Reused prior extraction evidence only as work-queue leads: 73 original PDF hashes match the previous 73-paper inventory. Prior publication flags and classifications are not inherited as fresh approvals.
- Visually inspected the complete CSE 2013 Series A cover and first English question page, the complete official mirrored Series A key page, and NDA II 2026's Series A cover. The last cover explicitly confirms the additional paper and 150 questions.
- The coverage register accounts for **9,400 question-number slots across 74 PDF files**. Slot accounting is not complete question reproduction or classification review.
- Staged **7,210 secondary transcript candidates** separately from the active bank: 998 exact text/option reuse leads, 15 ambiguous duplicate leads, 57 stem/option conflicts and 6,140 potential missing-import leads. These are baseline discovery actions, not counts of approved GS imports; scope review is still necessary.
- Three source occurrences on the first CSE 2013 English page now have explicit reviewed outcomes: Q1 and Q2 reuse `cds-2013-2013-1` and `cds-2013-2013-2`; Q4 is genuinely new. Matching only proposed IDs initially missed the legacy identities; matching the full source occurrence prevented adding two duplicates.

### Live local behaviour

- Added **one** verified local import, `cse-2013-gs-i-4`, in a separate approved-import file. Retained the existing historical bank, all existing IDs, wordings, answers and audit revisions.
- Corrected two existing records' primary classifications through reviewed overlays, without modifying their original source records or saved snapshots.
- The new History question appears under Art & Culture / Architecture / Rock-cut architecture and Ancient India / Mauryan Empire / Art and patronage. The draft gained the explicit patronage subpart and now has **897 subparts**.
- Active inventory version **4** carries answer-free leaf question-ID membership and calculates parent, selected, source-control and setup counts using unique unions.
- New builder recipes use V4. V2/V3 endpoints remain primary-location-only; existing V3 draft leaf IDs restore into V4 without adding secondary paths. V4 retains timed-session behaviour and existing online/PDF flows.
- Shared canonical grading and server catalogue overlays include the approved import. **No database rows were imported**; a database-backed deployment cannot gain missing rows merely through an overlay. Production database import/parity remains a release task, not something verified here.
- Current local combined history: **1,520 records**, **1,497 eligible**, **1,215 mapped**, **282 unmapped**. Additional placements do not increase unique question totals.

### Remaining work

This is a working pilot, not completion of the full project. The 17-record diagnostic pilot, chapter boundary review, cross-subject syllabus freeze, the remaining existing-record batches and the complete 74-paper missing-import exercise remain outstanding. The broad draft is not represented as a fully reviewed live syllabus. The original 204-record answer audit and its 23 held dispositions remain unchanged.

### Milestone 2 verification

- `npm test`: build succeeded; **85/85 tests passed**. The added checks cover legacy-ID reuse, no duplicate source occurrence, answer-free V4 snapshots, V3 primary-only compatibility, unique ancestor totals, held transcript staging and timed V4 sessions.
- Current browser suite (`prelims-placement`, `library-workspace`, `exam`, `audit-exclusions`): **27/27 passed** after source-identity deduplication. This includes browser selection -> V4 snapshot -> IndexedDB timed attempt -> corrected grading -> PDF, desktop/mobile layouts, saved results and prior figure/exclusion flows.
- Both complete pages of the new History PDF were rendered and visually inspected: one question, one accepted answer, intact statements/options, readable header and no duplicated occurrence.
- Approved-import generation, source-coverage generation and syllabus freshness checks pass. The original historical-bank SHA-256 still equals the frozen classification baseline.
- Full TypeScript checking continues to report the eight previously documented errors in admin import, D1 examples, ScopeNode display numbering and ambient worker types. No new diagnostic was reported for the added placement/import types in that check. The production build succeeds.
- No live database test or production import was performed. Do not describe this local pilot as completed four-exam coverage or full V2 syllabus activation.

Machine-readable current reconciliation: `content/taxonomy/prelims-classification-progress.json`. Regenerate after a successful build with `node scripts/report-prelims-classification-progress.mjs`.

## Milestone 3: active nine-subject working library and CSE 2013 classification

This supersedes the earlier milestones' inactive-draft statements. The working
registry is now connected locally: **9 subjects, 50 sections, 168 chapters and
903 subparts**. It remains an editorial working version, not a claim that every
chapter boundary or every source-paper question has been reviewed.

### Runtime and compatibility

- All nine subjects and empty topics are navigable. Empty topics cannot start a
  test. Current Affairs has precisely the seven agreed sections in both the
  main browser and the left hierarchy.
- Approved primary and additional placements flow through the unique-ID
  inventory, selection builder, V4 snapshots and server recipe matching.
- A frozen, answer-free pre-expansion leaf inventory preserves exact memberships
  for old drafts. Retired or changed scopes restore as hidden legacy scopes,
  not broadened replacements. V2/V3 retain their historical primary semantics.
- Ten English-language records have explicit GS scope exclusions. Historical
  answer-verified English attempts still grade; scope is not answer validity.
- Answer keys, material content revisions, saved answers and snapshots remain
  independent of taxonomy edits. The raw bank still matches the frozen baseline.

### Classification reconciliation

The ledger contains **434 decisions: 424 approved placements and 10 GS scope
exclusions**. Of the approved placements, **362 preserve the existing Physical
Geography review and 62 are fresh decisions**; one of those fresh decisions is
the genuinely new History import.

For the original **1,519-record cohort**, this is **423 approved placements,
10 out-of-scope records and 1,086 still awaiting the current classification
review**. All original CSE 2013 records now have a classification decision.

Two source-bounded batches reviewed 39 remaining CSE 2013 records, including a
retained duplicate alias. Each decision stores a complete-stem rationale and a
separate boundary-check rationale in the reviewed ledger. Classification does
not certify a new original-page comparison or clear the alias for publication.

Examples of corrected homes:

- Nitrogen inputs: Ecology / Nutrient cycles, not Economic Geography.
- Sugar-industry byproducts: fuel applications, with an Energy placement.
- National-park/river pairs: protected areas and Indian drainage.
- Demographic dividend: Population, with Skill development.
- Forest-rights authority: forest governance, Panchayats and tribal rights.
- Ecological niche and ecosystem productivity gained explicit concept leaves;
  neither is hidden in a generic chapter.

The repaired NDA 2025 I Q86 has an approved grid/latitude placement but remains
answer-quarantined. The forest-rights historical duplicate remains excluded.
No classification decision changes the original 204-record answer-policy holds.

The active local pool is **1,488 eligible GS MCQs: 1,227 mapped and 261 still
unmapped**. A mapped record can still await the new editorial review; mapped
does not mean freshly source-verified. Subject totals overlap and must not be
added together to obtain library totals.

### Remaining work and release boundary

1. Continue the remaining 57 source-bounded existing-record batches, beginning
   with CSE 2014. Keep complete-stem reviews, explicit secondary placements and
   separate answer eligibility.
2. Finish chapter-specific boundaries and examples before final taxonomy freeze.
3. Adjudicate the source-paper slots and missing imports. Of 9,400 inventoried
   slots across 74 PDFs, only three have explicit decisions in this new source
   exercise. The 7,210 staged transcripts remain held leads, not published imports.
4. Validate database-backed catalogue parity in an authorized local environment;
   do not imply production data gained rows through a TypeScript overlay.
5. Present the final corpus reconciliation and release diff for approval.

No GitHub push, production import or deployment has been performed.

### Milestone 3 verification

- Production build and `npm test`: **93/93 passed** on the current data and runtime.
- Browser suite: 25 passed initially; three obsolete assertions assumed additive
  child totals or fixed pre-review library sizes. Updated them to verify each
  card against the API and combined selection against unique question-ID unions.
  All three targeted reruns passed. Thus all 28 covered browser scenarios have
  passing current-feature evidence, including online/PDF and mobile flows.
- Syllabus, approved-import, reviewed-placement, source-coverage and current
  classification freshness checks passed. Raw-bank baseline and duplicate holds
  remain intact; repeated generation produced no new review decisions.
- Full `tsc --noEmit` still reports six pre-existing diagnostics: two admin-import
  type errors, two SQLite/Postgres example mismatches and two missing worker
  ambient types. No new taxonomy/placement diagnostic appeared. Do not describe
  the full TypeScript check as clean.
- `git diff --check` passed with the existing line-ending conversion warnings.

## Milestone 4: CSE 2014 and 2015 existing-record classification

The reviewed overlay now includes all existing CSE 2013, 2014 and 2015 records.
This does **not** mean all questions from those original papers have been
imported: missing-question reconstruction and source-slot adjudication remain
separate, unfinished work.

- Reviewed **46** pending CSE 2014 and **36** pending CSE 2015 records, with
  complete stems/options and explicit second-pass boundary rationales.
- Preserved legacy IDs for source-corrected records. Four CSE 2015 duplicate
  aliases share the canonical conceptual homes but remain excluded by policy.
- Added bounded leaves for north-eastern hills, species threat drivers, tiger
  reserves, polar forums and summit identity/purpose. The working syllabus now
  has **908 subparts**; the nine subjects and seven Current Affairs sections are
  unchanged.
- Kept event classification distinct from an event date. Rio+20 is Event-based;
  a news-location question about Golan Heights is Static. Neither receives an
  event date inferred from its examination year.
- Second-pass checks rejected weak overlaps: ministry ownership alone does not
  establish watershed-science knowledge; an imported coal input is not itself
  a trade-policy question; a Centre-State court-jurisdiction question is not an
  interstate administrative-coordination question.

Current original-cohort reconciliation: **505 approved placements, 10 out of
scope and 1,004 awaiting the current review = 1,519**. Approved includes 362
preserved Physical Geography decisions and 143 fresh original-record decisions.
The additional verified History import makes 506 approved placement records in
the combined ledger. Three of the 58 original source-bounded batches are complete;
the next is CSE 2016.

Current local eligible GS pool: **1,488 unique questions, 1,268 mapped and 220
unmapped**. This milestone does not change any answer key, original question
wording, answer/content revision, original snapshot or student-selected answer.
The raw bank continues to match the frozen classification baseline hash.

### Remaining compatibility check

The pre-expansion frozen inventory has exact-membership restoration tests.
Still verify drafts saved during successive working-V2 editorial revisions:
the current working taxonomy version is unchanged while membership can evolve.
Add explicit membership/revision protection before claiming all evolving draft
selections can never broaden. Submitted attempts retain their immutable question
snapshots and are not affected by this draft-builder issue.

The check above is superseded by the exact-membership implementation in
Milestone 5 below. Older working drafts without recoverable membership are
explicitly flagged for re-confirmation, not silently broadened.

All changes remain local. No production database writes, GitHub push or deployment.

### Milestone 4 verification

- Current production build and full automated suite: **95/95 passed**.
- Full browser run after CSE 2014: 27/28 passed. The History overlap test still
  assumed the whole History subject contained only its first imported question.
  It now selects Art & Culture explicitly, verifies Ancient India is already
  covered as `Added`, and checks the single-MCQ timed/PDF flow. After correcting
  its button locator to include the existing arrow label, that flow passed.
- Current CSE 2015 targeted browser checks passed for source counts, cross-subject
  PDF selection, all nine subjects/seven Current Affairs sections, and the
  single-question History overlap flow. The latter's snapshot and answer-key PDF
  still contain one occurrence, not two.
- Reviewed ledger, current cohort reconciliation and syllabus freshness checks
  passed. All four CSE 2015 historical duplicate aliases remain held.
- `git diff --check` passed; existing LF/CRLF conversion warnings remain.
- Source-paper import coverage remains three explicit decisions out of 9,400
  slots. No new original-paper reconstruction was claimed in this milestone.

## Milestone 5: CSE 2016 and exact saved-selection membership

### Classification

Reviewed the **36** remaining existing CSE 2016 records. The new bounded leaves
are Civil services, Emissions accounting, Desertification convention and
International NGOs. Four source-bounded existing-record batches (CSE 2013–2016)
are now complete; next is CSE 2017. This remains existing-bank classification,
not completion of the original papers' missing imports.

Original cohort: **541 approved placements, 10 out of scope, 968 pending = 1,519**.
Approved includes 362 preserved Physical Geography decisions and 179 fresh
original-record decisions. With the one genuinely new History import, the
combined approved-placement ledger has 542 records. The working syllabus has
9 subjects, 50 sections, 168 chapters and **912 subparts**.

Active local eligible GS pool: **1,488 unique questions, 1,290 mapped, 198
unmapped**. No original question wording, answer key, original ID, saved answer
or historical grading disposition was changed by these classifications.

### Exact-membership contract

The earlier within-working-V2 draft risk was real: stable topic IDs do not imply
stable question sets. The draft builder now saves version **6**, with answer-free
membership per selected leaf and all exam sources (including disabled sources).

- Unchanged scopes restore normally. Changed scopes restore as hidden exact-set
  scopes in the right panel; the main browser still shows the current catalogue.
- Questions that became held/out-of-scope are filtered out during restoration.
  A source identity change cannot resurrect a question in its former exam bucket.
- Navigating or reloading does not enlarge a selection. Source buttons still
  apply to the entire test, including hidden saved scopes.
- Explicit Add remaining/parent actions add today's questions and coalesce a
  fully covered saved subset into one selection item. Overlapping IDs count once.
- Both online and PDF V4 requests carry exact membership. The server validates
  schema, subject scope, source identity and current eligibility, and refuses
  partial/missing membership when the explicit membership field is present.
- A stale syllabus version can use validated explicit memberships without
  broadening. Requests without memberships retain the existing version check.
- The pre-expansion frozen legacy scopes remain supported. Working-V2 drafts
  predating membership snapshots cannot be proven exact; they require explicit
  re-addition, with a visible warning. Browse location and valid setup settings
  still restore. They are not silently substituted with a larger question pool.
- Submitted attempts remain immutable snapshots. This is protection for builder
  drafts and new snapshot requests, not a rewrite of old submitted attempts.

The exam-specific library heading/left-panel total now also uses a unique
question-ID union rather than summing overlapping subject counts.

### Verification and remaining work

Production build and full automated suite: **103/103 passed**. New tests cover
growth, relocation, repeated restore, disabled sources, malformed membership,
eligibility changes, parent/subset coalescence, multiple saved generations of
one changing leaf, and exact V4 API responses. Full
TypeScript checking still has the six previously documented unrelated errors;
there are no new taxonomy/draft-membership diagnostics in that check.

Browser checks include saved subset -> reload -> source off/on -> timed online
snapshot, and explicit Add remaining -> exact PDF union. No live database writes,
GitHub push or deployment were performed. Continue classification, complete the
chapter-boundary specification and review/import missing original-paper MCQs;
the whole four-exam corpus is not yet finished.

The complete browser run passed 30 scenarios initially; its old-draft fixture
had injected session storage before hydration finished. Waiting for the library
to become interactive before injection fixed the test race. All three draft
scenarios then passed together, giving passing evidence for all 31 scenarios.
The saved-subset screenshot was visually inspected: the right panel retains one
selected MCQ while the middle panel shows the full current topic and Add remaining.

## Milestone 6: CSE 2017–2020 and fuller concept coverage

Reviewed **100** more existing records: 26 from CSE 2017, 24 from 2018, 23 from
2019 and 27 from 2020. All existing CSE 2013–2020 records now have classification
decisions; original-paper missing-import coverage is still a separate exercise.

The original 1,519-record cohort now reconciles to **641 approved placements,
10 out of scope and 868 pending**. Approved comprises 362 preserved Physical
Geography decisions and 279 fresh original-record decisions. The additional
verified History import gives 642 approved placement records in the combined
ledger. Eight of the 58 source-bounded existing-record batches are complete;
CSE 2021 is next.

The working syllabus now has **9 subjects, 50 sections, 169 chapters and 929
subparts**. The new Animal Biology chapter separates feeding, reproduction,
behaviour and diversity from Human Physiology. Added explicit concept leaves
include plant diseases/propagation, mining regulation, historical/regional
geography, construction materials, externalities/public goods, climate economics,
carbon capture/storage and climate engineering. Current Affairs still has only
the agreed seven sections and no miscellaneous bucket.

Examples of reviewed overlap:

- A tidal Indian coastal location: Indian Geography plus Physical Geography/Tides.
- Global coral-reef distribution/ecology: Environment plus Oceanography/Coral reefs.
- Bioremediation and engineered microorganisms: Pollution control plus Biotechnology.
- Historical town/state matching: Ancient and Medieval historical geography plus
  present-day regional mapping; no unsupported architectural-style placement.
- Social Cost of Carbon: Economy/Externalities plus Environment/Climate economics.

Time-bound historical rankings and crop/export statistics retain the original
examination-period context. Event-based tags do not generate an event date from
the exam year. The original wording and all answer/content revisions are unchanged.

### Reproduction follow-up is not hidden by placement approval

`cse-2017-gs-i-98` currently says “logically closest”. Its island-location
classification is clear, but the exact stem needs comparison with the original
paper. That concern is now a structured pending editorial follow-up in the
placement ledger, current cohort register and progress report. No wording was
silently rewritten and no fresh reproduction verification is claimed.

### Current app pool and checks

The eligible GS pool remains **1,488 unique MCQs: 1,328 mapped and 160 unmapped**.
Source-copy duplicates and answer-quarantined questions retain their existing
exclusions. Physical Geography's original 11 chapters and 92 subparts remain
unchanged; genuinely relevant additional questions can now appear there without
being counted twice across the library or a mixed selection.

Production build and full automated suite: **104/104 passed**. Physical Geography
totals are checked against the approved eligible ID set rather than an obsolete
fixed number. History overlap is checked at the actual shared Mauryan scope,
not by assuming the whole Ancient India section still contains only one question.
All **31/31 browser scenarios passed in one full run**, including exact saved
drafts, source filtering, timed attempts, grading exclusions, original figures,
mobile layouts and PDF export. The latest two-page History PDF was rendered with
Poppler and both pages visually inspected: one intact question, one answer-key
entry, readable syllabus/count table and no clipping or duplicated occurrence.

The raw bank still matches the frozen hash. No production import, push or
deployment has been performed. Full chapter-specific boundary/example review,
the remaining 868 record decisions, all-paper missing imports and final database
release parity remain unfinished.

## Milestone 7 — CSE 2021–2024 and first 2025 review batch

The original-cohort register now records **791 approved placements, 10 GS-scope
exclusions and 718 pending decisions**, summing to 1,519. Of the approved
placements, 362 preserve the earlier Physical Geography review and 429 are fresh
classification decisions. The separate newly imported CSE 2013 Q4 is not added
to that original-cohort denominator.

CSE 2021–2024 existing-record cohorts have complete classification decisions.
The first eight CSE 2025 decisions cover critical-mineral governance, circular
economy, ancient territorial/rivers geography, the Andes, equatorial water
bodies, turmeric statistics, livestock development and cement emissions.
Several genuinely tested concepts receive additional placements. Classification
does not change any answer, source text, content revision or answer hold.

The active working registry contains nine subjects, 50 sections, 170 chapters
and 948 subparts. Its descriptions and examples still require complete editorial
review. The built local GS inventory has **1,488 eligible unique MCQs: 1,354
mapped and 134 unmapped**. These runtime figures are not a claim that all mapped
records received fresh classification review: legacy compatibility mappings
remain while the original-cohort review is in progress.

Four explicit reproduction follow-ups remain open: CSE 2017 Q98 wording,
CSE 2024 Q13 rainfall-range punctuation, and inline duplicated choices in CSE
2024 Q5 and Q6. No unreviewed source restoration was applied. Withdrawn CSE
2024 Q20 and duplicate aliases retain their independent scoring exclusions.

No new paper occurrence has been imported in this milestone. The source
register still has three explicit reviewed occurrence decisions out of 9,400
slots across 74 PDFs; 7,210 secondary transcript leads remain held. Bulk missing
imports and source-by-source accounting are therefore not complete.

The historical bank hash and generated syllabus/placement freshness checks
pass. Production build succeeds and **105/105 automated tests pass**,
including new cohort/hold regression coverage; browser checks have not been rerun for this
data-only milestone. Nothing has been pushed, deployed or imported into a
production database.

## Milestone 8 — CSE 2025 existing-record classification completed

Both 2025 editorial batches now cover all existing CSE 2025 records: eight
decisions in batch 1 and 32 in batch 2. The original cohort has **823 approved
placements, 10 GS-scope exclusions and 686 pending decisions**. The approved
total includes 362 preserved Physical Geography decisions and 461 fresh
classification decisions; the one separately imported question is not part of
the original 1,519 denominator. CSE 2026 is next in the fixed review queue.

Six precise subparts were added: Protection from exploitation, Electrochemistry,
Surface chemistry and adsorption, Plant morphology, Euro-Atlantic alliances,
and Regions and countries. The registry now has 954 subparts; its nine subjects,
50 sections and 170 chapters are unchanged. Current Affairs still has exactly
seven sections, without a miscellaneous bucket.

Examples of material overlap include activated-carbon treatment with adsorption
and circular recovery; Fifth Schedule administration with tribal safeguards;
and rare-earth display materials with optics. Plastic composition alone is not
placed under waste pollution, nor are fruit introductions automatically placed
under contemporary crop geography. The Kavach question's negative instruction
and the BRICS question's proposed theme remain unchanged.

The Araghatta placement uses historical agricultural technology with irrigation
and early-medieval agrarian overlap. The publisher-indexed IGNOU passage records
early and early-medieval attestations and different stages of the device; it
does not justify assigning a single invention date. Evidence is recorded in the
decision row and is not presented as an original-exam or key review:
https://egyankosh.ac.in/bitstream/123456789/67196/1/Block-3.pdf

The built local eligible inventory is **1,488 unique questions: 1,358 mapped and
130 unmapped**. Runtime mapped counts are not interchangeable with fresh-review
counts. Source occurrence coverage, missing imports and the four reproduction
follow-ups remain at milestone 7's incomplete state. Duplicate aliases remain
held; no answer, raw-bank content or historical attempt was rewritten.

Syllabus and placement freshness checks and the frozen historical-bank hash
pass. Production build succeeds and the full automated suite passes **105/105**.
No browser run, production database import, GitHub push or deployment is claimed
for this data-only milestone.

## Milestone 9 — existing CSE classification completed through 2026

Thirty remaining CSE 2026 records have full-stem/options classification
decisions, including the already identified duplicate alias for original Q38.
Every existing record whose corrected exam metadata is CSE now has an approved
placement. This is **not** complete CSE paper coverage, fresh official-key
verification of the whole collection, or completion of missing-question imports.

The original-cohort totals are **853 approved, 10 out of GS scope and 656
pending**, exactly 1,519. Approved decisions comprise 362 preserved Physical
Geography decisions and 491 fresh classifications. The separate new import is
outside that denominator. The fixed queue next identifies CAPF 2017 Paper I;
its 29 pending full stems/options have been read but no CAPF approvals were
applied in this milestone.

Reconciled source-exam breakdown of the original cohort:

| Corrected exam | Approved placement | Out of GS scope | Pending |
| --- | ---: | ---: | ---: |
| CSE | 539 | 0 | 0 |
| CAPF | 70 | 0 | 185 |
| CDS | 55 | 0 | 129 |
| NDA | 189 | 10 | 342 |

Approved includes preserved earlier decisions; it does not mean 853 fresh
original-paper reviews or that every approved record is eligible to score.

Indian Geography now includes Drainage evolution, accommodating historical
river-course and antecedence questions without using a general bucket. The
working registry has nine subjects, 50 sections, 170 chapters and 955 subparts.
The built eligible inventory remains 1,488 unique questions, with 1,358 mapped
and 130 unmapped: moving existing mapped questions into more precise homes need
not increase that count.

Placements distinguish project-location questions from semiconductor physics,
organisation-centre matching from the disciplines in the centre names, and
species behaviour from merely proposed technological explanations. Negative
instructions, relationship alternatives and intentionally false statements are
preserved. No raw-bank wording, answers, provisional decisions or duplicate
holds changed. Four source-reproduction follow-ups and the missing-import/source
coverage debt remain open.

Verification story: syllabus navigation → eligible inventory API → deduplicated
snapshot selection → practice/results and PDF. The inventory uses the shared
catalogue with independent GS/answer gates. Snapshot handling validates exact
saved memberships and rejects held or incomplete pins rather than broadening
old drafts. This milestone checks local-file-backed paths; database-backed
release parity remains unproven. Build passed, **105/105 automated tests** and
**31/31 browser scenarios** passed in one full run. Browser coverage includes
exact drafts, source filters, timed practice, results, held-question exclusions,
original figures, PDF export, mobile layouts and shared-placement deduplication.
Only non-failing reduced-motion and terminal colour warnings appeared in the
captured browser-server output; this is not an exhaustive console audit.

The latest two-page A4 History-overlap PDF was rendered with Poppler and both
pages visually inspected: one complete question, answer C once, aligned compact
syllabus/exam table and no clipping or repeated occurrence. This is a specific
export check, not a whole-corpus figure/reproduction review. Remote browser URL
and remote authentication token overrides were absent, so the run used the
configured localhost server, not a deployment. No secrets were read or changed.

No push, deployment or production
database import was performed.

## Milestone 10 — CAPF 2017–2018 existing-record classification

The 29 pending 2017 and 25 pending 2018 Paper I records now have complete-stem
and options classification decisions. This includes corrected CAPF identities
whose published IDs still begin with CDS. Those IDs and duplicate exclusions
are preserved. The map attached to CAPF 2017 Q120 was visually inspected for
its four numbered national-park locations; its original extraction/provenance
was not changed.

Original-cohort reconciliation: **907 approved placements, 10 out of GS scope,
602 pending**, exactly 1,519. Approved comprises 362 preserved Physical review
decisions and 545 fresh classifications. The separate new import remains
outside the original denominator. Next fixed batch: CAPF 2019 Paper I.

Six new precise subparts accommodate actual concepts: Ecological study
approaches, Aquatic life-form groups, Mediterranean shrublands, Biomagnification,
Special state provisions and Household energy access. The working registry now
has nine subjects, 50 sections, 170 chapters and 961 subparts. The original
Physical Geography structure and seven Current Affairs sections are unchanged.

The built local eligible pool has 1,488 unique MCQs, **1,384 mapped and 104
unmapped**. These are compatibility/runtime counts, not counts of fresh source
reviews. Shared Majjhima Nikaya language knowledge appears under Ancient
Buddhism and Art & Culture literature without a duplicated record. General
aquatic life groups are not forced into either exclusively marine or freshwater
habitats; low-fluoride intake is not confused with excess-fluoride pollution.

CAPF 2018 Q52's new source/options concern was investigated, not silently
corrected. The Series A cover and printed page 19 were visually compared with
the complete stored stem/options. They agree. The matching mirrored official
Series A key, page 1, visibly accepts A (1 and 2), as the bank already does.
Both PDF hashes and page references are recorded in the editorial evidence row.
Conservation International's primary criteria page raises a conceptual
disagreement, not an import defect:
https://www.conservation.org/learning/biodiversity-hotspots.
Per the agreed policy, the official examination answer is retained and the
disagreement documented. This follow-up is closed as
`closed-official-answer-retained`; the earlier four reproduction follow-ups
remain pending. No answer revision or new eligibility disposition was applied.
This one-question evidence check is not full-paper source coverage.

All CSE and these two CAPF existing-record cohorts have classification decisions,
not full missing-paper coverage. The source coverage/import debt is unchanged:
three reviewed occurrence decisions out of 9,400 slots, with 7,210 secondary
leads held. No source question, answer revision, saved attempt or raw-bank hash
was changed.

Verification story: browsing → unique catalogue membership → explicit selection
and source filtering → snapshot/practice/PDF. Production build and deterministic
freshness checks pass. One obsolete fixed test expectation for Other Geography
was removed when a reviewed question moved into a precise World Geography home;
the independent unique-leaf union assertions for every parent/exam remain.
The History browser scenario now adds the exact Rock-cut architecture leaf,
rather than assuming Art & Culture will always contain only one MCQ.
After correcting that stale fixture and a new test's slug assumption, the full
automated suite passed **106/106**. The subsequent evidence-only Q52 closure
passed its focused CAPF regression. All **15/15 targeted browser scenarios**
passed: saved exact memberships, browsing/adding/folding separation, source
filters, source inheritance, reload, mobile panels, nine subjects, seven Current
Affairs sections and History overlap through timed practice/results/PDF.
The other 16 browser scenarios were not rerun in this milestone. No edited
application components or new database-backed paths were introduced.
No push, deployment or production database import is included.

## Milestone 11 — CAPF 2019–2021 existing-record classification

Fifty further records received full stored-stem/options placement decisions:
16 from 2019, 18 from 2020 and 16 from 2021. Their source papers remain separate
editorial batches. The original register reconciles to **957 approved placements,
10 GS-scope exclusions and 552 pending**, summing to 1,519. Approved includes
362 preserved Physical decisions and 595 fresh classifications, not 957 new
original-paper reviews. The one new imported CSE record is outside that total.

Every existing CSE record and CAPF 2017–2021 record now has a classification
decision. Pending original-cohort records remain CAPF 81, CDS 129 and NDA 342.
The next fixed batch is CAPF 2022 Paper I. Missing original-paper MCQs, full
paper occurrence accounting and the complete chapter-boundary/example review
remain unfinished.

Language Geography is a new Human & Economic Geography chapter with Language
families, Linguistic regions, Language and migration, and Multilingual societies.
This avoids forcing language-family questions into literary works or recognised
constitutional languages. Additional precise leaves are Ozone protection
agreements, Metallurgy and ores, Ecotones and edge effects, and Food crises and
famine. The working registry has nine subjects, 50 sections, 171 chapters and
969 subparts. Physical Geography's original 11 chapters and 92 subparts remain
unchanged, as do the seven Current Affairs sections.

The original local assets for CAPF 2019 Q113 and Q120 were visually inspected
with their complete matching lists and code choices: numbered peninsular rivers
and numbered Sikkim boundary positions. Figure provenance and answer revisions
were not changed. Merapi's January 2021 eruption and Amphan's May 2020 event
dates were recorded only because those dates occur in the stems; no date was
invented for Tauktae or the 2019 forest-cover ranking.

Close-concept distinctions include smog ozone versus stratospheric shielding,
Cartagena biosafety versus climate agreements, ecotone versus succession,
famine versus general malnutrition, and iron-ore occurrence versus mining law.
Intentionally false statements, negative instructions, old regional names and
all stored answers are preserved. Classification does not clear any answer hold.

The rebuilt eligible pool is **1,488 unique MCQs: 1,395 mapped, 93 unmapped**.
Runtime mapped is not equivalent to freshly reviewed classification: historical
compatibility mappings still exist. The source-coverage register still formally
accounts for three occurrences out of 9,400; the documented CAPF Q52 evidence
check is not yet a full paper-register coverage decision. No missing-question
import or production database mutation occurred in this milestone.

Production build, syllabus/placement freshness and raw-bank-hash checks pass.
New regressions cover all three complete cohorts, map retention, precise leaves,
material cross-placements and evidence-based event dates. The full automated
suite passed **107/107**. Browser tests were not rerun in this
data-only milestone; milestone 10's 15-scenario run is not claimed as a new run.
Nothing was pushed or deployed.

## Milestone 12 — existing CAPF classification completed through 2026

Five separate source-paper batches added 81 decisions: CAPF 2022 (16), 2023
(20), 2024 (13), 2025 (10), and 2026 (22). All 255 existing CAPF records and
all 539 existing CSE records now have approved classification placements.
This does not mean all questions in those original papers have been imported
or that every record received a fresh source/reproduction/key review.

The original-cohort reconciliation is **1,038 approved placements, 10 out of GS
scope and 471 pending**, exactly 1,519. Approved includes 362 preserved Physical
decisions and 676 fresh classifications. Remaining review is CDS 129 and NDA
342; next fixed batch is CDS 2014 session 1. The separately imported CSE 2013
Q4 is not added to the original-cohort denominator.

Four precise subparts were added: Colonial Administration → Census and surveys;
Indian Geography Soils → Soil formation processes; Human & Economic Geography
Settlements → Urban climate; and Environmental Pollution → Eutrophication.
The working registry has nine subjects, 50 sections, 171 chapters and 973
subparts. The preserved 11/92 Physical structure and seven Current Affairs
sections are unchanged. Full chapter-specific boundaries/examples remain a
separate unfinished editorial requirement.

The built local pool is **1,488 unique eligible questions: 1,407 mapped and 81
unmapped**. Runtime compatibility mappings are not fresh-review totals. No raw
question text, answer, answer disposition, content revision, historical ID,
figure or saved attempt was changed. New classifications do not clear existing
withdrawn, duplicate, provisional or quarantined decisions.

CAPF 2023 Q44 has a new pending mathematical-notation follow-up: the stored
distance is `xx km` after radius `x km`. Its geographic concept can be placed,
but no mathematical expression or answer may be guessed; the original page is
required before a content repair. There are now five pending reproduction
follow-ups, alongside the separately closed CAPF 2018 Q52 official-key
disagreement. No question with an open reproduction issue is claimed as freshly
source-verified.

Verification exposed a test-fixture boundary, not an application compatibility
change: V3 requests were being constructed from newly expanded V4 source masks.
The server correctly rejected an exam source absent from that historical leaf.
V3 tests now use the frozen pre-expansion inventory, retaining their original
28-question scope. Current V4 counts and browser assertions independently use
unique current question-ID unions and selected exam masks. New questions are
not silently added to historical selections; source-zero and reload behaviour
remain explicitly checked.

Production build and the complete automated suite pass **108/108**. Generated
syllabus, placement ledger, approved import and source-queue freshness checks
pass, as does the frozen historical-bank hash. All **15/15 targeted browser
scenarios passed** in one corrected full run, including current counts, exact
drafts, source-zero states, reload, mobile panels, History overlap and PDF
creation. The other 16 browser scenarios were not rerun. This milestone uses local-file-backed
catalogue paths, not a production or database-backed release-parity assertion.
Source accounting/missing imports remain unfinished: 74 PDFs, 9,400 slots,
three formal reviewed occurrence decisions and 7,210 held secondary leads.
No push, production import or deployment was performed.

## Milestone 13 — CDS 2014–2015, both sessions

Four source-identity batches added 66 classification decisions: 2014 session 1
(30), 2014 session 2 (10), 2015 session 1 (14), and 2015 session 2 (12). All
existing records in those cohorts are classified. The historical ID
`cds-2015-2-112` remains unchanged, while its already-corrected session-1 source
identity determines its editorial batch. No source identity was guessed from an
ID or filename.

Original-cohort totals: **1,104 approved placements, 10 out of GS scope and 405
pending**, exactly 1,519. Approved comprises 362 preserved Physical Geography
decisions and 742 fresh classifications. The separate new import is not in that
denominator. The remaining original review is CDS 63 and NDA 342; next fixed
batch is CDS 2016 session 1. CSE and CAPF existing-record classification remains
complete, not full source-paper coverage or fresh whole-bank key verification.

Polity now has Political Concepts, with Political theory, State and sovereignty,
Forms of government, Democracy and representation, Liberty equality and justice,
Rule of law, and Separation of powers. Indian Geography has Natural Hazards and
Disaster Risk, with Floods and river hazards, Drought, Cyclone risk, Landslides,
Earthquake risk, Dam safety, and Risk reduction and preparedness. History adds
Provincial autonomy and ministries under Constitutional Developments. These
distinguish discipline concepts and hazard risk from adjacent constitutional
procedures, climate processes or dated news events.

The working registry now has nine subjects, 50 sections, 173 chapters and 988
subparts. Its complete chapter-specific boundaries/examples still need editorial
completion; the seven Current Affairs sections and preserved Physical Geography
11/92 structure are unchanged. Relevant cross-placements include Cabinet
Mission/Constituent Assembly, parliamentary financial control/CAG, SC/ST welfare
oversight, and constitutional amendments/judicial review. Shared questions remain
one canonical record and counts use unique IDs.

The eligible local pool is **1,488 unique MCQs: 1,432 mapped and 56 unmapped**.
Runtime compatibility counts are not fresh-review totals. All raw questions,
answers, answer holds, revisions and historical snapshots are preserved. The
March 2013 BRICS event date comes from the actual stem, not the 2015 exam year;
the Chiefs of Staff question remains historical rather than being updated to a
later command arrangement.

A sixth pending reproduction follow-up is explicit: CDS 2014 session 1 Q72
stores Chandra in the Dul Hasti matching list. An original-page/key comparison
must establish whether this is an import or printed-source issue before any
repair. The classification rationale does not claim that the entry has already
been verified on the original page. No forced answer or source edit was applied.
The separate CAPF 2018 Q52 disagreement remains closed with official answer
retained; the other five pending checks are still pending.

Production build and **109/109 automated tests** pass. After the evidence-only
river-name follow-up was recorded, its focused CDS regression also passed.
No browser tests were rerun for this data-only milestone. Source coverage,
missing-question imports, complete reproduction review and database-backed
release parity remain unfinished. The paper register still has three formal
reviewed occurrence decisions out of 9,400 slots and 7,210 held secondary leads.
No GitHub push, production database import or deployment was performed.

## Milestone 14 — existing CDS classification completed

The last five CDS paper-session batches received 63 decisions: 2016 session 1
(13), 2016 session 2 (15), 2017 session 1 (12), 2017 session 2 (19), and 2018
session 1 (4). All **184 existing CDS records** now have approved placements,
joining the 539 existing CSE and 255 existing CAPF records. This is a completion
of existing-record classification, not missing-source imports or a claim of
fresh original-paper verification for every MCQ.

The original 1,519 records reconcile to **1,167 approved placements, 10 out of
GS scope and 342 pending**, all remaining in NDA. Approved includes 362
preserved Physical Geography decisions and 805 fresh classifications. The
separate new CSE import is not part of that denominator. Next fixed batch is
NDA 2014 session I.

World Geography adds Fishing grounds so a fishing-bank location is not forced
into agricultural crop regions. The working registry now contains nine
subjects, 50 sections, 173 chapters and 989 subparts. No original Physical
chapter/subpart or Current Affairs section changed. Complete chapter-specific
boundaries/examples remain unfinished.

These decisions distinguish research-centre location from scientific mechanisms,
Antarctic bases from space missions, vegetation distribution from formal threat
status, demographic totals from population proportions, and regional crop/rail
statistics from timeless facts. Historical highway numbering, city/territory
names, constitutional statements and institutional arrangements are preserved.
No event dates were created from answer options or examination years.

The eligible local inventory has **1,488 unique MCQs: 1,438 mapped and 50
unmapped**. Runtime compatibility mappings are not counts of fresh editorial
reviews. All bank text, answers, verification holds, revisions and historical
attempts remain unchanged. The six pending reproduction follow-ups are still
explicit; no question with one is described as freshly source-verified.

Verification story: browse current syllabus → eligible catalogue API → exact
deduplicated selection → snapshot → practice/results/PDF. The shared snapshot
handler still validates frozen IDs and independent eligibility, rather than
expanding historical selections from new placements. Production build,
freshness checks and **110/110 automated tests** pass. A browser fixture still
expected the old 28-question chapter count; it now captures the current chapter
count before reload, preserving the actual persistence assertion. After that
fixture correction, **31/31 browser scenarios passed in one full run**, covering
exact drafts, source filtering, timed attempts, grading exclusions, recovery,
original figures, mobile layouts and PDF creation. No application compatibility
logic was loosened to make the fixture pass.
The exercised paths are local-file-backed; database-backed release parity is
not established. No push, production import or deployment was performed.

Full paper coverage, remaining NDA classification, reproduction follow-ups,
missing-question imports and final taxonomy/editorial review remain required.
The source register still formally accounts for three occurrences out of 9,400
slots across 74 PDFs, with 7,210 secondary leads held rather than automatically
approved.

## Milestone 15 — NDA 2014–2015, both sessions

Four source-paper batches add 51 placement decisions: NDA 2014 I (16), 2014 II
(6), 2015 I (13), and 2015 II (16). Corrected source metadata, not a CDS-shaped
historical ID, determines each batch. The batch validator now explicitly accepts
NDA session labels and retains support for the recorded combined 2020 I/II
paper without splitting its identity at the slash.

The original cohort reconciles to **1,218 approved placements, 10 GS-scope
exclusions and 291 pending**, exactly 1,519. Approved includes 362 preserved
Physical Geography decisions and 856 fresh classifications. The one new import
is separate. CSE, CAPF and CDS existing-record classification remains complete;
all remaining classification decisions are NDA, starting with 2016 session I.

Human & Economic Geography gains Cultural Geography: Cultural regions,
Indigenous peoples, Pastoral nomadism, Religious landscapes and Cultural
diffusion. This distinguishes Sami/Lapland and pastoral communities from Indian
Scheduled Tribe welfare and from History's Art & Culture. New precise leaves
also cover biome classification/distribution, biological pollution monitoring,
and industrial development chronology. A refinery-establishment sequence is
not mistaken for west-east spatial ordering.

The working registry has nine subjects, 50 sections, 174 chapters and 997
subparts. The Physical 11/92 structure and seven Current Affairs sections remain
unchanged. Chapter-specific editorial boundaries/examples still require full
completion before final taxonomy acceptance.

NDA 2015 II Q77 was freshly classified using its already-repaired full matching
question. Its official-final status, answer A, answer revision 3 and content
revision 1 are unchanged. Old materially defective snapshots remain subject to
the existing exclusion safeguards; classification does not make them gradeable
against a repaired question they did not contain. No raw question, answer,
revision, original figure or saved attempt changed in this milestone.

The built eligible inventory has **1,488 unique questions: 1,445 mapped and 43
unmapped**. Runtime compatibility mapping is not equivalent to fresh editorial
approval. Six pending reproduction follow-ups and the separately documented
official-key disagreement retain their states. Source coverage, new imports,
full reproduction checks and database-backed release parity remain unfinished.

Build, frozen-bank hash and generated syllabus/placement/import/source-queue
freshness checks pass. The full automated suite passed **111/111**, including
new NDA session, cultural/ecological placement, stable-ID and repaired-snapshot
regressions. Browser tests were not rerun in this data-only milestone; the prior
31-scenario run is not represented as a new run. The source register still
formally covers three occurrences out of 9,400 slots across 74 PDFs, and 7,210
secondary leads remain held. Nothing was pushed, imported into production or
deployed.

## Milestone 16 — NDA 2016–2017 and an additional duplicate safeguard

Reviewed complete stored stems and choices for four NDA cohorts: 2016 I (19),
2016 II (17), 2017 I (19), and 2017 II (16). The 71 placement decisions bring
the original 1,519-record register to **1,289 approved, 10 out of scope and 220
pending**. Approved comprises 362 preserved Physical Geography decisions and
927 fresh classifications. The separately approved new import is not included
in this denominator. The next existing-record cohort is NDA 2018 I.

Precise additions include Cartography and Geospatial Tools, mapping institutions,
urbanisation patterns, and industrial zones/SEZs. The working registry contains
nine subjects, 50 sections, 175 chapters and 1,005 subparts. Physical Geography
remains 11 chapters/92 subparts; Current Affairs retains seven broad sections.
Full chapter-specific editorial specifications are still unfinished.

Full-record comparison exposed a second active occurrence of NDA 2016 I Q138.
The already source-reviewed canonical ID is `cds-2016-2016-1-138`; the extra
`nda-2016-i-138` is now a reviewed duplicate alias. Both historical IDs and their
raw records remain intact. Approval records preserve expected raw-record hashes,
source identity, rationale, second-pass review and the existing verified paper/key
hashes. Actual local PDF hashes were rechecked; this was not a new visual key
review. The original frozen 204-record answer audit is unchanged.

A deterministic alias-policy builder rejects unexpected record changes before
build. The shared eligibility and grading policy excludes the alias from new
tests and from historical score denominators without changing submitted answers.
It does not silently substitute the canonical ID into an old exact selection.
The local eligible pool is **1,487 unique questions: 1,450 mapped and 37 unmapped**.
Database service gates use the shared policy by inspection; live database parity
has not been claimed or run.

The full automated suite passed **114/114**. Generated syllabus, alias, import and
source-queue freshness checks and `git diff --check` pass. Browser verification
passed **31/31** scenarios, including saved membership, source filtering, overlapping
placements, online setup, historical exclusions (now including the new alias),
PDF key rendering, original map/table rendering and mobile flows. Export generation
and DOM assertions passed; this is not a fresh visual audit of every PDF page.
Six reproduction follow-ups remain pending.
Only three source occurrences are formally reviewed against 9,400 slots in 74
PDFs; 7,210 secondary leads remain held. Missing imports and full-corpus source
reconstruction remain incomplete. No GitHub push, deployment or production
database import was performed.

## Milestone 17 — NDA 2018 existing-record placement review

Read the complete stored stems and four choices for the 29 remaining NDA 2018
records, then separately checked primary ownership and each additional home.
Session I contributes 15 and session II 14 approved decisions. Four legacy
CDS-shaped IDs retain their published identities while their corrected NDA source
metadata determines the batches. The original cohort reconciles to **1,318
approved, 10 out of scope and 191 pending**, exactly 1,519. Approved includes
362 preserved Physical reviews and 956 fresh classifications. The new CSE import
is separate. NDA 2019 I is next; 44 of 58 fixed existing-record batches are done.

Added the bounded Theosophical Movement leaf to Modern India's Social and
Religious Reform chapter. A leadership question now has its actual concept home,
not an inferred Home Rule placement. The registry is nine subjects, 50 sections,
175 chapters and 1,006 subparts; Physical Geography remains 11/92.

Other decisions distinguish marine productivity from general greenhouse science,
port settings from generic landforms, tea-growing conditions from agricultural
policy, and infrastructure project identity from static road geography. Sentosa's
incidental news reference does not automatically make its static island-country
question Event-based. Census 2011 comparisons and source-period project wording
are retained rather than modernised. No original question, answer, content/key
revision, figure or saved attempt was edited. Classification is not a claim of
new source reproduction or answer verification.

The built local catalogue has **1,487 eligible unique MCQs, 1,454 mapped and 33
unmapped**. Runtime mapping is not equivalent to editorial review completion.
Syllabus and placement freshness checks, frozen bank guards and diff whitespace
checks pass. A new regression covers all 29 decisions, the reform leaf, meaningful
overlap, Static/Event-based distinctions and unchanged verification eligibility.
The full automated suite passed **115/115** after correcting a new test's mistaken
expectation that a previously excluded English sentence-ordering record should
be a GS approval. Its exclusion remains unchanged. Browser tests were not repeated
for this data-only milestone; Milestone 16's 31-case run remains the latest.
The six reproduction follow-ups, detailed syllabus editorial specifications,
missing-question imports and database release parity remain unfinished. No push,
deployment or production import was performed.

## Milestone 18 — NDA 2019 existing-record placement review

Reviewed full stored stems and all options for the 24 pending NDA 2019 records:
14 in session I and 10 in session II. A separate placement pass checked concept
ownership, incidental references, additional homes and historical wording.
The original 1,519 records now reconcile to **1,342 approved placements, 10
out-of-scope decisions and 167 pending**. Approved includes 362 preserved
Physical decisions and 980 fresh classifications. The separately imported CSE
record is outside this denominator. Forty-six of 58 existing-record batches are
complete; the next is the combined NDA 2020 I/II paper, not two fabricated sessions.

Added precise rights-holder availability and social-justice directive leaves:
Article 19 citizen eligibility is not merely citizenship acquisition, and Article
46 beneficiaries are not the philosophical classification of Directive Principles.
The working syllabus contains nine subjects, 50 sections, 175 chapters and 1,008
subparts; the preserved Physical Geography 11/92 structure is unchanged.

The Munda question belongs to language families, not tribal welfare. Suez Canal
claims belong to strategic waterways; the supplied incorrect lock claim is not
silently repaired. India-specific Ramsar totals and proved coal-reserve rankings
retain their historical alternatives and Event-based tags without fabricated
reference dates. Loktak and the Equator/island question receive justified shared
homes. The National Water Academy question tests its location, not a curriculum
or an unasked governance mandate. No answer, raw record, figure, key/content
revision or saved attempt changed. Classification approval does not upgrade
answer or reproduction verification.

The built eligible pool remains **1,487 unique questions**, with 1,456 mapped and
31 unmapped in the current runtime. Runtime compatibility mapping is distinct
from fresh placement review. Generated syllabus, approved-placement/import and
source-queue checks, frozen source hashes and whitespace checks pass. A cohort
regression covers precise ownership, shared island placement, historical tags and
unchanged eligibility. The full automated suite passed **116/116**; browser
verification was not rerun for this data-only milestone.

Source-paper reconstruction/import accounting, the six reproduction follow-ups,
chapter-specific detailed editorial specifications and database-backed parity
remain incomplete. Three source occurrences are formally accounted for out of
9,400 slots in 74 PDFs; the 7,210 secondary leads are not approved imports. No
push, deployment or production database import was performed.

## Milestone 19 — Combined NDA 2020 existing-record placement review

Reviewed complete stored stems and all four options for 26 pending records from
the single combined NDA 2020 I/II paper. The original cohort now reconciles to
**1,368 approved, 10 out of scope and 141 pending**, exactly 1,519. Approved
includes 362 preserved Physical decisions and 1,006 fresh classifications. The
one new CSE import remains separate. Forty-seven of 58 existing-record batches
are complete; NDA 2021 I is next. Combined session identity and published IDs
are unchanged.

The biosphere-reserve pair receives identical primary/additional placements.
The previously reconstructed legacy ID `cds-2020-2020-1-and-2-3` remains a
duplicate of canonical `nda-2020-i-ii-119`, with its existing material-content
revision and historical exclusion intact. This classification adds no eligibility
or answer approval. The previous source reconstruction evidence is retained;
no new original-page or key-cell visual review is claimed here.

Added a precise United Nations Charter and Founding leaf rather than forcing
the founding-conference question under UN organs. The working registry has nine
subjects, 50 sections, 175 chapters and 1,009 subparts. Physical Geography stays
11 chapters/92 subparts. Other reviewed homes distinguish groundwater depletion,
dryland farming, drought-area irrigation thresholds, crop arrangements, language
families, land-use categories, project-river identities and sacred-grove community
conservation. Historical census alternatives, biosphere counts and source-period
administrative/geographic descriptions are preserved. No raw records, keys,
figures, revisions or saved attempts changed.

The built local eligible pool remains **1,487 unique MCQs: 1,458 mapped and 29
unmapped**. Runtime compatibility mapping does not imply completed editorial
classification. Generated syllabus/placement/import/source checks, source-hash
guards and diff whitespace checks pass. A new regression covers the full combined
cohort, preserved duplicate exclusion, shared homes and unchanged eligibility.
The full automated suite passed **117/117**. Browser checks were not repeated
for this data-only milestone.

Full source reconstruction, missing imports, detailed syllabus editorial
specifications, six reproduction follow-ups and database-backed release parity
remain incomplete. Paper coverage remains three formally reviewed occurrences
out of 9,400 slots in 74 PDFs; 7,210 secondary leads remain held. Nothing was
pushed, deployed or imported into production.

## Milestone 20 — NDA 2021 existing-record placement review

Reviewed complete stored stems and options for the remaining 27 NDA 2021
records, followed by a separate placement check: session I has 14 and session II
13 decisions. The original cohort now reconciles to **1,395 approved placements,
10 out of scope and 114 pending**, exactly 1,519. Approved includes 362 preserved
Physical decisions and 1,033 fresh classifications; the new CSE import is separate.
Forty-nine of 58 batches are complete. NDA 2022 I is next.

The Speaker question gains a precise Presiding Officers leaf rather than a vague
parliamentary-procedures home. The working syllabus contains nine subjects, 50
sections, 175 chapters and 1,010 subparts; Physical Geography remains 11/92.
Foreign elections belong to International Affairs political developments, not
appointments within international organisations. Legion of Merit is placed by
its tested recognition focus. Republic Day tableau recognition belongs to cultural
events without inventing an unmentioned artistic tradition. Crop categories,
reef-organism interactions and project locations receive material shared homes.

All legacy CDS-shaped IDs retain their source-corrected NDA identities without
renaming published IDs. Negative statements, historical port superlatives and
explicit event references remain intact. No raw records, options, figures,
answer/content revisions or saved attempts were changed. The existing NDA 2021 II
Q54 Playa answer correction remains A and independently revisioned. Placement
approval is not a new answer or original-PDF reproduction approval.

The built local pool remains **1,487 eligible unique MCQs: 1,469 mapped and 18
unmapped**. Compatibility mapping does not equate to editorial approval. Syllabus,
placement, import and source-queue freshness checks, frozen-bank guards and diff
whitespace checks pass. A new regression covers both cohorts, precise offices,
current-affairs categories, crop overlap and preservation of the Playa correction.
Build passed and the complete automated suite passed **118/118**. The new test
initially looked for the Playa key revision in the frozen-cohort policy; it was
corrected to assert revision 1 in the independent answer-key revision register.
Browser scenarios were not rerun for this data-only milestone. The progress report was initially requested
while the build was rewriting its assets and failed to import the temporary
manifest; rerunning after build completion succeeded without restarting the build.

Full-paper reconstruction/import accounting, six reproduction follow-ups, detailed
editorial specifications and database-backed release parity remain unfinished.
Only three source occurrences are formally reviewed against 9,400 slots in 74
PDFs; secondary candidates are not approved imports. No push, deployment or
production database import was performed.

## Milestone 21 — NDA 2022 existing-record placement review

Reviewed the full stored stems and four options for 20 pending NDA 2022 records,
then separately checked primary ownership and additional placements: nine session
I and 11 session II. The original 1,519 records reconcile to **1,415 approved,
10 out of scope and 94 pending**. Approved includes 362 preserved Physical
decisions and 1,053 fresh classifications. The new CSE import is separate.
Fifty-one of 58 fixed batches are complete; NDA 2023 I is next.

Added three precise leaves: Groundwater Basins, Eco-sensitive Zones and the
Non-Aligned Movement. An artesian aquifer is not forced into surface Rivers and
Lakes; the NAM founding-leader question is not mistaken for a recent summit.
The examination-period ESZ judicial direction receives Environmental Policy and
static ESZ-regulation homes without updating its wording to later rulings.
The registry contains nine subjects, 50 sections, 175 chapters and 1,013 subparts.
The preserved Physical Geography structure remains 11 chapters and 92 subparts.

Treaty of Deogaon belongs to Anglo-Maratha expansion; GST Council chairmanship
belongs to GST; population-density formulae belong to demographic indicators.
Historical forest-report and transport-share questions retain their original
alternatives, editions and Event-based labels without invented observation dates.
Glacial landforms and Indian regional location receive a material shared home.
No raw question, answer, figure, answer/content revision or saved attempt changed.
Classification does not establish a fresh source-reproduction or key review.

The built eligible pool remains **1,487 unique MCQs**, of which 1,475 are mapped
and 12 unmapped at runtime. Compatibility mapping remains distinct from reviewed
classification. Generated syllabus/placement/import/source checks, frozen-bank
guards and diff whitespace checks pass. The new cohort regression covers all
20 records, aquifer ownership, historical ESZ placement, NAM and unchanged answer
eligibility. Build and all **119/119 automated tests** pass. Browser scenarios were not
rerun for this data-only milestone.

Missing imports, source reconstruction, six reproduction follow-ups, full detailed
editorial specifications and database-backed release parity remain incomplete.
Formal source coverage is still three occurrences out of 9,400 slots in 74 PDFs;
7,210 secondary leads remain held. Nothing was pushed, deployed or imported into
production.

## Milestone 22 — NDA 2023 existing-record placement review

Reviewed full stored questions and all four options for 23 pending NDA 2023
records, then separately checked primary/additional concept ownership: eight in
session I and 15 in session II. The original cohort reconciles to **1,438
approved, 10 out of scope and 71 pending**, exactly 1,519. Approved includes 362
preserved Physical decisions and 1,076 fresh classifications. The separate new
CSE import is outside that denominator. Fifty-three of 58 batches are complete;
NDA 2024 I is next.

Added Anglo-Burmese Wars and Symbols and Regalia as bounded syllabus leaves.
The Yandabo question is not forced into an unrelated colonial campaign. Sengol
symbolism receives an Art & Culture primary home and a Chola-period additional
home; the new Parliament reference does not imply a legislative-procedure task.
The registry has nine subjects, 50 sections, 175 chapters and 1,015 subparts.
Physical Geography remains its original 11 chapters and 92 subparts.

The mixed state-profile question has explicit state-area, festival, GDP and
plateau homes instead of a miscellaneous bucket. The canonical-ID selection
union continues to prevent repeated questions when these locations overlap.
Other decisions distinguish seasonal wind reversal, climate codes, soil-crop
relations, specialised agriculture, industrial locations and waterway geography.
Historical rankings and percentages remain intact without invented data years.

A seventh pending reproduction follow-up is now explicit: NDA 2023 II Q127's
single-negative steel-plant water-location choices require original-page and key
comparison before any repair or answer decision. No factual defect is asserted
as established from classification alone. Its placement is not reproduction or
answer approval. Existing source eligibility is unchanged. No raw record, key,
revision, figure or saved attempt changed.

The built eligible pool remains **1,487 unique MCQs: 1,477 mapped and 10 unmapped**.
Compatibility mapping is not fresh classification approval. Generated syllabus,
placement/import/source freshness, frozen-bank guards and whitespace checks pass.
A new regression covers both cohorts, mixed-subject homes, Chola/culture overlap,
the explicit pending source concern and unchanged answer eligibility. Build and
all **120/120 automated tests** pass. Browser scenarios were not rerun for this data-only change.

Full-paper reconstruction and missing imports, detailed editorial specifications,
the seven reproduction follow-ups and database-backed parity remain unfinished.
Formal paper coverage remains three reviewed occurrences out of 9,400 slots in
74 PDFs; 7,210 secondary leads remain held. No push, deployment or production
database import was performed.

## Milestone 23 — NDA 2024 existing-record placement review

Reviewed complete stored stems and all options for 23 remaining NDA 2024 records,
then checked primary and additional ownership separately: ten in session I and
13 in session II. The original 1,519-record cohort now reconciles to **1,461
approved placements, 10 out of scope and 48 pending**. Approved includes 362
preserved Physical decisions and 1,099 fresh classifications; the new CSE import
is separate. Fifty-five of 58 fixed batches are complete. NDA 2025 I is next.

Wetland City nominations receive Urban Environmental Recognition and Wetland
Agreements homes, not a silently updated accreditation outcome. The simultaneous
elections committee question shares administrative appointment and electoral
reform locations; Article 19(1) is primarily about reasonable restrictions.
River-system, soil/crop, island/rainfall/population and ITCZ/tropical-climate
questions receive justified shared locations. No syllabus leaf was needed: the
working registry remains nine subjects, 50 sections, 175 chapters and 1,015
subparts, including the preserved Physical Geography 11/92 structure.

Four reproduction follow-ups were added without editing source content: three
trailing triple-hyphen option markers (NDA 2024 II Q81, Q107 and Q140), and the
exact wording/options of the laterite nutrient question Q139. There are now 11
pending reproduction follow-ups. A source-check request is not an established
answer defect or new verification approval. Historical descriptions and proposed
false statements remain unchanged. No raw record, key, revision, figure or saved
attempt changed; classification and existing answer eligibility remain separate.

The built eligible pool remains **1,487 unique MCQs: 1,480 mapped and seven
unmapped**. Runtime compatibility mapping does not mean all classifications have
been reviewed. Generated syllabus/placement/import/source checks, frozen-bank
guards and whitespace checks pass. A new cohort regression covers nominations,
electoral reform, rights restrictions, shared physical concepts and unchanged
source markers. Build and all **121/121 automated tests** pass. Browser checks
were not rerun for this data-only milestone.

Complete source-paper reconstruction, missing imports, detailed editorial
specifications, the 11 reproduction follow-ups and database-backed release parity
remain unfinished. Formal coverage remains three occurrences out of 9,400 slots
in 74 PDFs; 7,210 secondary leads are not approved imports. No GitHub push,
deployment or production database import was performed.

## Milestone 24 — NDA 2025 existing-record placement review

Reviewed the complete stored stems and all options for 24 pending NDA 2025
records, then separately checked primary ownership and shared locations: 13 in
session I and 11 in session II. The original 1,519-record register reconciles to
**1,485 approved placements, 10 out of scope and 24 pending**. Approved includes
362 preserved Physical decisions and 1,123 fresh classifications; the new CSE
import is separate. Fifty-seven of 58 fixed batches are complete; the remaining
batch is NDA 2026 I.

Added a Five Year Plans leaf: restored plan-objective matching should not be
forced into planning-institution membership or poverty measurement. The working
registry has nine subjects, 50 sections, 175 chapters and 1,016 subparts. Physical
Geography stays its preserved 11/92. NITI State Support Mission receives programme
and planning-institution homes; summit chronology shares a BRICS location; the
dated 2025 Ramsar additions share recognition and convention homes. Historical
report editions and original alternatives remain unchanged.

All six NDA 2025 I quarantined records retain their existing answer exclusions.
Five have GS placements; the sixth is an English record and remains out of scope.
In particular, classifying Mahendragiri's location and the steel-plant clue set
does not clear their disputed wording/answer status. Other reasoned and official
verification decisions are unchanged. A new laterite-soil source follow-up for
NDA 2025 II Q126 brings pending reproduction follow-ups to 12. No raw record,
answer, table, figure, revision or saved attempt was changed. This is placement
review, not a fresh original-page or official-key verification exercise.

The built eligible pool remains **1,487 unique MCQs: 1,485 mapped and two unmapped**.
Runtime compatibility mapping is distinct from editorial approval; 24 original
records still require classification. Generated syllabus/placement/import/source
checks, frozen-bank guards and whitespace checks pass. A new regression covers
both cohorts, all six retained quarantines, plan matching, current-affairs homes
and the source follow-up. Build and all **122/122 automated tests** pass after
correcting the new test to retain the sixth quarantined record's English exclusion.
Browser checks were
not rerun for this data-only milestone.

The wider goal remains incomplete: original-PDF reconstruction and missing import
accounting, 12 reproduction follow-ups, detailed editorial specifications and
database-backed release parity remain. Formal coverage is still three reviewed
source occurrences out of 9,400 slots in 74 PDFs; the 7,210 secondary leads are
not approved imports. No push, deployment or production database import occurred.

## Milestone 25 — Original-cohort placement decisions complete

Read the complete stored stems and all choices for the final 24 pending NDA
2026 I records, then separately checked concept ownership and additional homes.
All 58 fixed batches are now accounted for. The original 1,519-record cohort
reconciles to **1,509 approved placements, ten GS-scope exclusions and zero pending
placement decisions**. Approved comprises 362 preserved Physical decisions and
1,147 fresh classifications. The separately imported CSE question is outside
this denominator. The combined placement ledger contains 1,520 rows: 1,510
approved and ten out of scope, retaining held historical IDs.

The current register and progress report now distinguish original-cohort
placement completion from the unfinished syllabus editorial, source and import
exercise. This is not an all-questions-verified label or a whole-goal completion
claim. Answer eligibility, raw records, figures, content/key revisions and saved
attempts are unchanged. All existing withdrawals, duplicates and quarantines
retain their independent dispositions.

New decisions cover High Court jurisdictions, ASEAN accession, scheme mandates,
seismic waves, crust structure, volcanism, lithification, inversion, temperate
cyclones, chemical weathering, metamorphic parents, solar-cell materials, local
winds, planetary characteristics and definition-specific urban rankings. Historical
dates and reported facts remain intact. Incidental recent-eruption wording does
not turn a volcano-type question into an invented dated event. PM MITRA's industrial
zone placement is not a claim of legal SEZ status. No syllabus amendments were
needed: nine subjects, 50 sections, 175 chapters and 1,016 subparts remain, with
Physical Geography's 11/92 structure preserved.

The built inventory contains **1,487 eligible unique MCQs, all 1,487 mapped and
zero unmapped**. Parent and exam totals continue to use unique unions, not sums
of overlapping placements. The new original-cohort regression asserts every ID,
all 58 complete batches, preserved source-review debt and precise new locations.
The initial full test run found a stale Planets fixture (10 instead of 11); the
expected count now includes an explicit NDA 2026 Q119 membership assertion.
Build and generated syllabus/placement/reconciliation/import/source freshness
checks, frozen-bank guards and diff whitespace checks pass. The full automated
suite passed **123/123** and the browser suite passed **31/31**. Browser coverage
includes exact saved memberships, cross-subject overlap, source filters, setup,
submission/retry, corrected historical results, excluded records, PDF keys and
map/table rendering, mobile panels and all nine subjects. Generated PDFs and DOM
checks passed; this is not a fresh visual review of every PDF page.

Verification follows local browse → inventory → selection/snapshot → grading →
results/PDF flows. Remote browser URL and remote-token overrides were checked as
absent without exposing values. Environment guidance was used only to check the
test target; no environment file, credentials or deployment configuration changed.
Live database-backed parity and fresh visual inspection of every exported page
are not claimed.

Remaining work is substantial: the 12 pending reproduction follow-ups, detailed
chapter/subpart editorial specifications, complete source-paper accounting and
missing verified imports, plus database-backed release parity. Formal source
coverage is still three occurrences out of 9,400 slots across 74 local PDFs;
7,210 secondary leads remain held. Next work must move to this source/editorial
debt rather than treating placement completion as publication verification.
No GitHub push, deployment or production database import occurred.

## Milestone 26 — CSE 2013 source pages 2 and 4, missing imports

Moved from original-bank placement classification to full-paper reconstruction.
Visually inspected the original Series A cover, full English pages 2 and 4,
the intervening Hindi page, and matching official-final key-mirror page 1.
Source and key PDF hashes were rechecked against the stored evidence. A separate
pass compared full stems, statements and all four choices with the key cells.
Line wraps were normalised; substantive false statements were preserved.

Added three missing local imports: CSE 2013 Q5 (recombinant DNA; key D), Q6
(Yuan Chwang's account; key B), and Q9 (provincial Constituent Assembly membership;
key C). They occupy Genetic Engineering, Foreign Accounts with Harsha overlap,
and Constituent Assembly with independence-history overlap respectively. No
scientific or legal explanation substitutes for the examination key. The old
Q4 import remains byte-for-byte unchanged, with its printed Chandragupta statement
and Art/Ancient overlap. No figure is required by these three complete questions.

Added fresh source-reuse evidence for existing Q3, Q7 and Q8 without reimporting
or rewriting their records. The evidence preserves original identities, raw-record
hashes, source pages, Series A key values B/A/C, no option reordering, reproduction
comparison and a second pass. The source queue validates the PDF and key hashes,
record hashes and answer identities. This evidence does not silently rewrite the
legacy question or broaden saved memberships.

All nine source occurrences Q1–Q9 are now accounted for: four verified local
imports and five verified existing reuses. Q10 onward remain pending. Across the
74 PDFs, explicit source decisions increase from three to nine out of 9,400;
9,391 slots remain pending current source review. The 7,210 secondary leads are
still held, not automatically promoted or counted as verified imports.

The import generator now permits explicitly requested append-only reviewed
additions while rejecting changes/removal of earlier approved imports, reuse
placements or policy decisions. Ordinary runs remain non-overwriting; freshness
checks are deterministic. Page-specific provenance is recorded for page 4 while
the earlier page-2 provenance stays unchanged.

The combined catalogue now has **1,523 historical records and 1,490 eligible unique
MCQs, all mapped**. Original-cohort classification totals remain 1,509 approved,
ten out of scope, zero pending, exactly 1,519. The registry stays nine subjects,
50 sections, 175 chapters and 1,016 leaves; no raw historical bank, key/content
revision, existing figure or saved attempt changed.

New regression coverage checks the three imports in Science, History and Polity,
unique inclusion across overlaps, preserved false source wording, displayed-option
grading D/B/C and exact source occurrence accounting Q1–Q9. An initial test used
the wrong Science subject ID, and an older arbitrary expectation of over 500
empty topics ceased to hold as topics populated. The former now uses the actual
Science ID; the latter now asserts exact equality of every visible leaf path with
the full registry, including all empty topics. All 1,016 leaves remain visible.
Build and the full **124/124 automated tests** pass. Import/source/placement
freshness checks, frozen historical hashes and whitespace checks pass. Browser
tests were not rerun in this milestone; the previous 31-case run is not claimed
as new verification of these imports.

The full goal remains incomplete: the other 9,391 source slots, missing imports,
12 reproduction follow-ups, detailed editorial specifications and database-backed
release parity remain. No push, deployment or production database import occurred.

## Milestone 27 — CSE 2013 original English pages 6 and 8

Visually reviewed both full two-column English pages and corresponding Series A
key cells, then rechecked every stem, statement and option during transcription
and reuse comparison. Original-paper and key PDF hashes still match the stored
evidence. Five missing MCQs were imported locally: Q10 (mammals, key B), Q11
(amendment procedure, D), Q12 (Attorney General participation, C), Q19 (institutional
constitutional status, D), and Q20 (Tebhaga demand, A).

Q12 continues from the bottom-left column to the top-right instruction and options;
the complete four-item list is retained. Q11 preserves Lok Sabha only and all
States as proposed statements, not silent textbook corrections. Q19 retains
the historical Planning Commission reference and shares Planning Institutions
with Interstate Coordination. Q12 shares Attorney General and Parliamentary
Sessions/Procedures; these additional homes do not duplicate its canonical ID.
The other new questions occupy Animal Diversity, Amendment and Basic Structure,
and Peasant Movements. No source figure is required by these complete questions.

Six existing records Q13–Q18 receive fresh source-reuse evidence, not new IDs.
The complete by-product, seasonal-daylength, Narmada, remaining-freshwater,
regional-feature matching and dynamic-change questions were compared with their
displayed options and Series A keys C/D/A/C/A/D. Original record hashes, source
pages, unchanged option order, reproduction comparison and a second pass are
recorded. Existing raw records and grading revisions are unchanged.

Source occurrences Q1–Q20 are now accounted for: **nine verified imports and
eleven verified existing reuses**. Q21 onward remain pending. Across all 74 PDFs,
20 of 9,400 slots now have current reviewed decisions; **9,380 remain pending**.
The 7,210 secondary leads remain held. The append-only import guard preserves
all earlier approvals; deterministic freshness checks reject unexpected changes.

The combined local catalogue has **1,528 historical records and 1,495 eligible
unique MCQs**, all mapped. Original-cohort dispositions stay 1,509 approved,
ten out of scope and zero pending, exactly 1,519. No syllabus changes were needed:
nine subjects, 50 sections, 175 chapters and 1,016 leaves remain. No raw historical
bank, source figure, existing answer/content revision or saved attempt changed.

New API regression verifies all five import IDs, exact cross-column completeness,
preserved false statements, unique selection across overlapping homes and grading
B/D/C/D/A. Source accounting tests now require precisely Q1–Q20 with nine imports
and eleven reuses and explicitly retain Q21 onward as pending. Build and all
**125/125 automated tests** pass. Import/source/placement/register
freshness, PDF/raw-bank hash guards and whitespace checks pass. Browser tests
were not rerun for this data-only milestone; no new PDF-export visual claim is made.

The overall goal remains incomplete: the other 9,380 source slots and missing
verified imports, twelve reproduction follow-ups, complete detailed editorial
specifications and database-backed release parity remain. No GitHub push,
deployment or production database import occurred.

## Milestone 28 — CSE 2013 English pages 10 and 12

Visually reviewed both complete original English pages and corresponding Series A
key cells, then separately rechecked the stems, options and accepted displayed
letters during transcription and reuse comparison. Original-paper, key and raw
historical-bank hashes remain unchanged.

Imported two missing questions locally: Q25 on PESA objectives (key C), and Q27
on aflatoxin-producing organisms (key C). The former has Scheduled Areas as its
primary home and Panchayats as a genuine additional location; the latter asks
microorganism identity, not food-safety legislation or crop geography. Both
negative instruction and original contextual wording are retained. Neither
complete question requires a figure. No earlier import was modified.

Eight existing occurrences receive fresh source-reuse evidence: Q21, Q22, Q23,
Q24, Q26, Q28, Q29 and Q30. Full wording/options and Series A keys D/C/C/D/D/B/B/D
were compared, not just isolated accepted letters. Q21 and Q28 retain their
legacy-prefixed IDs and earlier source corrections. Q26 reuses the canonical
CSE-prefixed record; its existing CDS-prefixed duplicate remains excluded from
new selection and historical scoring. No duplicate occurrence is imported.

Q30's option D is actually printed as nitrous oxide and sulphur dioxide, and
the matching examination key accepts D. The evidence explicitly preserves that
wording and answer without an independent endorsement of scientific terminology
or silently replacing it with nitrogen oxides. Source fidelity and scientific
commentary are separate; no unreviewed factual rewrite was applied.

CSE 2013 Q1–Q30 are now accounted for: **eleven verified local imports and
nineteen verified existing reuses**. Q31 onward remain pending. Across 74 PDFs,
30 of 9,400 source slots have reviewed decisions; **9,370 remain pending**.
The 7,210 secondary leads remain held rather than automatically cleared.

The combined catalogue has **1,530 historical records and 1,497 eligible unique
MCQs, all mapped**. Original-cohort classification remains exactly 1,509 approved,
ten out of scope and zero pending, out of 1,519. The syllabus remains nine
subjects, 50 sections, 175 chapters and 1,016 leaves with Physical 11/92 preserved.
No raw historical record, figure, existing key/content revision or saved attempt
changed.

New API tests cover exact PESA negative wording, the moulds option, C/C grading,
unique inclusion across overlapping local-government homes and exclusion of the
held Forest Rights alias. Source tests require exactly Q1–Q30 with eleven imports
and nineteen reuses and leave later questions pending. Build and all **126/126
automated tests** pass. Import/source/placement/reconciliation freshness,
hash guards and diff whitespace checks pass. Browser scenarios were not rerun
for this data-only milestone and no new export-layout verification is claimed.

Remaining work includes the other 9,370 source slots and missing imports, twelve
reproduction follow-ups, full detailed editorial specifications and database-backed
release parity. No push, deployment or production database import occurred.

## Milestone 29 — CSE 2013 English pages 14 and 16

Visually inspected both complete original pages and matching Series A key cells,
then checked every stem, statement and alternative during a separate transcription
and reuse comparison. The reviewed range is Q31–Q41, including Q41 at the bottom
of page 16. Five missing questions were imported: Q36 (Chaitya/Vihara, key B),
Q37 (Nirvana, A), Q39 (Simon opposition, C), Q40 (Quit India trigger, B), and Q41
(balance-of-payments record, A). No question requires a source figure.

The initial source search output was truncated and obscured existing Q31. The
append-only import guard detected that occurrence and refused an unapproved reuse
overlay before writing additions. The full stored record was then inspected;
Q31 is now verified reuse, not a sixth new import. Earlier imports and existing
reuse overlays remain unchanged.

Six existing records Q31–Q35 and Q38 receive source-reuse evidence with original
record hashes, page, Series A answers A/D/B/C/A/C, no option reordering, complete
reproduction comparison and second pass. Park/river mismatches and proposed
nitrogen-source statements remain assessed alternatives, not silently repaired
facts. Q38 retains its legacy-prefixed ID and verified constitutional wording.

Q36 occupies Rock-cut Architecture and Buddhist Monastic Institutions; Q40 shares
Quit India and Cripps/Cabinet Mission. Unique-ID unions prevent double counting.
Two bounded syllabus gaps were filled: Simon Commission and Nehru Report under
Constitutional Developments, and Accounting Framework under Balance of Payments.
The registry has nine subjects, 50 sections, 175 chapters and 1,018 leaves;
Physical Geography remains its original 11 chapters/92 subparts.

Q41's printed option A says all import and export transactions, and its matching
official examination key accepts A. The source wording is preserved rather than
silently expanded into a different textbook definition; the explanation explicitly
attributes the accepted option to the examination key. This is not a separate
endorsement of that wording as an exhaustive modern accounting definition.

CSE 2013 **Q1–Q41 are accounted for: sixteen verified imports and twenty-five
verified reuses**. Q42 onward remain pending. Across 74 PDFs, 41 of 9,400 slots
have reviewed decisions; **9,359 remain pending**. The 7,210 secondary leads are
still held, not counted as approved imports. The combined catalogue has **1,535
historical records and 1,502 eligible unique MCQs**, all mapped. Original-cohort
decisions remain 1,509 approved, ten out of scope, zero pending, out of 1,519.
No raw historical record, figure, existing key/content revision or saved attempt
changed.

New API regression checks all five imported IDs, Buddhist dual placement,
unique inclusion across overlapping scopes, exact Q41 wording and B/A/C/B/A
grading. Source tests require precisely Q1–Q41 with sixteen imports and twenty-five
reuses. The original Art/Ancient fixture expected a one-question rock-cut leaf;
it now explicitly requires both Q4 and Q36 once, not a repeated Q4. The browser
fixture was updated for the same two-question union. Build and generated
syllabus/import/source/placement freshness and whitespace checks pass. All
**127/127 automated tests and 31/31 browser scenarios** pass. The two-page
two-question rock-cut PDF was rendered and visually inspected: both complete
questions appear once with all options, the compact syllabus/exam summary fits,
and the separate key retains C for Q4 and B for Q36 without clipping. This is a
specific export check, not a whole-corpus visual audit.

Verification traces local browse → inventory → exact selection → timed snapshot
→ results/PDF. Full-paper imports, twelve reproduction follow-ups, detailed
editorial specifications and database-backed release parity remain incomplete.
No push, deployment or production database import occurred.

## Milestone 30 — CSE 2013 English pages 18 and 20

Reviewed both complete original English pages and the Series A key cells for
Q42–Q50, followed by a separate stem/option comparison during import and reuse
review. No content beyond these pages was marked complete. Raw-bank, original
PDF and key hashes remain unchanged.

Imported seven missing questions locally: Q42 (RBI regulatory matters, key D),
Q43 (Bank Rate signal, D), Q44 (deficit financing, A), Q45 (Indus civilisation
characteristics, B), Q46 (tattoo-related disease transmission, B), Q47 (Jain
doctrine, D), and Q50 (minerals/muscle contraction, D). Full statements, negative
or positive instruction and all four choices are preserved. Accepted answers are
explicitly attributed to the matching examination key; the imports do not rewrite
historical banking regulation or substitute medical/scientific explanations for
the printed options. No source figures are required by these questions.

Q45 receives Religion and Society plus Town Planning homes because both are
assessed concepts. Other imports receive precise RBI Functions, Monetary Policy,
Deficits, Disease Transmission and Jain Teachings locations. Added Muscles and
Movement to Human Physiology rather than forcing Q50 into nutrition or circulation.
The working syllabus is nine subjects, 50 sections, 175 chapters and 1,019 leaves;
Physical Geography's 11 chapters and 92 subparts remain unchanged.

Existing Q48 and Q49 receive fresh source-reuse evidence, not duplicate imports.
Their full ecological-niche definition and photochemical-smog alternatives were
visually compared; Series A B/A cells agree. Flattened chemical subscripts are
presentation, not changed chemical tokens. Record hashes, pages, key letters,
option order, reproduction comparison and a second pass are retained.

CSE 2013 **Q1–Q50 are accounted for: 23 verified imports and 27 verified reuses**.
Q51 onward remain pending. Across the 74 PDFs, 50 of 9,400 source slots now have
reviewed decisions; **9,350 remain pending**. The 7,210 secondary leads remain
held. The combined catalogue has **1,542 historical records and 1,509 eligible
unique MCQs**, all mapped. This eligible total happens to equal the separate
original-cohort approved-placement count; they are different populations and
must not be conflated. Original-cohort totals stay 1,509 approved, ten out of
scope, zero pending, exactly 1,519. No raw historical record, figure, existing
answer/content revision or saved attempt changed.

New API regression checks all seven IDs, their exact source options, Q45's
two-home unique inclusion, the new physiology leaf and D/D/A/B/B/D/D grading.
Source tests require exactly Q1–Q50 with 23 imports and 27 reuses and leave Q51
onward pending. Build and all **128/128 automated tests** pass. Generated
syllabus/import/source/placement/reconciliation freshness, hash guards and diff
whitespace checks pass. Browser scenarios were not rerun in this data-only
milestone; the prior 31-case run is not represented as fresh coverage here.

Remaining work includes full-paper source reconstruction and missing imports,
twelve reproduction follow-ups, detailed syllabus editorial specifications and
database-backed release parity. No GitHub push, deployment or production
database import occurred.

## Milestone 31 — CSE 2013 English pages 22 and 24, guarded wording overlay

Visually reviewed complete English pages 22 and 24 and corresponding Series A
key cells, followed by a separate stem/option comparison. Q51–Q59 are covered;
Q60 was not on these pages and remains pending. Five missing questions were
imported: Q52 (Bhakti chronology, key B), Q56 (capital account, B), Q57 (murals,
B), Q58 (Sankhya, B), Q59 (parliamentary cabinet principles, A). All original
options, historical qualifiers and assessed statements are preserved. None
requires a figure.

Locations distinguish saints' chronology, capital/financial flows, mural sites,
Indian philosophical schools and Council of Ministers. Q59 additionally occupies
Forms of Government; a canonical-ID union counts it once. A philosophical-school
placement under the combined Jainism/Philosophical Traditions chapter does not
misidentify Sankhya as Jain doctrine. No new syllabus leaf was needed: nine
subjects, 50 sections, 175 chapters and 1,019 leaves remain, with Physical 11/92
preserved.

Four existing records Q51/Q53/Q54/Q55 receive source-reuse evidence with full
comparisons and key values B/B/C/D. Q53 had one genuine transcription difference:
the raw bank says kinds of an organism, whereas the original says kinds of organism.
The erroneous article was not waved through as exact reproduction. A separately
approved, expected-hash-guarded nonmaterial correction now removes it in current
V4/direct current catalogue displays. The raw record, legacy transcript, choices,
accepted B answer, material-content revision and submitted snapshots remain
unchanged. Old snapshots remain gradeable without exclusions or changed answers.

The new reproduction-override builder validates exact raw-record and corrected
source hashes, a unique phrase replacement in both transcript and displayed
prompt, unchanged accepted key, explicit nonmaterial approval, rationale and
second pass. Material repairs are rejected and must use the existing separate
grading-revision workflow. Local source/key PDF hashes can be checked explicitly;
ordinary production freshness checking does not require machine-local PDFs.
Build now rejects stale override artifacts before compiling. Repeated application
is deterministic and does not increment revisions. The source-reuse register
requires Q53's reviewed current hash and override revision before accounting for
its corrected reproduction. The progress report exposes this correction separately.

CSE 2013 **Q1–Q59 are accounted for: 28 verified imports and 31 verified reuses**.
Q60 onward remain pending. Across 74 PDFs, 59 of 9,400 source slots have current
decisions; **9,341 remain pending**. The 7,210 secondary leads remain held. The
combined catalogue has **1,547 historical records and 1,514 eligible unique MCQs**,
all mapped. Original-cohort classifications stay 1,509 approved, ten out of scope
and zero pending, exactly 1,519.

Build and all **130/130 automated tests** pass. New tests assert all five imports,
B/B/B/B/A answers, unique overlap, source-exact current Q53 wording/hash and its
unchanged material revision. A separate historical-grading test confirms the old
wording and snapshot object remain intact and correctly scored. Import/source/
placement/reconciliation/override freshness, local PDF and frozen raw-bank hash
guards and whitespace checks pass. A browser regression exercises new printable
wording versus old printable snapshot wording with the same B key; all **32/32
browser scenarios** pass. The two-page current Q53 export was rendered and visually
inspected: complete source-exact question and options fit without clipping, and
the separate answer key shows B. Historical-print preservation passed its browser
assertions. No whole-corpus export-layout claim is made.

Full source-paper reconstruction and missing imports, twelve other reproduction
follow-ups, detailed editorial specifications and database-backed release parity
remain incomplete. No push, deployment or production database import occurred.

## Milestone 32 - CSE 2013 pages 26, 28 and 30

Read the complete English source pages and independently rechecked every printed
alternative against Series A key page 1. Five missing source occurrences are now
approved local imports: Q66 (inflation distributional effects, A), Q67 (disguised
unemployment, C), Q68 (Council of Ministers and Prime Minister duties, B), Q70
(Rajya Sabha presiding officers and presidential/vice-presidential electoral
participation, B) and Q71 (NALSA legal aid, C). Keep the printed Parliament wording
in Q68 statement 1; it must not be silently repaired to make the proposition true.
Q70 occupies three independently justified homes but remains one question.

Q60-Q65 and Q69 already exist. Their full stems, statements, options, source
identities and keys A/A/C/B/C/B/B were compared and recorded as seven verified
reuses. Q69 retains its historical CDS-prefixed ID and actual CSE metadata.
Expected raw-record hashes and the common original/key PDF hashes protect these
decisions. No additional record or duplicate is created for them.

Added Judiciary -> Legal aid with specific included concepts, exclusions, a
source-reviewed NALSA example and a bounded additional-placement rule. NALSA
delivery responsibilities are not forced into ordinary-court jurisdiction or a
generic welfare bucket. Syllabus counts are nine subjects, 50 sections, 175
chapters and 1,020 subparts; Physical Geography remains 11/92, Current Affairs
remains exactly seven broad sections, and existing stable IDs are unchanged.

CSE 2013 Q1-Q71 are accounted for: 33 verified imports and 38 verified existing
reuses. Q72 onward are still pending. Across the 74 PDFs and 9,400 source slots,
71 have current reviewed decisions and 9,329 remain pending. Secondary staging
still contains 7,210 held leads, not approved imports. The catalogue now has
1,552 historical records and 1,519 eligible unique MCQs, all mapped. The separate
original cohort stays 1,519 records: 1,509 approved placements and ten GS-scope
exclusions. That original cohort and the current eligible total happen to be the
same number, but they are different sets and measures.

Build and all 131 automated tests pass, including the five displayed answer keys,
rejection of wrong D answers, two/three-home overlap deduplication, Legal aid
inventory membership and preservation of the assessed Parliament wording.
Import, syllabus, placement, reconciliation, source-coverage and reproduction
override freshness checks pass. The raw bank hash is unchanged. A new browser
scenario exercises Legal aid navigation -> current-folder offer -> online setup
-> answer submission -> result -> printable answer key. All three targeted
Prelims browser scenarios pass. The initial new scenario used an exact accessible
name that omitted the button's arrow suffix; fixing that test locator resolved
the timeout without an application change. The successful run confirms the
answer-free snapshot contains only Q71, selecting C produces 100%, the printed
key is C, both substantive legal-services statements are present, and no browser
page errors occur. All 33 broader browser scenarios pass, including exact saved
memberships, historical exclusions, source-map exports, overlapping selections,
reload, mobile layouts, online grading and printable keys. This is application
regression coverage, not a claim that all source questions or every PDF layout
have been individually reviewed.

The full source/import exercise, twelve other reproduction follow-ups, remaining
editorial specifications and database-backed release parity remain incomplete.
No GitHub push, deployment or production database import is included.

## Milestone 33 - finish CSE 2013 source reconstruction and preserve Q94 history

Completed English source pages 32, 34, 36, 38, 40 and 42 and the corresponding
Series A final-key cells. Added twenty missing source occurrences:

| Page | Imported questions and accepted displayed keys |
|---|---|
| 32 | Q74 D; Q75 C |
| 34 | Q76 D; Q79 A; Q80 C |
| 36 | Q81 C; Q82 D; Q83 B; Q84 D; Q85 B |
| 38 | Q86 C; Q88 C; Q89 C; Q91 C |
| 40 | Q92 C; Q93 A; Q95 A; Q96 A |
| 42 | Q99 D; Q100 C |

The separate original-page second pass retains all statements, negative
instructions, examination-date framing and four alternatives. Official answers
are retained even where generic scientific/accounting wording could invite a
different discussion. This is not an independent conceptual endorsement of every
published distractor or formulation. News framing in Q96 does not turn its
particle-mass concept into an invented event-date record.

Nine source occurrences already exist: Q72, Q73, Q77, Q78, Q87, Q90, Q94, Q97 and
Q98. Full question/option comparisons and D/A/D/A/C/D/D/D/B key values are in the
reuse register. Q87's previous endangered-wording repair remains in force, and
Q98 retains its legacy-prefixed CSE ID. No duplicate records were imported.

Q94 exposed a real reproduction defect. The stored question omitted "or no
leaves" from statement 2 and differed in its opening stem. Restored the exact
printed stem and "Tiny leaves or no leaves" through a separate reviewed material
overlay, not by mutating the frozen bank. The official D key and every option
remain unchanged. A new guarded builder requires exact before/after hashes,
expected prior review/content revisions, full source/key evidence, a second pass
and explicit historical exclusion. It rejects held-record promotion and answer
changes. New content revision 1 scores normally; old revision-zero or unversioned
snapshots remain intact and excluded from score. Reapplication is deterministic.

The nonmaterial Q53 workflow stays separate and does not acquire a material
revision. New material policies are client-safe and applied by the existing
shared grading gate. Build refuses stale repair artifacts; optional local-source
checks verify the reviewed PDFs. Existing raw IDs, statements, options, submitted
answers and snapshot objects are preserved.

Five precise syllabus subparts now cover dance postures/gestures, money demand,
plant respiration, fundamental interactions and particle physics. Each has
concept-specific inclusions, exclusions, overlap boundaries and a real reviewed
source example. The syllabus has nine subjects, 50 sections, 175 chapters and
1,025 subparts. Physical Geography remains 11/92; Current Affairs remains seven
broad sections. Q80, Q84 and Q100 have two materially justified homes each, with
one canonical occurrence in a combined test.

All 100 CSE 2013 source numbers are now accounted for: 53 verified imports and
47 verified existing reuses. The paper identity register records the cover's
GS-I/Series A/100-item/bilingual observations, the matching key's explicit CSE
2013 header and the complete question sequence; it does not falsely claim the
cover itself prints a year. Only this paper receives completed source-content
and key-review status. The other PDFs are not promoted from filenames or prior
slot accounting.

Across 74 PDFs, 100 of 9,400 source slots now have current review decisions;
9,300 remain pending. The separate 7,210 secondary leads remain held. Catalogue:
1,572 historical records and 1,539 eligible unique MCQs, all mapped. Original
cohort: 1,519 unchanged raw records, 1,509 approved placements, ten GS-scope
exclusions. The frozen 204 answer-audit cohort and its held dispositions are
unchanged. Q94 is an additional current-source repair, not a rewritten old audit.

Build and all 133 automated tests pass. New API checks verify the twenty imported
keys, corrected Q94 revision/hash, negative qualifiers, unique overlap, wrong-key
rejection and nullable excluded historical feedback. The direct grading test
confirms old raw/legacy/saved text is unchanged and only revision 1 scores. Its
first version used the grading helper's wrong calling convention; fixing the
test produced the intended assertions without changing production grading.

All four targeted audit browser scenarios pass. The new Q94 scenario confirms
current printable wording and D key, historical result exclusion without a wrong
answer penalty, original historical print wording and an Excluded PDF key. Both
two-page exports were rendered and visually inspected: full stems, statements,
options and keys fit without clipping. This is targeted PDF QA, not a review of
every possible export layout. All 34 broader browser scenarios pass, including
saved-draft membership, overlap and source filtering, mobile navigation,
historical results, online/PDF setup and original figure exports. The updated
paper-identity/source accounting also passes all nine placement/source tests.

Source, import, syllabus, placement, reconciliation, material/nonmaterial repair
freshness and local PDF-hash checks pass; the frozen raw-bank hash is unchanged.
Remaining work includes the other source papers/imports, twelve previously
identified reproduction follow-ups, remaining chapter-specific editorial detail
and database-backed release parity. No push, deployment or production DB import.

## Milestone 34 - start CSE 2014 and separate paper-source identities

Read the complete original cover, English pages 2/4/6 and matching Series A key
page 1. The printed cover identifies GS-I, Series A and 100 bilingual questions.
Its handwritten year note is not the sole identity evidence: the key header
explicitly identifies Civil Services (Preliminary) 2014, GS-I, Series A, 100 items
and NIL dropped, and Q1-Q12 content was compared with that source context.

Eight questions already exist and were source-verified without copies: Q1 B,
Q2 A, Q3 A, Q4 D, Q5 C, Q6 A, Q9 C and Q10 B. In particular, Q2's long alternatives
continue across columns; all four were compared, not merely the left column.
All proposed ministry, institutional-origin and conservation-location statements
remain as printed rather than being silently made true.

Four missing occurrences are imported and classified:

| Question | Accepted key | Primary concept | Additional reviewed home |
|---|---|---|---|
| Q7 | A | Solar-energy technologies | None |
| Q8 | C | Classical languages | Current Affairs language recognition |
| Q11 | B | BRICS | Current Affairs membership changes |
| Q12 | B | Disease eradication | None |

Q8 and Q11 retain the 2014 recognition/membership context. They receive
Event-based tags but no invented event dates; exam year is not event year. Q7
retains its printed AC/DC and Indian-manufacturing propositions. Q12's public
health status question is not repurposed into medical advice or outbreak news.
Two bounded leaves, Language recognition and Disease eradication, include
concept-specific inclusions, exclusions, placement rules and reviewed examples.
The nine subjects, 50 sections and 175 chapters now contain 1,027 subparts.
Physical Geography stays 11/92 and Current Affairs stays seven broad sections.

The approved-import generator now has explicit 2013/2014 source contexts with
independent PDF/key hashes, URLs and years. Its append-only checks prove all 53
earlier imports, reuse placements and policy entries are unchanged. The original
historical artifact's batch label remains for compatibility; it is not a claim
that all imports came from one page or one approval batch. The new four-record
2014 batch is separate and source-bounded.

Separate reuse-evidence registers feed one explicit register list. Source-slot
decisions are indexed by PDF hash and printed question number, not a shared
exam/year/number key; different sessions or booklets cannot silently collide.
Duplicate approved occurrence keys are rejected instead of being overwritten by
a Map. Each reuse still checks its exact frozen raw-record hash, actual source
identity, displayed answer, second pass and matching PDF/key hashes.

CSE 2013 remains complete at 100 questions. CSE 2014 has 12 reviewed decisions
(four imports and eight reuses), with 88 still pending. Its paper identity is
reviewed but coverage is explicitly in progress. No other paper is promoted from
prior slot accounting. Global source totals: 112 reviewed, 9,288 pending out of
9,400. Secondary staging remains 7,210 held leads. Catalogue: 1,576 historical
records and 1,543 eligible unique MCQs, all mapped. The original 1,519-record
classification cohort, frozen raw-bank hash, old attempts, held aliases and
material/nonmaterial reproduction safeguards remain unchanged.

Import, syllabus, placement, reconciliation and source-coverage freshness checks
pass, including the two paper identities and the still-pending 2014 Q13-Q100.
New API checks cover all four keys, unique cross-subject unions, the original
South Africa and photovoltaic-manufacturing wording. Both dated records have
their reviewed tags and no eventDate value. Build and all 134 automated tests
pass, including source-specific hashes and independent current/frozen memberships.

All four targeted Prelims browser scenarios pass. The new BRICS scenario adds
International Relations and Current Affairs scopes through the real explorer,
checks their unique union against inventory, starts the online test, confirms
Q11 occurs once, grades B and opens the exact printable snapshot retaining the
historical South Africa proposition. All 35 broader browser scenarios pass,
including saved membership, corrected/held historical results, source filtering,
online/PDF setup, figures and mobile layouts. No whole-corpus export-layout claim
is made.

Remaining source reconstruction/imports, twelve earlier reproduction follow-ups,
the remaining detailed editorial specifications and database-backed release
parity are still incomplete. Work remains local: no push, deployment or
production database import.

## Milestone 35 - CSE 2014 Q13-Q25 and option-aware material repairs

Read complete English pages 8, 10 and 12 and the corresponding Series A key
cells. Imported Q18 (largest parliamentary committee, B), Q21 (Mahattara and
Pattakila village offices, B), and Q25 (kingdoms associated with the Buddha's
life, C). Added the bounded Village administration subpart under Medieval
Society and Economy, with included offices, exclusions, overlap rules and a
reviewed example. Syllabus totals are nine subjects, 50 sections, 175 chapters
and 1,028 subparts; Physical 11/92 and Current Affairs' seven sections are intact.

Ten existing occurrences were compared and reused: Q13 C, Q14 C, Q15 C, Q16 C,
Q17 C, Q19 C, Q20 B, Q22 B, Q23 A and Q24 D. Q15/Q17 retain legacy-prefixed IDs
and actual CSE metadata. Every statement and alternative was checked, including
the proposed crocodile-pressure statement, hibernation alternatives, lichen
associations and all four steel-industry pollutants.

Q13 and Q19 were not waved through as exact raw reproduction:

- Q13's source says "phenomena might have influenced", while the raw record says
  "has/have influenced". Restore the full printed stem, with material revision 1.
- Q19's source stem says "adds/add", and accepted option C is "1, 2 and 4 only".
  The raw option omits "only". Restore both the stem and C, with material revision 1.

Both official C letters remain unchanged. The separate material workflow now
resolves the reviewed source-paper identity from its PDF hash rather than
hardcoding 2013. It also supports explicitly reviewed option-text repairs:
exact before-values, valid nonrepeated option letters and an approved complete
after-options hash are required. It cannot reorder options, change a key or
promote a held record through a text-only repair. The Q94 artifact is preserved;
all three material repairs retain raw/legacy records and exclude old revision-zero
or unversioned snapshots from scores. New snapshots use the corrected display
with revision 1. No answer or historical snapshot is rewritten.

The source ledger requires the approved current transcript hash for both repairs
and the complete reviewed options hash for Q19. Source and key PDF hashes match.
The original raw bank hash remains unchanged. CSE 2014 Q1-Q25 are now accounted
for: seven verified imports and 18 verified existing reuses. Q26-Q100 remain
pending. CSE 2013 stays complete at 100. Global source accounting is 125 reviewed
and 9,275 pending out of 9,400 slots across 74 PDFs. The 7,210 secondary leads
are still held, not approved imports. Catalogue: 1,579 historical records and
1,546 eligible unique MCQs, all mapped. The frozen original 1,519-record cohort
and 204-record answer audit are unchanged.

Build and all 136 automated tests pass. New tests check the three imported keys,
the village leaf, source-exact modal wording and option C, content revision 1,
correct current grading and null/excluded historical feedback. Direct historical
grading keeps old text/options and submitted answers intact without penalties.
Import/source/syllabus/placement/reconciliation and material-repair freshness and
local-source checks pass. Repeated generation does not increment revisions.

All 36 broader browser scenarios pass. A new 2014 case verifies current source
wording, both C answers and old snapshot/result exclusions. An initial assertion
incorrectly expected two PDF table rows instead of two cells in a two-column row;
fixing that test required no application change. Visual review of the initial
exports confirmed the question layouts and the historical Excluded cells, but
also exposed an early harness capture of current key placeholders. The app's
print button/automatic-print effect already waits for key readiness. The test
now explicitly waits for two exact C cells and the enabled print control before
capturing its PDF; that strengthened focused scenario passes. The older History
PDF scenario was also strengthened to wait for exact C and B answer cells,
rather than matching C in a CSE source label, and passes independently. No final
PDF artifact is delivered here and no whole-corpus layout review is claimed.

Remaining work is the full remaining source/import exercise, twelve earlier
reproduction follow-ups, remaining chapter-specific editorial specifications and
database-backed release parity. No GitHub push, deployment or production import.

## Milestone 36 — CSE 2014 Q26–40

Read English source pages 14, 16 and 18 against the matching Series A key.
Imported Q27–34 and Q37; reused source-matched Q26, Q35–36 and Q38–40 with
frozen pre-change hashes. The original bank and saved snapshots are unchanged.
The official Q33 answer remains A; proposed reserve purposes, missile range and
propellant distractors are retained verbatim, not silently repaired.

Added a bounded Business correspondents subpart under Financial Inclusion.
Arab Spring is Event-based with no invented event date. The missile-capability
question is Static under Defence & Security; historical sales-tax and planning
questions retain their examination-era wording. None is classified by a passing
mention of news or a country name alone.

The active working registry now has 9 subjects, 50 sections, 175 chapters and
1,029 subparts. CSE 2014 has 40 reviewed slots (16 imports, 24 reuses), with 60
still pending. Across all 74 PDFs: 140 reviewed and 9,260 pending slots. There
are 69 approved imports, 1,588 historical records and 1,555 eligible unique MCQs,
all mapped. These are not claims of complete source coverage or editorial review.

Added snapshot/grading assertions for all nine imported answers, exact retention
of the 7500 km proposition, the dedicated banking-access leaf, and Static versus
Event-based tags. Source/import/syllabus freshness and local material-repair
source-hash checks pass. Initial concurrent automated/browser processes exhausted
available memory; their incomplete runs are not reported as passes. Serial
verification is recorded below after completion. No push, deployment or database
import is included.

The serial run passed all 137 tests. Inspection identified the API test harness
cache-busting the complete bundled application on every request, permanently
retaining each copy in the ESM cache. Reusing one application instance (as in a
running server) fixes the harness memory growth without changing production code
or reducing assertions. A fresh normal `npm test` then passed all 137 tests in
about 5.7 seconds after the build. The original bank SHA-256 remains
af4f2f71576a84795a0c8b7fac227ff68ad343d75d4d310c7f56990fc801e89d.

The first successful browser startup completed eight of nine scenarios. The
Legal Aid test failed because it asserted both C and B cells for a one-question
C-only paper: the earlier two-answer strengthening had been placed in the wrong
scenario. This corrects that earlier verification description: Legal Aid requires
one C and zero B cells; the two-question History PDF requires one exact C and one
exact B cell. No application change was necessary. The subsequent focused-suite
result is recorded after rerun; the initial eight-of-nine run is not a full pass.

Rerun: all nine placement/exclusion browser scenarios passed (55.7 seconds),
including the corrected Legal Aid and strengthened History PDF assertions.
This turn did not rerun the other 27 broader browser scenarios or perform a
fresh visual audit of every exported PDF. Next source batch starts at CSE 2014
Q41. All remaining source, editorial and database parity gaps remain open.

## Milestone 37 — CSE 2014 Q41–69

Complete English pages 20/22/24/26/28/30 and corresponding Series A cells were
visually compared in two passes. Added 13 missing questions (44, 47, 49, 54,
58–61, 63–67) and confirmed 16 existing records. Q55/57/62 retain their published
CDS-prefixed IDs and their already corrected CSE source identities. No duplicate
record is created and no historical content revision is reset.

The negative qualifier in Q47, the false Neem application, ordinary vegetative
propagation/virus claim and spacecraft/country/crop distractors are preserved.
Philosophy and Upanishadic textual-source questions receive two materially
justified History homes, with one canonical occurrence in a combined test.
Added bounded Cabinet Secretariat, Economic uses of plants and Biometric
identification leaves with source examples and inclusion/exclusion rules.

After this batch: 82 approved imports, 1,601 historical records and 1,568 eligible
mapped MCQs. Syllabus: 9 subjects, 50 sections, 175 chapters and 1,032 subparts;
Physical Geography and the seven Current Affairs sections are unchanged. CSE
2014 has 69 reviewed slots (29 imports, 40 reuses), 31 pending. Across all papers,
169 reviewed and 9,231 pending slots; staging leads remain held.

Import/source/syllabus generation and freshness checks pass. All 41 focused API
and placement tests pass, including the new 16-record snapshot/key test. Its
initial omission of content revisions correctly excluded the two already repaired
legacy questions; supplying only the selected snapshot revisions scores current
questions, while the old unversioned questions remain excluded. No production
code or historical record was changed to bypass this safeguard. The full suite
and browser regression will be rerun after the next source batch. No release.

## Milestone 38 — complete CSE 2014 source review

Reviewed complete English pages 32/34/36/38/40/42/44 and Series A cells Q70–100.
Added 22 source-exact GS questions (70, 72, 74–76, 81–94, 97, 99, 100), and
confirmed nine existing source occurrences. Q71 keeps its published legacy ID.
The two consecutive batches in this turn contain 29 and 31 questions, each
within one paper and the 50-question maximum; each batch has individual source,
reproduction, key, classification and second-pass decisions.

CSE 2014 is now reconciled Q1–100: 51 approved imports and 49 existing reuses.
The original material repairs at Q13/Q19 remain necessary, and older snapshots
are not graded against repaired wording. No question was dropped in this paper's
reviewed Series A final key. Existing source-corrected IDs and earlier content
revisions are preserved. This closes this paper only, not the 74-paper exercise.

The new records preserve the long sculpture descriptions, shrine locations,
false saint/philosophy associations, normal-year calendar alternatives, negative
qualifiers, vitamin E distractor, seed-policy claims and historical Non-Plan
Expenditure. The official Q72 B key is retained for the printed transgenic-crop
question rather than silently substituted with another biological formulation.
General report-publisher identity (Q99) is explicitly Static in the economic
reports section, not an invented recent event or miscellaneous classification.

Added four bounded leaves with inclusion/exclusion rules and actual examples:
Congress sessions/resolutions in the Gandhian phase, Calendars and eras, Crown
rule/proclamations, and Seeds/seed policy. Reviewed Q73 moves from generic
industrial chemistry into Economic uses of plants, retaining the independently
tested food-processing and biofuel homes. Q95 moves from broad environmental
laws to the existing specific Eco-sensitive zones leaf. These placement changes
do not revise answers/content or broaden frozen historical selections.

Current totals: 104 reviewed imports (53 CSE 2013, 51 CSE 2014), 1,623 historical
records, 1,590 eligible unique mapped MCQs and zero eligible unmapped records.
The registry has 9 subjects, 50 sections, 175 chapters and 1,036 subparts; the
11/92 Physical Geography structure and exactly seven Current Affairs sections
are preserved. Two papers/200 slots are source-reviewed; 9,200 of 9,400 slots
remain pending across 74 source PDFs. All 7,210 secondary leads remain held.
The original 1,519-record bank, frozen 204 answer cohort and existing held
dispositions are unchanged.

The build and all 139 automated tests pass. New tests cover every imported key,
three-way dance overlap, cross-subject vitamin placement, full long statements,
the new leaves and source-specific reclassification. Source/import/syllabus
freshness checks pass, including PDF/key hashes. Browser regression and the
new calendar/full-table print scenarios are recorded below after completion.
Remaining work includes subsequent source papers/imports, twelve earlier
reproduction follow-ups, uncompleted syllabus editorial specifications and
database-backed release parity. No push, deployment or production import.

### 2014 paired-row rendering follow-up (2026-10-22)

The broader browser run completed 37/38 scenarios. The new long-table case found
a real presentation gap: explicit sculpture/site, shrine/location and vitamin/
deficiency pairs were preserved in full but displayed as paragraphs, not tables.
The test was retained and the shared online/print prompt renderer was extended.

The new pair-table block requires an explicit two-column heading, a pair/matching
task and at least two complete consecutive numbered pairs. It refuses malformed
or skipped-number rows rather than converting a valid prefix or guessing missing
headings. Stored question text/options, raw-bank hashes, answer/content revisions
and historical snapshots are not changed. Headers and numbered left entries are
preserved; the right entries are not misrepresented as separately numbered List
II items. Existing genuine List-I/List-II rendering remains unchanged.

The fresh build and all 141 automated tests pass, including full-description,
instruction-retention, immutability and malformed-input checks. Browser rerun
and visual inspection of the resulting print PDF are recorded after completion.

The focused 11 browser scenarios pass after the renderer fix. The exported
five-question PDF was rendered and both pages visually inspected: the complete
sculpture/site, shrine/location and vitamin/deficiency tables fit, questions and
options are legible, and the separate answer key contains C/C/C/A/C. The broader
38-scenario rerun also passes (about 1.5 minutes), including mobile layouts,
saved memberships, source filtering, score refresh, maps and historical
exclusions. Its latest PDF was rendered again: both page PNG hashes exactly
match the visually inspected focused-run renders. These are regression artifacts,
not a final user PDF deliverable or a whole-corpus PDF-layout audit.

### Next paper preflight — CSE 2015 (not approved source coverage)

Read the complete cover and first English page, plus the matching Series A key
header and Q1–7 cells. Cover identifies GS Paper I, Series A, 100 bilingual
questions and the 2015 examination stamp. The key independently identifies Civil
Services (Preliminary) 2015, GS Paper I, Series A, 100 items and NIL dropped.
The first source page covers Q1–7 (Q4 continues across columns). This is preflight
evidence only: no 2015 slot is promoted and no import is published from it yet.

- Original: `C:/Users/iamdj/Desktop/KIS NDA/PYP/CSE PYP/2015.pdf`, SHA-256
  `cb82d062ee48ab46ef5e8796c3ed3fff4c28cad7e96af4a27dc7e10e62492e17`.
- Key: `../.tmp/full_reaudit_answer_keys/CSE/2015_GS1_answer_key.pdf`, SHA-256
  `6190bfb2d8b2a0d930c43dc1c1a5c813610fc737bb261ebf5015358dc93c4d5a`.
- Q1–7 key sequence visually observed: C, A, B, A, B, D, C. These observations
  are not a substitute for per-question reproduction, placement and second pass.
- The current source-occurrence lookup finds existing CSE Q5/Q6. Check corrected
  legacy identities and aliases before treating the other numbers as missing.

Next implementation step: extend the append-only reviewed-import generator to
accept an explicitly evidenced 2015 paper, then reconcile its first source batch.
The full requested syllabus/source/import exercise remains incomplete. No push,
deployment or production/database import has occurred.

## Milestone 39 — CSE 2015 Q1–7

Promoted the first complete English page only after rechecking its whole text,
four alternatives for each question and matching Series A cells. Imported Q1,
Q2, Q3, Q4 and Q7; reused existing Geography Q5/Q6 with frozen full-record hashes.
Q4's instruction and options continue at the top of the right column; they are
retained with Q4 rather than attributed to the neighbouring cyclone question.
The first-page key sequence is C/A/B/A/B/D/C. No option reordering occurred.

The append-only import generator now uses an explicit reviewed-paper-context
map for 2013, 2014 and 2015, validates actual PDF/key hashes and refuses unknown
years. Earlier 104 approved imports and their policies were preserved by exact
deep-equality guards. Reapplying the approved additions is byte-idempotent;
the raw bank hash remains
af4f2f71576a84795a0c8b7fac227ff68ad343d75d4d310c7f56990fc801e89d.
The historical pilot artifact label is retained for compatibility; it does not
mean that all reviewed questions originate from 2013 or one page.

Four bounded syllabus leaves have source examples and inclusion/exclusion rules:
financial-inclusion access/objectives, tax revenue indicators, Directive Principle
nature/enforceability, and current fiscal policy/devolution. They do not add any
Current Affairs section. Jan-Dhan's purpose is Static; the Fourteenth Finance
Commission's changed recommendations and Fortaleza Declaration are Event-based
without invented event dates. The specific 32-to-42-percent proposition remains
historical, not rewritten using a later commission. Fiscal institution, tax
sharing and the named recommendation have three reviewed homes but one test ID.

Build plus all 142 automated tests pass. New tests check every first-page key,
specific 2015 source hashes, unique snapshot membership across fiscal placements,
the cross-column Q4 continuation and absence of inferred event dates. Syllabus,
source and import freshness checks pass. Browser scenarios were not rerun for
this content-only batch; the prior 38-scenario run predates these five additions.

Current totals: 109 approved imports, 1,628 historical records, 1,595 eligible
unique mapped MCQs, zero eligible unmapped records. Syllabus: 9 subjects,
50 sections, 175 chapters and 1,040 subparts. Physical Geography remains 11/92;
Current Affairs remains seven sections without a catch-all. CSE 2015 is partial:
7 reviewed slots (5 imports, 2 reuses), 93 pending. Overall: 207 reviewed slots,
9,193 pending across 74 PDFs; only CSE 2013 and 2014 are complete. Secondary
staging leads remain held. The original 1,519 cohort and frozen 204 answer audit
are unchanged. Continue at CSE 2015 Q8. No push, deployment or database import.

## Milestone 40 — CSE 2015 Q8–25

Visually reviewed full English pages 4/6/8 and corresponding Series A key cells.
Imported Q8, Q10, Q16–17, Q20–25; reused Q9, Q11–15 and Q18–19 with their frozen
record hashes. Q13 retains its published CDS-prefixed ID. Re-read the Rowlatt
question across columns, including the Home Rule role and false Simon Commission
coincidence. Institutional mandates, legal years, the dugong entire-coast claim,
fly-ash only/no-toxic-elements statement and proposed pilgrimage hill locations
remain printed propositions, not silently repaired assertions.

Syllabus amendment: research and innovation institutions were missing from the
six existing Science sections. Added Research & Innovation, with Research
Institutions and Systems and Science Policy and Innovation Systems chapters.
This is a general scientific-system area, not a new Current Affairs category.
Its eight subparts remain separately visible, including empty topics; the NIF
question has a source-bounded Innovation institutions home. The empty branches
remain provisional editorial specifications, not claims of reviewed questions.

Also added bounded industrial-indicator, Rowlatt, colonial-economic-critic,
gene-therapy and species-symbol leaves with inclusion/exclusion rules and source
examples. A nanotechnology question has three material homes (nano, drug
development, gene therapy), but one canonical test occurrence. The Ebola outbreak
is Event-based without an inferred date; report publisher, hypothetical SLR and
industrial index structure remain Static in the exam context.

Source-reviewed display repair: the existing Q15 transcript retains both column
headings but lost the column gap (Place of Pilgrimage Location). The formatter
now recognises this exact reviewed heading, preserving every word and numbered
pair without editing the stored record. It does not guess other collapsed
headings. Added a regression retaining the wrong Satmala/Mahadeo associations,
all three rows and the final instruction. No content/key revision changes.

Current totals: 119 reviewed imports, 1,638 historical records and 1,605 eligible
unique mapped MCQs, zero eligible unmapped. Syllabus: 9 subjects, 51 sections,
177 chapters and 1,053 subparts; Physical Geography remains 11/92 and Current
Affairs exactly seven sections. CSE 2015 has 25 reviewed slots (15 imports,
10 reuses), 75 pending. Overall 225 reviewed and 9,175 pending of 9,400 slots
across 74 PDFs. Only CSE 2013/2014 are complete. Secondary candidates remain
held, original bank/204 answer cohort unchanged, and earlier follow-ups open.

Build and all 144 automated tests pass. Checks cover all ten imported keys,
snapshot deduplication, cross-column wording, new concept homes, preservation of
earlier approved imports and source/syllabus freshness. Focused browser flow for
the new section, online score and reviewed PDF is recorded after completion.
No push, deployment or production import. Continue with CSE 2015 Q26.

The focused 12 browser scenarios pass, including opening the new research area,
creating the single NIF test, scoring it at 100%, deduplicating the nanotechnology
placements and exporting the Q15/Q16/Q23 packet. The two-page PDF was rendered
and visually inspected: pilgrimage columns/rows are aligned, all three Rowlatt
statements and both nanotechnology statements are complete, options remain
readable and the separate key is A/B/C. This is a regression packet, not a final
PDF deliverable or whole-bank visual audit. The other 27 broader browser cases
were not rerun this batch. Reapplying approved additions produces identical
import/policy/raw-bank bytes; the historical bank hash remains unchanged.

## Milestone 41 — CSE 2015 Q26–44

Reviewed complete English pages 10/12/14, including Q41's instruction/options
across the column boundary, and the corresponding Series A cells. Added 13
missing records (26–32, 34–35, 37, 39, 41, 44). Reused six canonical occurrences
(33, 36, 38, 40, 42, 43); Q42 retains its CDS-prefixed published ID. The already
held Q40/Q43 aliases remain duplicates and cannot inflate the active pool.

Added bounded WTO and Currency convertibility leaves with source examples and
inclusion/exclusion rules. NFC/encryption, medieval-state/current-region mapping,
and Babur's political/technological/architectural claims receive independently
justified additional placements. No date is inferred from news references.
Printed Conference in the WTO distractor, the NFC metre-distance assertion,
Congress Socialist Party positions and both PM statements remain unchanged.

The 2015 Buddha question remains a separate PYQ from CSE 2014: its accepted
Kosala/Magadha combination is D, while the 2014 question accepts C. Each retains
its full original options, source occurrence and ID; similarity is not grounds
for merging different years.

Two approved nonmaterial display overlays restore The area known as in Q33 and
Pranahita spelling in Q36. Raw records, options, accepted letters, content/key
revisions and historical snapshots remain unchanged. Old questions remain
gradeable, not excluded. The override validator now permits whitespace-only
differences between multiline raw source text and joined prompt lines while
still requiring exact expected before-record and corrected-source hashes,
unique replacement phrases and preservation of every word. This does not admit
material repairs into the nonmaterial workflow.

Totals: 132 reviewed imports, 1,651 historical records, 1,618 eligible unique
mapped MCQs, zero eligible unmapped. Registry: 9 subjects, 51 sections,
177 chapters, 1,055 subparts. Physical Geography stays 11/92 and Current Affairs
seven sections. CSE 2015 is partial at 44 reviewed (28 imports, 16 reuses),
56 pending. Overall 244 reviewed and 9,156 pending source slots across 74 PDFs;
only CSE 2013 and 2014 are complete. Staging leads and prior exclusions remain
held; the original 1,519 and frozen 204 cohorts are unchanged.

Build and all 146 automated tests pass. Import/source/syllabus freshness and
local correction-source hashes pass. Repeated application is byte-idempotent,
with raw-bank SHA-256 still
af4f2f71576a84795a0c8b7fac227ff68ad343d75d4d310c7f56990fc801e89d.
All 13 focused browser cases pass, including canonical membership, six-question
grading, medieval matching table, current nonmaterial display and C-versus-D
year-specific keys. The resulting two-page regression PDF was rendered and
visually inspected: all rows, statements, options and key C/B/D/B/B/D are intact
and readable. This is not a whole-bank visual audit or final PDF deliverable.
The remaining 27 broader browser cases were not rerun in this batch.

Continue at CSE 2015 Q45. Subsequent papers/imports, earlier reproduction
follow-ups, incomplete syllabus editorial specifications and database-backed
release parity remain open. No GitHub push, deployment or production import.

## Milestone 42 — CSE 2015 Q45–Q50 source review

Reviewed complete English page 16 against Series A final-key page 1, then
reread the stems, options and cells. Four missing records (Q46/Q47/Q48/Q50)
are imported; Q45 and canonical Q49 are reused. The existing Q49 duplicate
remains held. Q48's statement and answer continuation across columns stay
together. Sarojini Naidu remains in the deliberately incorrect proposition;
Q50 retains the explicit 2014 award context and printed Organization spelling.
No exam-year-derived event date is created. The preserved Physical Geography
baseline placement of Q45 is unchanged, not represented as a new classification.

New homes: Civil Disobedience, Vijayanagara, Congress foundation/early
leadership, and award recipients/institutions. No incidental-person, river or
space-technology placements are added. Existing originals, snapshots, answer
revisions and material-content revisions remain unchanged.

Totals: 136 approved imports; 1,655 historical records; 1,622 eligible unique
mapped questions and zero eligible unmapped. CSE 2015: 50 reviewed (32 imports,
18 reuses), 50 pending. Overall: 250 reviewed source slots and 9,150 pending.
Only CSE 2013 and 2014 are fully source-reviewed; 7,210 staging candidates stay
held. Taxonomy and frozen original/204 cohorts are unchanged.

Build and all 147 automated tests pass, including new snapshot membership,
preservation of Q48's false statement and Q50's award year, and accepted keys
B/C/B/C. Import and source-coverage freshness checks pass. No browser or PDF
visual regression was rerun for this batch; prior results are not relabelled
as current. Continue at CSE 2015 Q51, original English page 18. Earlier source
follow-ups, remaining imports, syllabus editorial detail and database-backed
parity remain open. Local only: no push, deployment or production import.

## Milestone 43 — CSE 2015 Q51–Q61 source review

Complete original English pages 18 and 20 and matching Series A key cells
were visually compared and reread. Eight missing source occurrences are now
imported: Q51/Q53/Q54/Q55/Q56/Q57/Q59/Q60. Three existing occurrences are
reused: canonical Q52, Q58 and published legacy ID cds-2015-2015-61. The Q52
duplicate remains held; a misleading legacy ID prefix does not create another
PYQ. No raw transcript, old snapshot or answer/content revision is rewritten.

The Cabinet Mission, Amnesty International, monument chronology, feudal
landholding, BioCarbon fund, regional membership, scheduled-area protection
and Union financial controls receive specific homes. Dhauli sculpture shares
Ancient India and Art & Culture; the BioCarbon question shares climate finance
and development institutions; Q59 shares constitutional scheduled areas and
tribal protection; Q60 shares budget documents and parliamentary financial
control. Unique canonical membership is preserved across these placements.
Incorrect centralisation, court/ICS, budget-department and Public Account
claims are retained as assessed propositions. No unsupported event dates.

Added reviewed editorial boundaries/examples for Landholding and polity and
International NGOs, without changing topic counts. Other generic syllabus
specifications still need editorial completion. Physical Geography 11/92 and
the seven Current Affairs sections are unchanged.

Current totals: 144 approved imports, 1,663 historical records, 1,630 eligible
unique mapped MCQs, zero eligible unmapped. CSE 2015: 61 reviewed (40 imports,
21 reuses), 39 pending. Overall: 261 reviewed slots, 9,139 pending across 74
PDFs; only CSE 2013 and 2014 are complete. Original 1,519 records, frozen 204
answer cohort, earlier source follow-ups and 7,210 held staging leads remain
unchanged.

Build and all 148 automated tests pass. New snapshot/grading coverage checks
all eight imported keys (A/B/B/B/D/B/A/C), false-statement preservation and
two-home deduplication. The earlier History overlap fixture was updated to
include the newly approved Q54: three canonical records, not a duplicate.
Syllabus/import/source freshness checks pass; raw-bank SHA-256 remains
af4f2f71576a84795a0c8b7fac227ff68ad343d75d4d310c7f56990fc801e89d.
Browser and PDF visual regressions were not rerun for this batch; earlier
results are not claimed as current. Continue with Q62 on English page 22.
Remaining papers, reproduction follow-ups, editorial detail and DB-backed
parity stay open. No GitHub push, deployment or production import.

## Milestone 44 — CSE 2015 Q62–Q71 source review and browser regression

Reviewed complete English pages 22 and 24 and corresponding Series A final-key
cells, then reread full stems and options. Four imports: Q64 Mekong-Ganga,
Q65 Basel III, Q67 IOR-ARC and Q68 Swadeshi. Six existing records Q62/Q63/Q66/
Q69/Q70/Q71 are reused after full reproduction comparison. Q64's codes cross
the page's columns; the negative participation task and all five countries
are intact. Q65's long environmental alternatives remain complete. Q67 keeps
the historical organisation name and incorrect security-only claim.

The original Q66 itself prints 30 degrees N and 60 degrees S. That statement
must not be corrected in the question: the key accepts B, statement 2 only.
Q70 retains the printed centrifugal-force wording. Both preserved Physical
Geography placements remain unchanged. No new material repairs, key revisions,
historical mutations or duplicate promotions.

Added source-reviewed boundaries/examples for Prudential norms and Indo-Pacific
forums. Topic counts remain 9 subjects, 51 sections, 177 chapters and 1,055
subparts; Physical Geography 11/92 and Current Affairs seven sections.

Totals: 148 approved imports, 1,667 historical records, 1,634 eligible unique
mapped questions, zero eligible unmapped. CSE 2015 is partial at 71 reviewed:
44 imports and 27 reuses, 29 pending. Overall 271 source slots reviewed and
9,129 pending; only CSE 2013 and 2014 are complete. Frozen original and 204
cohorts, existing exclusions and 7,210 staging leads remain unchanged.

Build and all 149 automated tests pass. The new API test covers negative
membership, the original hemispheres, security-only wording, unique snapshots
and accepted keys. Syllabus/import/source freshness and byte-idempotence checks
pass. Raw bank hash is unchanged.

All 14 focused placement/exclusion browser scenarios pass. The new print test
initially failed only because it assumed a literal space between the rendered
statement-number and Thailand text; a whitespace-tolerant assertion now checks
the same number and country. No product or question change was needed. The
History browser fixture now explicitly exercises Add remaining on the partially
covered Mauryan branch, includes the newly reviewed Q54 exactly once, starts
a three-question timed test, and confirms printable C/B/B keys.

Rendered and visually inspected both pages of the new Q64/Q65/Q67/Q68 regression
PDF: complete country list, negative task, long Basel alternatives, security
claims and C/B/D/A key are readable, with no clipping. The verification skill
guided local UI/API/data/print boundary checks. Environment checks confirmed
remote base URL and OIDC unset; no remote credentials were fetched. Other 27
broader browser cases were not rerun; this is not a whole-bank visual audit.

Continue at CSE 2015 Q72 on English page 26. Remaining papers, source follow-ups,
syllabus editorial completion and database-backed parity remain open. All work
local; no push, deployment or production import.

## Milestone 45 — complete CSE 2015 source coverage, Q72–Q100

Reviewed and reread complete English pages 26, 28, 30, 32, 34 and 36 with the
matching Series A final-key cells. Eighteen missing occurrences are imported:
Q73/Q75/Q81/Q82/Q83/Q85/Q86/Q87/Q88/Q90/Q92/Q94/Q95/Q96/Q97/Q98/Q99/Q100.
Eleven existing occurrences Q72/Q74/Q76/Q77/Q78/Q79/Q80/Q84/Q89/Q91/Q93 are
reused after comparison of every stem, statement and alternative. Published
legacy-prefixed IDs Q79/Q89/Q91 remain intact. Original records, answer/content
revisions, saved snapshots and current exclusions are unchanged.

New Research Facilities and Observation chapter supplies Polar research,
Ocean observation, Astronomical observatories and Large experimental facilities.
The two used observation leaves have reviewed boundaries and examples; empty
facility leaves remain editorial draft, not claimed as question-reviewed.
IndARC occupies both observation and polar-research homes, not a defence,
satellite or diplomatic-forum bucket. Added Technological progress under
economic core concepts, with explicit factor-augmentation boundaries and Q90
example. Current registry: 9 subjects, 51 sections, 178 chapters, 1,060 subparts.
Physical Geography remains 11 chapters/92 subparts; Current Affairs seven sections.

Odia recognition is Event-based with a second Classical languages placement,
but no inferred event date. Recently, last decade, GI status, nuclear-treaty
recognition and IREDA corporate status retain the examination context, not
current facts. False legislative-council, fuel-cell AC/small-device, bio-toilet
fungal/end-product and forestry-research funding propositions are preserved.
The longer Seed Village answer and all GI product spellings are complete.
Kalamkari has painting and textile homes; fuel cells electrochemistry and
energy-technology homes; IREDA NBFC and public-enterprise homes. Overlap counts
each canonical question once. Distractors do not generate unrelated placements.

All 100 CSE 2015 source occurrences are accounted for: 62 verified imports and
38 canonical reuses. Only CSE 2013, 2014 and 2015 are now fully source-reviewed.
Across the inventory, 300 slots are reviewed and 9,100 remain pending; the
74-paper source universe and 7,210 held staging leads are unchanged. Totals:
166 approved imports, 1,685 historical records, 1,652 eligible unique mapped
MCQs and zero eligible unmapped. Original 1,519 and frozen 204 cohorts unchanged.

Build and all 151 automated tests pass, including 18 new accepted-answer checks,
shared-location snapshot deduplication, full original alternatives, historic
language status, factor augmentation, and exact 100-slot coverage. Import and
source freshness checks pass. No browser or PDF visual regression was rerun
this turn; milestone 44 results are not presented as a whole-bank or new-batch
visual audit. Remaining work includes CSE 2016 onward, CAPF/CDS/NDA paper imports,
earlier source follow-ups, syllabus editorial detail and database-backed parity.
Nothing pushed, deployed or imported into production.

## Milestone 46 — CSE 2016 identity and Q1–Q11

Confirmed both language covers and the matching final Series A key header:
CSE Preliminary 2016, GS Paper-I, 100 questions, NIL dropped. The English
cover is PDF page 2; English Q1–Q5 are PDF page 3 (printed page 2), followed
by Q6–Q11 on PDF page 5 (printed page 4). This offset is explicitly registered,
not copied from 2015. Source and key hashes are independently checked.

Ten imports Q1/Q2/Q3/Q4/Q5/Q7/Q8/Q9/Q10/Q11 and one canonical Q6 reuse follow
complete-page visual comparison and a separate reread of stems, all options
and key cells. Q3 and Q8 continue across columns. The generator now requires
an explicit 2016 paper context alongside 2013–2015; prior approved imports are
append-only and unchanged. Added explicit 2016 evidence/reuse registration.
Its missing initial registration correctly stopped source-coverage generation;
after registering the reviewed evidence, generation and the full suite pass.
No fallback year context or filename-based source approval was introduced.

2016 Q3 is not merged with 2015 Q98: its fourth action is Reducing import duty,
not Expanding industries, and the accepted 1-and-3 combination is C rather than
A. Parliamentary prorogation and dissolution are kept distinct. Payment Banks
credit/debit and lending assertions, GHI attribution/components, LiFi relative
speed, UDAY's 2018 distractor and historical Krishna Deva/Vijayanagar spelling
are preserved as printed. No current policy or unsupported date is substituted.

Added Payments banks and Shungas and Kanvas leaves with boundaries and source
examples. The former tests regulatory powers rather than a generic payment
method; Malavikagnimitra shares Sanskrit literature and the Shunga dynasty home.
GHI shares nutrition and health indicators; UDAY shares programme objective
and energy infrastructure; Masala Bonds share bond concepts and the IFC's
development-institution affiliation. Each shared question counts once.

Totals: 176 approved imports, 1,695 historical records, 1,662 eligible unique
mapped MCQs, zero eligible unmapped. Registry 9 subjects/51 sections/178 chapters/
1,062 subparts. Physical Geography 11/92 and Current Affairs seven sections
unchanged. Source review: 311 reviewed slots and 9,089 pending across 74 PDFs.
CSE 2016 is partial: 11 reviewed (10 imports, one reuse), 89 pending. Only CSE
2013–2015 are complete. Original 1,519 and frozen 204 cohorts unchanged.

Build and all 152 automated tests pass, including snapshot/grade checks for
all ten additions, four shared homes, year-specific deficit keys and exact
partial-paper coverage. Import, source and syllabus freshness checks pass.
Browser and PDF visual regressions were not rerun this turn; earlier browser
results are not relabelled current. Continue at CSE 2016 Q12 on PDF page 7.
The wider import/editorial/source-follow-up/database-parity work remains open.
Local only; no push, deployment or production import.

## Milestone 47 — CSE 2016 Q12–Q22

Compared and reread complete English PDF pages 7 and 9 (printed 6 and 8) and
matching Series A final-key cells. Eight imports Q12/Q14/Q15/Q16/Q17/Q18/Q20/
Q21 and three canonical reuses Q13/Q19/Q22 are recorded. Reuse evidence locks
the original record hashes and full-stem/options review; no old source ID,
snapshot, answer revision or content revision is rewritten.

The new questions cover capital-budget classification, SDR-basket development,
IMFC mandates, manual-scavenging rehabilitation, Siddhas/Lingayats, import cover,
OPCW and crop insurance. Added bounded subparts/examples for Siddhas and
Lingayats, Manual scavenging and rehabilitation, and International monetary
developments. Rashtriya Garima Abhiyaan is not assumed to be a government
scheme just from its name; its actual rehabilitation purpose controls placement.
The SDR proposal is Event-based without an inferred date. Five questions have
material additional homes; selection/snapshot totals use unique canonical IDs.

Keep the incorrect UNCCD South Asia/North Africa funding claim, Kurd/Bangladesh
pair, OPCW EU/NATO/WHO affiliation and all-crops/all-seasons uniform premium
claim. The original purpose is to assess them, not correct the propositions.
Hornbill regional alternatives, Siddha/Lingayat doctrines, IMFC observer role
and proposed versus implemented SDR wording remain complete and historical.

Totals: 184 approved imports, 1,703 historical records, 1,670 eligible unique
mapped questions and zero eligible unmapped. Registry: 9 subjects, 51 sections,
178 chapters, 1,065 subparts. Physical Geography 11/92 and Current Affairs seven
sections unchanged. CSE 2016: 22 reviewed (18 imports/four reuses), 78 pending.
Across 74 PDFs: 322 slots source-reviewed and 9,078 pending. Only CSE 2013–2015
are complete. Frozen original/204 cohorts, prior exclusions and held staging
candidates remain unchanged.

Build and all 153 automated tests pass, including official keys D/D/C/C/C/D/B/B,
preservation of incorrect claims, five shared homes, unique snapshots and
contiguous partial-paper coverage. Import/source/syllabus freshness checks pass.
Browser and PDF visual regressions were not rerun; older browser results are
not represented as current. Continue at Q23 on English PDF page 11. Remaining
paper imports, source follow-ups, editorial depth and DB parity remain open.
Local only: no push, deployment or production import.

## Milestone 48 — CSE 2016 Q23–Q32 and punctuation-only restoration

Compared and reread complete English PDF pages 11/13 (printed 10/12) with
Series A Q23–Q32 cells. Four imports Q26/Q29/Q31/Q32: Stand Up India, Core
Banking Solutions, transcriptome and Mission Indradhanush. Six canonical reuses
Q23/Q24/Q25/Q27/Q28/Q30: NGRBA, neem-coated urea, Chief Secretary, GIAHS,
Brahmaputra tributaries and protocol matching. Q25 retains its published legacy
ID and complete current wording; historical rawQuestionText noise does not
justify a new source occurrence or a rewritten saved snapshot.

Q23 had a missing closing quote after NGRBA). A reviewed nonmaterial overlay
restores just that punctuation. Exact raw-record and corrected-source hashes,
unique replacement, unchanged options and accepted A are enforced. Content
revision remains zero; raw/legacy text and historical scoring remain intact.
All nonmaterial local source/key hashes verify. This is the fourth nonmaterial
overlay, separate from the existing three material repairs.

Preserve rotating-Chief-Minister chairmanship, no-nitrous-oxide release, GIAHS
modernisation/GI objectives, incorrect treaty origins, RBI-control and impaired-
bank takeover claims as assessed propositions. New Core banking and
Transcriptomics and bioinformatics subparts have explicit boundaries/examples.
Stand Up India shares initiative and credit-access homes; Mission Indradhanush
shares initiative and maternal/child health. NGRBA basin planning remains a
material additional home. Every shared occurrence is selected only once.

Totals: 188 approved imports, 1,707 historical records, 1,674 eligible unique
mapped questions, zero eligible unmapped. Registry: 9 subjects, 51 sections,
178 chapters, 1,067 subparts. Physical Geography 11/92 and seven Current Affairs
sections unchanged. CSE 2016: 32 reviewed (22 imports/ten reuses), 68 pending.
Overall: 332 source slots reviewed, 9,068 pending across 74 PDFs; only CSE
2013–2015 are complete. Frozen original/204 cohorts and exclusions unchanged.

Build and all 155 automated tests pass. New checks cover accepted C/A/B/A,
full current claims, three shared selections, restored quote, zero content
revision, unchanged legacy wording and successful scoring of an old snapshot.
Import/source freshness and local correction-source hash checks pass. Browser
and PDF visual regressions were not rerun for this batch; no whole-bank visual
claim is made. Continue at Q33 on English PDF page 15. Source imports, earlier
follow-ups, syllabus editorial completion and DB parity remain open. Local only;
no push, deployment or production import.

## Milestone 49 — CSE 2016 Q33–Q45

Complete English PDF pages 15/17 (printed 14/16), all stems/options and matching
Series A final-key cells were compared and reread. Ten imports Q34–Q43 and
three canonical reuses Q33/Q44/Q45. Source review confirms Q45's prior answer
correction A; no new answer revision or content change is applied. The full
eleven-metre/orange-pulp discovery description and four locations match.

New items cover the named 2011 food-label rules, Project Loon, net metering,
economic-index publisher, medieval Banjaras, Ashokan-edict decipherment, Gram
Nyayalayas, historical TPP, the India-Africa Summit and MCLR. Added bounded
Food safety and labelling and Lending rates and benchmarks subparts. Food-label
medical recommendations are not silently changed into a different allergen
requirement. TPP is not updated to CPTPP. Keep the civil-only court claim,
all-Pacific/security-only propositions, and Nehru/1951 origin claim intact.

Ashokan decipherment shares Mauryan inscriptions and epigraphic sources;
the dated summit shares the event and India-Africa relations. Publisher
identification stays Static; no rank value or release date is invented.
RBI's name alone does not create a monetary-policy-instruments placement for
MCLR. Incorrect alternatives do not create extra occupations or technologies.
Green India Mission's accounting/agricultural claims and Kharai camel's
non-domestication claim remain original assessed propositions.

Totals: 198 approved imports, 1,717 historical records, 1,684 eligible unique
mapped MCQs, zero eligible unmapped. Registry: 9 subjects, 51 sections,
178 chapters, 1,069 subparts. Physical Geography 11/92 and Current Affairs
seven sections unchanged. CSE 2016: 45 reviewed (32 imports/13 reuses),
55 pending. Overall: 345 slots source-reviewed, 9,055 pending across 74 PDFs.
Only CSE 2013–2015 are complete; frozen original/204 cohorts, existing holds
and 7,210 staging leads remain unchanged.

Build and all 156 automated tests pass. New assertions cover keys C/B/A/C/D/B/
B/D/A/C, complete historical wording, two shared homes, unique snapshots and
contiguous partial-paper coverage. Import/source/syllabus freshness checks pass.
Browser and PDF visual regressions were not rerun for this batch; no whole-bank
visual verification claim is made. Continue at Q46 on English PDF page 19.
Remaining source papers, editorial detail, prior follow-ups and database parity
remain open. All work stays local: no push, deployment or production import.

## Milestone 50 — CSE 2016 Q46–Q56

Compared and reread complete English PDF pages 19/21 (printed 18/20) and
matching Series A final-key cells. Five imports Q46/Q47/Q49/Q50/Q56: INS
Astradharini, GL-10, Swadeshi/Boycott, Bodhisattva and FSDC. Six canonical
reuses Q48/Q51/Q52/Q53/Q54/Q55. Q48 codes continue in the right column.
The canonical UN-REDD+ ID is reused; its CDS-prefixed duplicate remains held.
Doctors Without Borders retains its published legacy ID and complete display.

The append-only guard stopped an initial attempt to pass already-present Q55
through the new-import module. Inspection confirmed its existing correct Climate
Science/Emissions accounting placement. The draft import and redundant proposed
Climate Responses leaf were removed, preserving the existing taxonomy home.
Only the missing closing quote in What is 'Greenhouse Gas Protocol'? is repaired
through a nonmaterial overlay. Raw-record/source hashes, all options and answer
A are guarded; content revision stays zero and old snapshots still score.
There are now five nonmaterial overlays, separate from three material repairs.

Refined the existing Emissions accounting leaf with boundaries/example: an
accounting framework is not a treaty because Protocol appears in its title.
No new taxonomy nodes are necessary. Swadeshi/Boycott shares Partition of
Bengal; Buddhist sect association and Bodhisattva doctrine share Ancient India
and Art & Culture. Named naval/technical project identity stays Static where no
event itself or date is tested. Preserve Hinayana, TEEB's false sponsors, Red
Sanders' rainforest claim, the 2022/all-member-states treaty alternative and
FSDC's incorrect NITI Aayog affiliation. No distractor-driven extra homes.

Totals: 203 approved imports, 1,722 historical records, 1,689 eligible unique
mapped MCQs, zero eligible unmapped. Registry remains 9 subjects, 51 sections,
178 chapters, 1,069 subparts; Physical Geography 11/92 and Current Affairs seven
sections unchanged. CSE 2016: 56 reviewed (37 imports/19 reuses), 44 pending.
Overall: 356 source slots reviewed, 9,044 pending across 74 PDFs. Only CSE
2013–2015 are complete. The distinct frozen 204 answer-review cohort is unchanged,
as are original records, prior exclusions and held staging candidates.

Build and all 158 automated tests pass, including new keys C/A/A/B/C, reused
Q55 A, preserved incorrect assertions, two shared homes, canonical Q54 and
duplicate hold, exact partial source coverage, and unchanged scoring/text of
an old Q55 snapshot. Import/source/syllabus freshness and local correction PDF
hash checks pass. Browser/PDF visual regressions were not rerun this batch.
Continue with Q57 on English PDF page 23. Wider import, source-follow-up,
editorial and DB-backed parity work remains open. Nothing pushed, deployed or
imported into production.

## Milestone 51 — CSE 2016 Q57–Q69

Complete English PDF pages 23/25 and matching Series A key cells were compared
and reread. Eleven imports Q58/Q59/Q60/Q61/Q62/Q63/Q64/Q65/Q66/Q67/Q69 and two
canonical reuses Q57/Q68. Bitcoin Q66 codes continue at the top of the right
column. All source words, four alternatives and historical qualifiers remain.

Added International taxation and Blockchain and cryptocurrencies subparts with
bounded includes/excludes and source examples. BEPS retains the printed tax
evasion terminology. The proposed first NIMZ location is Event-based, without
an inferred proposal date, and shares the industrial-zone home. SWAYAM shares
education/digital access and government initiatives. Bitcoin transaction/identity
claims share cryptocurrency concepts and digital finance; do not replace them
with present-day tracing/regulatory facts. Keep the incorrect APEC founding,
same-period/same-denomination, DMF powers and Johannesburg/2002 propositions.

Ajanta–Mahabalipuram is classified by rock-cut architecture, not arbitrary
dynastic placements. Its addition legitimately expands the earlier two-scope
History fixture: leaf counts 2 and 3, union four distinct source records.
The API fixture now asserts all four IDs once; the browser fixture is updated
for four questions and printable C/B/B/B, but has not been rerun in this batch.

Totals: 214 approved imports, 1,733 historical records, 1,700 eligible unique
mapped MCQs and zero eligible unmapped. Registry: 9 subjects, 51 sections,
178 chapters, 1,071 subparts; Physical Geography 11/92 and seven Current Affairs
sections unchanged. CSE 2016: 69 reviewed (48 imports/21 reuses), 31 pending.
Overall: 369 source slots reviewed, 9,031 pending across 74 PDFs. Only CSE
2013–2015 are complete. Original records, frozen 204 cohort, exclusions and
held staging candidates remain unchanged.

Build and all 159 automated tests pass after updating the explicit architecture
membership fixture. Checks cover eleven accepted keys C/D/B/A/B/D/D/B/B/B/B,
three shared homes, original historical claims and exact partial source coverage.
Source/import freshness checks pass. No browser or PDF visual rerun is claimed.
Continue at Q70 on English PDF page 27. Wider imports, editorial work, source
follow-ups and DB parity remain open. No push, deployment or production import.

## Milestone 52 — CSE 2016 Q70–Q75

Complete English PDF page 27 and matching Series A key cells were compared
and reread. Four new imports Q70–Q73 and two existing canonical reuses Q74/Q75
are source-reviewed. Accepted displayed answers are A/C/D/A/D/B; options were
not reordered. The historical CDS-prefixed Q75 ID remains intact with its
correct CSE source identity. No raw record, historical snapshot or answer was
rewritten.

Added bounded West Asian forums and Gold mobilisation subparts. GCC retains
its negative-membership stem. Gold schemes retain all three printed objectives,
including the incorrect FDI statement; their purpose is not bond yield alone.
Gold mobilisation and MUDRA share government-initiative placements without
duplicating records. BRI is classified by international cooperation, and shale
gas by resource basins rather than current commercial production.

Totals: 218 approved imports, 1,737 historical records, 1,704 eligible unique
mapped MCQs and zero eligible unmapped. Registry: 9 subjects, 51 sections,
178 chapters, 1,073 subparts. Physical Geography 11/92 and seven Current Affairs
sections remain unchanged. CSE 2016: 75 reviewed (52 imports/23 reuses), 25
pending. Overall: 375 source slots reviewed and 9,025 pending across 74 PDFs.
Only CSE 2013–2015 are complete; classification decisions do not establish
complete source reproduction verification.

Build and all 160 automated tests pass. Import and source-coverage freshness
checks pass. The progress report confirms the original bank hash is unchanged.
No browser or PDF visual regression rerun is claimed for this batch. Continue
at Q76 on English PDF page 29. Wider imports, editorial work, source follow-ups
and database parity remain open. No push, deployment or production import.

## Milestone 53 — CSE 2016 Q76–Q80

Complete English PDF page 29 and corresponding Series A Q76–Q80 key cells
were visually compared and reread. Four imports Q76/Q78/Q79/Q80 and one
canonical reuse Q77; accepted displayed answers C/B/D/D/D with no option
reordering. Q78's codes continue at the top of the right column. Retain Q77's
historical CDS-prefixed ID, correct CSE source identity and complete current
transcript; do not treat the noisy legacy rawQuestionText fragment as the
displayed source. No raw-bank or saved-attempt rewrite.

Added a bounded Energy efficiency subpart for appliance-label coverage rather
than forcing the question into food labelling or generic electrical mechanisms.
Pension inclusion shares the government-initiative home, and ITER shares
nuclear physics and experimental facilities. The one-family-member pension
claim, fission/thorium alternatives and incorrect Taniyurs description remain
as printed. No current policy changes or unsupported event dates are inferred.
Historical institutional terminology is placed in regional/local administration;
a passing temple reference does not create an architectural placement.

Totals: 222 approved imports, 1,741 historical records, 1,708 eligible unique
mapped MCQs and zero eligible unmapped. Registry: 9 subjects, 51 sections,
178 chapters, 1,074 subparts; Physical Geography 11/92 and Current Affairs seven
sections unchanged. CSE 2016: 80 reviewed (56 imports/24 reuses), 20 pending.
Overall: 380 source slots reviewed, 9,020 pending across 74 PDFs. Only CSE
2013–2015 are complete. The separate frozen 204 answer cohort is unchanged.

Build and all 161 automated tests pass. Source/import freshness checks pass;
the progress report confirms the original bank hash is unchanged. New tests
check preserved false statements, all four imported keys, both shared homes,
unique snapshot membership and scoring. No browser/PDF visual regression rerun
is claimed. Continue with Q81 on English PDF page 31. Wider source review,
imports, editorial follow-ups and database parity remain open. Nothing pushed,
deployed or imported into production.

## Milestone 54 — CSE 2016 Q81–Q85

Complete English PDF page 31 and Series A Q81–Q85 key cells were visually
compared and reread. Two imports Q82/Q84 and three canonical reuses Q81/Q83/Q85
are cleared for this source review. Accepted displayed answers A/B/C/C/B; no
option reordering. Q83 codes continue at the top of the right column.

Preserve the printed all-UN-member Solar Alliance proposition, examination-time
river-linking question and drip-irrigation salinity claim. The European Stability
Mechanism's printed EU-agency wording is retained, not editorially rewritten.
DigiLocker has both e-governance and government-initiative homes; its public
digital-service task does not justify an unrelated computing-protocol placement.
No new taxonomy areas or raw-record changes were needed.

Totals: 224 approved imports, 1,743 historical records, 1,710 eligible unique
mapped MCQs and zero eligible unmapped. Registry stays 9 subjects, 51 sections,
178 chapters and 1,074 subparts. CSE 2016: 85 reviewed (58 imports/27 reuses),
15 pending. Overall: 385 source slots reviewed and 9,015 pending across 74 PDFs.
Only CSE 2013–2015 are complete. Physical Geography 11/92, seven Current Affairs
sections, prior exclusions, original bank and historical attempts are preserved.

Build and all 162 automated tests pass. New API coverage checks both imported
keys, unique selection, the two DigiLocker homes, exact accepted ESM option
text and location-independent document access. Source coverage freshness passes.
No browser or PDF visual regression rerun is claimed. Continue at Q86 on
English PDF page 33. Broader imports, source/editorial follow-ups and database
parity remain incomplete. No push, deployment or production import.

## GitHub checkpoint — 22 October 2026

Prepared the reviewed syllabus, classification, import and historical-grading
safeguards for the existing codex/pyq-selection-flow branch at the user's request.
Finished reconciling the previously pending CSE 2016 Q86–Q90 source edits:
three imports Q87/Q88/Q89 and two reuses Q86/Q90, keys B/D/C/D/D across the
five source questions. Q90 receives only a closing-quote restoration; no words,
options, answer or historical scoring change. Original bank hash is unchanged.

Current local checkpoint: 227 imports, 1,746 historical records and 1,713
eligible mapped questions. CSE 2016 has 90/100 source slots reviewed (61 imports,
29 reuses); 10 remain pending. Overall 390/9,400 slots reviewed, 9,010 pending.
Build and 162 automated tests pass. Full editorial/source review is not complete;
browser/PDF visual regressions were not rerun for this checkpoint. Temporary
renders, downloaded PDFs and QA exports stay local. No production database import
or production-branch merge is included. Continue one exam at a time, starting by
finishing CSE 2016 Q91–100 before moving to another source paper.
