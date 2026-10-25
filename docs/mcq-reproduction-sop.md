# MCQ Reproduction SOP

## Purpose

This is the permanent standard for reproducing previous-year MCQs in the attempt view, result review and printable PDF. The objective is faithful presentation of the official paper, not editorial rewriting.

Version 2.0 · 25 October 2026. Use within the [standing paper-processing
SOP](paper-processing-sop.md). Answer adjudication follows the
[exception SOP](ambiguous-mcq-sop.md); release follows the
[paper checklist](paper-release-checklist.md).

## Non-negotiable source contract

1. Treat the stored question text, option text, option keys, official answer, exam, paper, year and original question number as immutable source data.
2. Never paraphrase, spell-correct, modernise punctuation, renumber an item or silently repair suspected OCR text during rendering.
3. Preserve the source marker system exactly: `1.` remains `1.`, `1)` remains `1)`, `I.` remains `I.`, and `I)` remains `I)`.
4. Preserve option order and labels exactly. Presentation logic must not infer or change an answer.
5. When structure cannot be identified with high confidence, show the original text as plain text and flag the record for editorial review. A conservative fallback is preferable to an incorrect reconstruction.
6. Source preservation does not freeze a known incorrect import forever. Restore
   verified source material through a hash-guarded reviewed overlay, retaining
   raw before-values, canonical IDs and historical snapshots. Never repair it
   silently inside a rendering function.

## Canonical rendering rules

Apply these rules in order. The same formatter must be used online, in results and in PDF export.

### Statements and ordinary lists

- A sequential Arabic or Roman list that begins at 1/I and contains at least two items is structural.
- Put every item on a new line with a dedicated marker column.
- Keep the introduction above the list and the instruction or question after the list on its own line.
- Do not treat isolated years, quantities or a single numbered reference as a list.
- Keep the original marker characters and case.

### Match-the-following and two-list questions

- When both `List-I` and `List-II` are present with sequential members, render one aligned two-column table.
- Retain both original list headings and their parenthetical titles.
- Keep the original labels on both sides: A/B/C/D, 1/2/3/4 or I/II/III/IV as
  printed. Do not convert Roman right-hand labels to Arabic or impose letters
  where the source uses another marker system.
- Retain any printed `Code:` instruction after the table; it must never be swallowed by parsing.
- If either list is incomplete or ambiguous, retain the original source lines instead of fabricating a table.

### English, shared passages and common directions

- Preserve the exact underlined expression, blank position, punctuation and
  error-identification segments. Underlining is question data, not decoration
  inferred from an answer or an explanation.
- Preserve paired-word rows and their original option/column relationship.
- Keep shared passages and directions linked to their source question range.
  Each question retains its own canonical/source number and must include or
  reference the necessary common material in standalone practice and PDFs.
- Never attach the next question's text as a continuation or omit a passage
  merely because it appeared on a preceding page.

### Equations, figures, maps and graphs

- Preserve signs, units, superscripts, subscripts, vector markers and labels.
- Use original required figures/crops with original page references and hashes;
  preserve every answer diagram if options are figure-based.
- Verify readable axes, ticks, legends and map labels at online and print sizes.
- A missing required asset blocks incomplete printing; fonts being ready alone
  does not establish that diagrams have loaded and decoded.

### Options

- Render each option as a separate row with its stored key.
- Keep the option block with the question where practical, but never shrink text below the print standard to force a fit.
- Do not convert an option that happens to contain a list into a question-level list.

## PDF composition

- Use two newspaper-style page columns for the paper, not for the internal structure of one MCQ.
- Keep statement markers aligned and list-table columns readable within the page column.
- Avoid a page or column break inside a match table. Avoid separating a question heading from its prompt.
- Permit a long question to continue naturally rather than leaving excessive blank space.
- Put the optional answer key on a separate final page as a compact table.
- Use a compact paper/section title for a full-paper export, not a dump of every
  syllabus leaf in the header. Let a long answer key continue onto final pages.
- Preserve official provisional or independent-verification labels and all
  officially accepted options; do not print a forced letter for withdrawn items.
- Browser-generated URL/date headers and footers are not document content; the export UI must tell the user to disable them.

## Intake and review procedure

1. Import the source verbatim and retain its stable question ID and source reference.
2. Compare the stored stem and options with the official paper before publishing.
3. Run the shared structural formatter. Do not add question-specific display HTML.
4. For a new structural pattern, add a minimal general parser rule plus a de-identified regression fixture.
5. Review the online attempt view and printable PDF for that fixture.
6. Record uncertain OCR or layout cases for editorial review; do not silently guess.
7. Reopen the original for a distinct second visual pass covering every stem,
   option and required asset; record reviewer/method/date honestly.

## Required automated checks

- Flattened Arabic statements become separate lines.
- Roman statements remain Roman and retain `.` or `)` punctuation.
- Isolated numbers are not split.
- Match-the-following questions form an aligned table.
- Trailing `Code:` instructions survive table parsing.
- Prompt text and options are neither omitted nor duplicated.
- The online view, result review and PDF call the same formatter.
- Answer-key question numbers still map to the unchanged source question IDs.
- Roman right-hand matching labels, underlining, paired-word tables, shared
  passages and mathematical notation survive online, results and PDF views.
- Original figures load/decode before printing; missing or delayed figures do
  not produce an incomplete automatic or manual print.

## Release checklist

- Run the full test suite and production build.
- Export a representative paper containing: an Arabic statement question, a Roman statement question, a normal list question, a match-the-following question and a long option set.
- Render every exported PDF page to images and inspect for clipping, overlap, missing markers, broken tables and accidental blank space.
- Extract PDF text and compare the question/option content with stored source data.
- Do not release when any question wording, marker, option or source reference differs from the stored record.
- Compare the stored record itself with the source, not only render output with
  an unreviewed transcript. Verify every printed key cell against reviewed answer
  evidence and test all accepted/nonaccepted options through actual grading.
