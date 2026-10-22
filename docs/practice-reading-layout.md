# Reading-first question paper

Implement the latest full-paper reference, not the withdrawn progress-header
request. Existing header, timer and answered-progress semantics stay unchanged.

Desktop: a wide white question card on the left, sticky question palette on the
right, subject/topic pills, text-size controls, source attribution, full-width
stacked answer options and Previous / Save for later / Next controls. Use neutral
unanswered, green answered, blue current and amber saved states with a legend
above the number grid. Label unanswered honestly; do not claim visit tracking.

Mobile: keep the palette above the card, collapsible using the existing toggle.
Preserve source text, tables and maps, original option order, selection, local
bookmarks, timing, scoring and historical exclusion behaviour. No question or
attempt schema changes. Numbered statement columns expand for Roman numerals.

Verification: build and 163 automated tests pass. Six focused browser checks
cover desktop left/right geometry, stacked full-width options, bookmarks and
answered states, widths through 320px, palette toggle, editable answers and
submitted results, unfinished-result access, timer expiry/reload, failed grading
and storage recovery. Desktop and mobile screenshots were visually inspected.

## Compact spacing revision

Reduce the desktop canvas to 1,380px, card padding to 18px/20px, header gap to
16px, option gap to 8px and short option rows to 52px (previously 72px). Use
20px question/16px option text at the default size, retaining A-/A/A+ controls.
Tighten source, choice-panel and footer spacing and shrink the side palette.
Mobile rows retain at least 48px height. No answer or timing behaviour changes.

Build and 163 automated tests pass. Browser checks cover answer/submission and
desktop/mobile reading layout; explicit assertions bound option height, option
gaps and card padding to prevent oversized whitespace returning.
