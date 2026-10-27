# NDA I 2024 GAT — release report

27 October 2026. Series A, RRAN-A-GAT, examination I (not inferred from Paper II).

## Reconciliation

- Every source number 1–150 processed: 128 new occurrences, 22 reused IDs,
  zero duplicate aliases. Existing CDS-prefixed Q144/Q147 IDs remain unchanged.
- Dispositions: **149 official-final + 1 officially withdrawn (Q101) = 150**.
  No provisional, reasoned, duplicate, quarantined or awaiting-review records.
- Scored sections: **English 50; Science 49; GS 50**, including defence World
  History Q94. One official Science withdrawal is not a missing import.
- No changed keys or material content repairs among the 22 reused records.
  Raw records, submitted answers, snapshots and prior content revisions remain intact.
- Eight source figure assets; complete cloze/reading passages, English underlines
  and matching codes retained. Second reproduction pass corrected draft Q53 A/B
  from 150/1500 C to the printed 1·50/150 C before any publication.
- The local scan is a 28-page English extract. All English MCQs are present;
  Hindi counterpart pages/back instructions are not claimed to be present.
  PDF 2–9 maps to printed 2–9; PDF 10–28 maps to printed 11,13,…47.

## Authority and review

Matching key downloaded directly from
<https://www.upsc.gov.in/sites/default/files/AnsKey-NDA-NA-I-2024-GAT-041124.pdf>.
SHA-256 `b5cfe7945aa5d45ca45d7b0873ed6b24963ffd70b0251577027b166cc8f4236d`.
Four booklet-series pages; Series A page 1 governs these original-order options.
All 150 cells visually transcribed column-first and row-first; programmatic
comparison agrees. Q101 is X. No multiple accepted cells. Filename date is
recorded separately; no unsupported release date inferred from scan metadata.

The official key is the scoring authority. Academic re-solving is neither a
publication requirement nor a reason to suppress a faithfully keyed question.
Two reproduction passes and fresh classification review were by the same AI
reviewer, not independent human review. Frozen input/source hashes guard approval.

## Classification and counts

- Complete primary placements plus reviewed material overlaps, including Q143
  Economy Current Affairs/Polity/Economy mirror and Q139 ancient trade/geography.
- New bounded leaves: traditional units/measures, relativity/gravitational waves;
  defence-only modernity/social transformation. Existing Physical Geography's
  11 chapters/92 subparts and NDA Science chapter numbering remain unchanged.
- No automatic NDA English, Physics/Chemistry/Biology or World History transfer
  into CSE. English/Science/World History concepts reviewed for NDA/CDS separately.
- CSE-compatible GS unique inventory: **1,967 → 1,994 (+27)**. NDA English:
  **246 → 296 (+50)**. Overlapping subject totals are not summed.

## Local gates

- Production build and full automated suite: 204 passed, 0 failed.
- All 600 selected-option decisions checked against official scoring, including
  nullable/excluded Q101. Exact eligible membership and no answer leakage tested.
- Six browser scenarios cover rapid navigation, reload/submission/results,
  three sections/mobile, PDF, missing-image protection and historical withdrawal.
- Nine existing-flow browser regressions passed (NDA I 2025, preparation selector,
  separate carts, empty topics/mobile and delayed/missing print assets).
- PDF: 149 answer cells compared with reviewed key; eight decoded figures;
  all 19 rendered local pages inspected, with detailed table/circuit/graph checks.
- Deterministic builder, source/before/asset hashes and taxonomy check required.
- Changed new scripts/tests/source page ESLint: 0 errors. Catalogue's existing
  anonymous-default-export warning is unrelated. Global TypeScript baseline
  remains separately reported rather than calling it a clean typecheck: existing
  admin import, D1 examples, optional-parent lookups, worker globals and old tmp
  baseline files fail. No new-paper test/source error remains. The catalogue's
  explicit type now retains optional string taxonomyVersion for server snapshots.
- Initial full-suite failures were stale exact inventory expectations (1994/296);
  updated only after reconciling +27 GS/+50 English. Browser result-row assertion
  corrected from previous paper's 137 to this paper's 150 including table header.

## Release gate

**Live verified**, 27 October 2026. Data commit
`5c0efdea5d819aaaf748d9205fbb0a336035cbb0` pushed by normal fast-forward to
main and codex/pyq-selection-flow. GitHub's Vercel status reported success for
that exact SHA; deployment `et1NWtDtfCZki48jDLbrC4qT35te`, project upscpuraan,
team deepakkarnal321-1406s-projects. Public app: <https://upscpuraan.vercel.app>.

`node scripts/check-nda-2024-i-release.mjs https://upscpuraan.vercel.app`
passed: 149 eligible, Q101 absent from new inventories, all 600 option decisions,
eight served figure hashes, official-key asset SHA-256 and Sources disclosure.
Production English count is 296. All six production browser scenarios passed,
including saved answers/reload/results, section membership/mobile, withdrawn
historical review and required-image failure blocking print.

Production PDF: 20 pages with deployed fonts (local export: 19). All 20 pages
rendered/visually inspected; all 149 source numbers present, Q101 absent, all
eight figures decoded and all 149 printed answers compared with the reviewed key.

Vercel connector requires reauthentication. Public GitHub commit status plus
live API/browser/asset checks establish the release; authenticated runtime logs
and drains were not available or inspected. No clean-log claim is made.

No database migration/import, infrastructure mutation, credentials change or
unrelated paper. Only reviewed overlay/assets, supporting classification, tests
and this report are released. The report follow-up changes no runtime content.
