# Physical Geography MCQ Audit

**Audit date:** 16 October 2026  
**Inventory audited:** 363 questions (CSE 50, CAPF 70, CDS 55, NDA 188)  
**Scope:** reproduction and representation, verbatim integrity, and answer-key correctness  
**Audit disposition:** **Conditional fail — three representation defects are resolved, one incomplete source question remains quarantinable, and most answers still lack first-party official-key provenance.**

## Remediation status

| Work item | Status | Evidence |
|---|---|---|
| Legacy coordinate/angle notation in `cds-2015-1-37`, `cds-2016-2-31`, and `cds-2016-2-46` | Resolved | Shared presentation formatter now converts the imported TeX subset to `°`, `′`, and `″` without modifying locked source text or hashes. Automated regression tests cover coordinates and angles. |
| Flattened numbered statements containing dates, including NDA 2016 I Q91 | Resolved | Sequence parsing now ignores date punctuation such as `March 21.` and renders the genuine 1–4 statements separately. |
| Ordinary questions splitting between PDF columns | Resolved | Printable question blocks now avoid column/page breaks when the complete block fits. |
| `cds-2015-1-10` missing List II map | Open - critical | The retained record and parent dataset both omit the map. A secondary full-paper scan confirms that List II is a numbered map, so the question cannot be reconstructed faithfully as text alone. Secondary answer sources also conflict between options A and B. It must remain excluded until the original map and authoritative key are recovered. |
| First-party answer-key verification | Open | Internal consistency is complete, but official-key provenance remains incomplete as detailed below. |

**Remediation build:** `9a4a0f3` (`Clarify test modes and fix printed MCQ formatting`)
**Regression result:** 50 automated tests passed, including the new notation and date-containing statement cases.

## Executive finding

The current Physical Geography bank is structurally sound and the practice/PDF formatter handles the overwhelming majority of questions correctly. Every inventory record rendered, every question has four usable options, and every stored answer points to an available option. Statement questions, numbered lists, Roman-numeral lists, and 14 complete two-list questions are represented by the structured formatter.

The bank must nevertheless not be certified as fully accurate yet:

- One match-the-lists question is incomplete in the retained source itself and depends on a missing map.
- The three previously identified LaTeX display defects are fixed in the renderer and protected by tests.
- All 363 answers agree across the website bank, its parent dataset, and the answer ledger, but this is a consistency result rather than independent proof of correctness. Only two records in this inventory are explicitly backed by an official provisional key in the current ledger.

## Coverage and method

The audit joined each Physical Geography question by stable question ID and by exam/year/paper/question identity across:

- the live website question bank;
- the Physical Geography migration/review manifest;
- the retained CSE, CAPF, CDS, and NDA source datasets;
- the answer-verification ledgers; and
- the full-PDF re-audit records.

For reproduction, the audit also passed all 363 questions through the same structured question formatter used by the application, generated one 34-page A4 two-column paper, checked question presence and page overflow mechanically, and inspected first, middle, and last rendered pages.

## 1. Reproduction and representation

### Passed

| Check | Result |
|---|---:|
| Questions rendered | 363 / 363 |
| Empty rendered questions | 0 |
| Questions outside page bounds | 0 |
| Structured prompts detected | 138 |
| Complete match-list tables rendered | 14 |
| Internal source tokens retained by formatter | 363 / 363 |
| Missing/invalid A–D option sets | 0 |
| Replacement-character corruption | 0 |
| Physical Geography questions requiring a missing figure | 0 |

The sampled PDF pages showed readable two-column flow without clipping or overlap. Numbered statements begin on separate lines, and complete match-list questions render as tables. The final audit page naturally contains unused space because it is the last page; this is not a pagination failure.

### Defect disposition

| Severity | Question | Status | Evidence / required action |
|---|---|---|---|
| Critical | `cds-2015-1-10` | Open | The prompt stops after the List-II heading. A recovered secondary scan shows that List II is a world map numbered 1–4, not four missing text labels. Secondary sources conflict on whether option A or B is correct. Restore the original map asset and mark `requiresFigure`, and verify the answer against an authoritative key; otherwise exclude the question. |
| High | `cds-2015-1-37` | Resolved | Imported coordinate markup now displays with conventional degree and prime symbols. |
| High | `cds-2016-2-31` | Resolved | Imported coordinates now display with degree, prime, and double-prime symbols. |
| High | `cds-2016-2-46` | Resolved | Option A now displays `180°` correctly. |

## 2. Verbatim integrity

### Results against the retained source datasets

| Check | Result |
|---|---:|
| Source record found | 363 / 363 |
| Stem byte-for-byte identical | 329 / 363 |
| Formatting/whitespace-only stem differences | 32 / 363 |
| Substantive notation/display differences | 2 / 363 |
| Options byte-for-byte identical | 362 / 363 |
| Substantive option notation/display difference | 1 / 363 |
| Stored answers identical | 363 / 363 |

The 32 formatting-only stem differences remain token-equivalent and do not alter wording. The two substantive stem differences and one option difference are the three LaTeX representation defects listed above.

`cds-2015-1-10` is technically faithful to the retained parent record, but that parent record is incomplete. It therefore fails the higher standard of faithful reproduction of the original examination paper.

This audit can establish fidelity to the retained datasets. It cannot certify every word as identical to the official printed paper until every one of the 363 records is compared directly with a first-party scan or official PDF. The current local official-paper collection is incomplete for the older CDS material, including the critical 2015 question.

## 3. Answer-key correctness

### Consistency checks passed

- Website answer equals the retained parent-source answer: **363 / 363**.
- Website answer equals the verification-ledger displayed answer: **363 / 363**.
- Every answer is one of the question's available option keys: **363 / 363**.
- No duplicate or missing Physical Geography question identity was found.

### Evidence quality

| Evidence class in the current ledger | Questions | Audit interpretation |
|---|---:|---|
| Official provisional key cross-check | 2 | Strong first-party support |
| Year-wise solved-paper cross-check | 48 | Secondary cross-check, not an official key |
| CAPF external-key workflow | 70 | Consistent external evidence; official provenance must be confirmed per paper |
| CDS source record without per-question citation | 55 | Highest-priority answer re-verification group |
| NDA third-party/imported key evidence | 188 | Consistent, but not sufficient for first-party certification |

Accordingly, the answer column receives a **consistency pass** but not a final **official-correctness pass**. Agreement between copies of the same imported key is not independent verification.

## Release decision

Physical Geography should not yet receive a “fully audited” badge. The safe status is:

> **Structurally audited; four reproduction defects open; answer keys internally consistent but official-source verification incomplete.**

Before certification:

1. Remove or quarantine `cds-2015-1-10` from practice and PDF export until its original map is recovered.
2. Verify the 55 CDS answers first against official keys, followed by NDA (188), CAPF (70), and the 48 non-officially-supported CSE records.
3. Record the exact official paper/key filename and page for every verification; reviewer name, date, and result must be stored in the ledger.
4. Rerun the complete formatter audit and visually inspect every special-format question after source corrections.

## Audit rule going forward

A question is “fully audited” only when all three conditions are independently satisfied:

1. **Reproduction:** its structure and typography render correctly in the online attempt and exported PDF.
2. **Verbatim:** stem, lists, tables, options, symbols, and source metadata match the official question paper.
3. **Answer:** the keyed option is verified against an official answer key, or is explicitly marked as non-official with a documented adjudication when no official key exists.

Passing a database-to-database comparison alone must never be labelled as official verification.
