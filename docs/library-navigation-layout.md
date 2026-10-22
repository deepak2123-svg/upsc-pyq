# Library navigation and layout

- Align the global header with the 1,720px library workspace.
- Show subjects and folder contents in a single compact directory list with
  aligned exam counts and add actions. Collapse the source counts below the
  name on narrower screens; keep mobile actions and long labels usable.
- Show a semantic Folder path navigation above each open folder. Subjects and
  ancestors are clickable, the current location is marked, and the arrow
  retains the existing browser-history Back behaviour.
- Keep opening, adding and folding independent. Path navigation does not
  change selected questions or exam-source masks.
- Give the setup dialog visible Library/Methods back and Close controls in
  every mode. Closing preserves the selected MCQs and folder. Keep existing
  dialog Escape handling, focus restoration and busy-action protection.
- Use smaller setup headings and route cards without changing online/PDF
  workflows or question data.

Verification: build and 163 automated tests pass. Eleven focused browser checks
pass: clickable path, setup back/close, browser history/direct links, opening and
folding, responsive long labels (320–1,600px), cumulative/overlapping selection,
source masks, reload restoration, deepest subparts, keyboard and mobile panels.
Desktop, setup and mobile screenshots were visually inspected. No source,
classification, answer, snapshot or saved-attempt data changed.
