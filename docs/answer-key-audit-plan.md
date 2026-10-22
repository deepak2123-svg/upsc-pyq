# Exhaustive question and answer-key audit

Date: 2026-10-18. Scope: every one of the 1,519 published question-bank records, including the 309 unclassified records. Exams: CSE 485, CAPF 241, CDS 313, NDA 480. Original stems, options, source hashes and IDs are preserved unless a separately evidenced reproduction defect is identified.

## 1. Inventory and reproducible evidence

Freeze the starting answer and source-text/option hashes for every record. Group by exam, year, paper and answer-source document. Inventory existing official papers, keys, source manifests, rendered cells, clean transcriptions and prior audit files. Treat prior status labels and imports as leads, not new verification. Build one ledger row per published ID and reconcile ledger coverage to the frozen inventory.

## 2. Exact paper and series alignment

Prefer the final UPSC key. Record its URL, document identity, booklet series, printed question number and answer cell/page. For mirrored official PDFs retain official attribution and distinguish them from coaching keys. Resolve scanned cells visually where needed. Never transfer a letter from another series by question number alone; a cross-series transfer requires a matched stem and all four options, with an explicit option-text mapping. Record dropped/multiple-answer questions as such rather than forcing a single key.

## 3. Independent comparison and reasoning

Compare each published stem and its A–D options to independent available transcripts. Normalize only whitespace, typography and unambiguous mathematical display for comparison; retain original strings in the bank. Rank exact identity and exact option matches ahead of fuzzy matches. Fuzzy matches and agreement between derivative copies alone do not establish official verification. For a missing official key, solve all options against authoritative subject references, taking exam-year context into account. Store the selected option, concise reasoning, references, confidence and unresolved ambiguity. Distinguish official-key verified, independently corroborated, editorially reasoned and unresolved results.

## 4. Review and correction

Prioritize the reported NDA 2021 II Q65/Q85 and NDA 2014 II Q75, then all records sharing suspect key sources. Investigate source-wide series mismatches rather than assuming isolated errors. Generate proposed corrections separately. Apply only proposals supported by reviewed evidence. Retain previous answer, new answer, reason, provenance and audit date; never silently relabel a secondary source as official. Do not change an answer merely to agree with a user's selected option.

## 5. Runtime consistency

Maintain answer-key revisions for every changed record without exposing answers in the pre-submission client. Refresh stale completed-attempt feedback on reopening, preserving the user's answers and paper order. Use the corrected bank for online grading, results, retakes and regenerated PDF answer keys. Existing downloaded PDFs must be regenerated.

## 6. Verification, reporting and release

Require complete, unique 1,519-ID ledger coverage; valid answer letters; unchanged stems/options/hashes; evidence for every correction; and distinct review statuses. Test all corrected keys through the grading API, revision invalidation, representative old completed results and PDF export. Run the build and existing tests. Publish the correction commit after validation and verify the production API against the correction set.

Deliver a readable audit report plus machine-readable ledger and correction list. Report counts by exam, evidence tier, corrected/confirmed/unresolved outcome and source mismatch. An inventory scan or agreement with an old import is not a completed answer audit. Any questions still lacking defensible evidence remain explicitly unresolved, with the precise remaining work recorded.
