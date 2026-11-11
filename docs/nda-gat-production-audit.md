# NDA GAT final production audit

Audit date: 11 November 2026

## Release inventory

- 25 original NDA GAT paper sets
- 3,750 source question slots
- 3,742 eligible practice questions
- 8 officially withdrawn questions
- zero quarantined questions
- four launch snapshots per paper: full paper, English, Science and General Studies

The source PDFs remain the authority for wording, option order, figures and
question numbering. An eligible count below 150 therefore represents an
official withdrawal, not an unprocessed source slot.

## Automated release gate

`tests/browser/nda-gat-production-audit.spec.ts` is the collection-wide browser
gate. It loads the same reviewed paper and policy files used by the application
and checks every paper rather than relying on a hand-maintained sample.

For each paper the gate verifies:

- its Sources row, eligible count, original-paper link and withdrawal note;
- full-paper and English, Science and GS launch membership and source order;
- unique question membership and absence of answer leakage in launch snapshots;
- exclusion of every officially withdrawn question;
- printable question and answer-key counts;
- successful decoding of every retained source figure;
- generation of a real, non-empty PDF;
- desktop and mobile document containment; and
- absence of browser page errors.

## Audit correction

The audit found that NDA I 2014 was complete in reviewed data but was omitted
from the Sources complete-paper set and the generic original-paper route. Its
row consequently exposed only a 49-question subset and no full-paper launch.
The release now registers all 150 source slots, exposes 149 eligible questions,
records Q150 as officially withdrawn, and provides the full and sectional
launches.

## Verification record

- Production build: passed locally on 11 November 2026.
- Collection-wide browser gate: 26/26 passed in one uninterrupted run (2.9 minutes).
- Full repository regression suite: 278/278 passed with zero failures.
- Public production revision `0bbbe23`: 26/26 browser scenarios passed against
  `https://upscpuraan.vercel.app` in one uninterrupted run (6.9 minutes).

The audit is closed. Any later change to a reviewed GAT paper, its launcher,
print/PDF output or Sources registration must pass this collection-wide gate.
