# NDA I 2026 GAT — online availability, not verification completion

25 October 2026. This release separates access to the complete original paper from eligibility for scored question-bank tests.

## What is online

- `/papers/nda-2026-i-gat`: all 150 original numbered questions, including English Q1–50. Twenty-four unmodified original page renders preserve wording, underlining, directions, option order, matching tables and figures. A question-number selector opens the appropriate original page; neighbouring questions remain visible.
- Unscored A–D answer recording, navigation, reload restoration and an explicitly unscored answer sheet. Choices are stored only in this browser and in a separate namespace; this is not a saved scored attempt or a verified answer key.
- Links from the NDA preparation library and the Sources card. The source card's MCQ count continues to mean available **scored GS** questions, not original-page availability.
- Twenty-four additional reasoned-verified Science imports, bringing this paper's freshly reviewed imports to 39. They use the existing bank/test/PDF paths and preserve the preparation-exam Science boundary.

## What is not finished

| Current source-review disposition | Questions |
|---|---:|
| Newly reasoned-verified in this paper review | 39 |
| Held after current review | 11 |
| GS questions awaiting current-source transcription/answer review | 50 |
| English questions awaiting structured import and answer review | 50 |
| **Total original source questions** | **150** |

The 24 pre-existing bank occurrences are within the 50 GS questions awaiting this fresh pass, not additional questions. This release does not certify their old keys anew. The scored library has 63 NDA I 2026 GS occurrences: 24 historical and 39 newly reviewed. All 150 are accessible in the original-paper view, but all 150 are **not** imported/verified for scored use.

No matching official NDA I 2026 GAT answer key was recovered from the official examination page or answer-key pages. The examination page was checked again on 25 October; it lists the question paper and written results but no answer key. The rejected secondary key is not used to fill gaps. Original-page availability is not an answer-verification disposition.

## Evidence and preservation

- Original: `C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2026-1.pdf`.
- Official source: https://www.upsc.gov.in/sites/default/files/QP-NDA-NA-I-26-GENERAL-ABILITY-TEST-130426.pdf
- Original SHA-256: `1cbcd118d94cf5068d8e060a49b9e17609b4c2e533eaeaa245da69b6883bc930`.
- Per-page hashes and complete 1–150 coverage: `content/nda-2026-i-source-pages.json`. The mechanical render script verifies the source PDF hash before rendering and checks all public asset hashes in `--check` mode. CI checking does not require the local PDF or Poppler.
- Detailed answer review: `content/audits/nda-2026-i-review.json`; batch-two reasoning and figures: `docs/nda-2026-i-batch-2-review.md`.
- Ambiguity procedure: `docs/ambiguous-mcq-sop.md` and its case template. All 11 held cases stay excluded from scored imports.
- Raw historical bank, original IDs, old submitted answers, historical snapshots and existing key/content revisions are unchanged. The original-paper recorder neither creates nor regrades historical attempts.

## Remaining work to finish the scored bank

1. Complete structured English import with faithful underlining, paired statements and directions. Independently check every option; several grammar items need an ambiguity decision, not a guessed key.
2. Complete Q101–150 current-source review, retaining existing IDs for the 24 old occurrences and recording any approved repair with its pre-change hash.
3. Resolve the 11 held questions through directly applicable evidence or retain a documented quarantine. An official key must not erase a genuine missing-condition defect.
4. Reconcile all 150 verified/held outcomes, classifications, counts and test exports. Do not call the scored paper complete until these checks pass.

## Release checks

- Final production build and **179 automated tests passed**, including original-page coverage/hash checks and all 39 reasoned-import grading checks.
- Five targeted browser scenarios passed: the original-paper recorder, both reasoned-batch online/print flows, exam-specific carts and mobile/empty-topic navigation. Original-paper checks cover English and Part B page mapping, held/reasoned/pending labels, Q150, answer restoration after reload, the unscored answer sheet and 390px layout.
- All deterministic import/review/placement/classification/coverage checks pass; the rendering manifest validates each published page hash and exact 1–150 coverage.
- React checks: native keyboard controls and labelled selectors, answer-free server decisions, separately versioned browser storage, no grading requests from the original-page recorder, no external PDF dependency to display questions.
- Existing build chunk-size warning remains. No claim that original-page publication completes the answer audit.

### Cold-production print follow-up

The first production browser run passed the full original-paper recorder and source/equation checks but exposed a diagram-loading race in the printable view. Its automatic print trigger waited for fonts and a fixed 250ms, not image decoding. The print client now waits for every required diagram plus fonts before enabling manual printing or invoking automatic printing. A missing diagram blocks printing with a visible reload message. Two additional browser regressions cover delayed and failed image responses; all seven distinct local browser scenarios have passed. The image-completion assertion now waits for actual readiness rather than sampling immediately after DOM insertion.

Production static-asset checks also confirmed all 24 source-page hashes, all 39 reviewed imports in the NDA inventory, and exclusion of the 11 held IDs. The Vercel app connector required reauthentication; the existing GitHub deployment status and direct public application requests supplied deployment confirmation instead. No production settings, secrets or database data were changed.

After the print fix deployed, the normal original-paper and both reviewed-batch production browser scenarios passed. The first fault-injection run encountered retired JavaScript asset URLs during the rollout, before the print check could run. Fresh public requests returned the new asset references. The two controlled fault tests were rerun in fresh contexts with service workers blocked specifically so Playwright can control the diagram response; both passed against production. This test-only setting does not disable the application's PWA. No CDN purge or caching-setting change was made. In total, five distinct production scenarios passed, with the intermediate failures and their handling retained here.
