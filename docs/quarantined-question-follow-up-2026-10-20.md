# Follow-up: six quarantined questions

Date: 2026-10-20. Scope: the six remaining quarantined records in the frozen 204-record cohort. This is additional source-discovery work, not a new completed verification pass or a release approval.

## Outcome

No additional record cleared. The cohort remains 181 cleared and 23 held (3 withdrawn, 14 duplicates, 6 quarantined). All 204 have a recorded disposition; zero are still pending. Quarantine is not verification.

The matching NDA I 2025 official Series A GAT key was not recovered in this follow-up. This does **not** establish that UPSC has not published it.

## Source discovery

- [UPSC current answer-key page](https://www.upsc.gov.in/examinations/answer-key): the retrieved page displayed missing-module warnings and no available entries. Its empty response is not evidence of nonpublication.
- [UPSC answer-key archive](https://www.upsc.gov.in/examinations/answer-key/archives): the retrieved archive exposed a CISF 2026 entry, not the required NDA I 2025 key. Do not substitute NDA II 2025, another year, another series, or a coaching key.
- [ParikshaIndex NDA document index](https://parikshaindex.com/hi/exam/upsc-nda-na/): inspected solely for discovery of direct official links. Its 2025 entries led to question papers, not the missing answer key. It is not answer evidence.
- [Adhyyan download page](https://adhyyan.co.in/nda-2025-official-question-paper-answer-key-download/) linked [this coaching PDF](https://adhyyan.co.in/wp-content/uploads/2025/11/NDA-1-2025-GAT-A.pdf). Despite the page title, the PDF is not an identifiable UPSC-issued final key. Its Q90 and Q93 answers also conflict with the documented primary-source review. Rejected as verification evidence; no answer or status was changed from it.
- Search for the Bokaro/Rourkela wording located older NCERT reproductions, including [a third-party textbook mirror](https://ncert24.com/assets/ots/pdf/geography-ncert-class-12-india-people-and-economy.pdf). The indexed passage supports an NCERT-origin explanation of the intended Bokaro answer, but was not promoted to a newly authenticated, visually reviewed primary document. The current [NCERT legy208 PDF](https://ncert.nic.in/textbook/pdf/legy208.pdf) is **International Trade**, not the old Manufacturing Industries chapter. A filename alone must not be used to claim the old passage was verified.

## Record-specific release conditions

| Published ID | Actual NDA I 2025 question | Why held | Evidence sufficient to reopen review |
|---|---:|---|---|
| `cds-2025-2025-1-49` | 49 | Past and present finite-verb options can both be grammatical without temporal context. | Exact official key and an explicit ambiguity note; do not assert independent unambiguous reasoning. |
| `nda-2025-i-86` | 86 | Prime meridian alone versus a complete meridian circle changes the accepted combination. | Exact official key or authoritative clarification of the exam convention. |
| `nda-2025-i-87` | 87 | Paper prints amphibolite, a rock, in a mineral-abundance question. | Official answer decision with the printed defect retained and disclosed; do not silently substitute amphibole. |
| `nda-2025-i-91` | 91 | NCERT's stated Coriolis/pressure-gradient relationship conflicts with the physical force balance. | Official examination decision, retaining the textbook/physics disagreement in the evidence. |
| `nda-2025-i-94` | 94 | Odisha location is identifiable, but the highest-peak premise is defective. | Official decision plus a visible premise correction note, not a claim that every printed fact is true. |
| `nda-2025-i-100` | 100 | Intended Bokaro identification is supported, but establishment/collaboration chronology conflicts with SAIL's account. | Exact official decision plus chronology note, or an authenticated historical primary passage and a fresh option-by-option review that explicitly resolves the discrepancy. |

## Safeguards retained

No question-bank, answer, disposition, revision, saved answer, snapshot, database, GitHub, or deployment changes were made by this follow-up. The six remain excluded from new scored tests. The prior reconciliation and its validation results remain the baseline; this document does not relabel those earlier test runs as new runs.

Fresh targeted validation: `node --test tests/answer-key-audit.test.mjs tests/reviewed-grading.test.mjs` passed **7/7** tests, including exact cohort accounting, correction evidence, historical exclusions, and preserved source attribution. A new full build/browser run was not necessary for this documentation-only follow-up and was not performed.
