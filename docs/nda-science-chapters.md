# NDA Science chapter organisation

Preparation taxonomy v1.2, 25 October 2026. This is a target-specific navigation
and chapter classification change, not an answer/content revision.

Physics has 18 chapters; Chemistry 12; Biology 17. Chapter numbers restart at 1
within each subject; subparts use chapter.subpart numbering in cards and the tree.
The authoritative ordered registry is `lib/nda-science-syllabus.ts`.

Each chapter explicitly declares its established concepts and finer empty topics.
For example, Optics belongs to Physics Chapter 12, not a combined Light and
Electricity bucket. Electrostatics and Current Electricity are Chapters 13 and 14.
Cell Biology, Genetics, Plant Reproduction and Human Respiration have separate
Biology chapters. Chemistry distinguishes mixtures/colloids, bonding, reactions,
acid-base chemistry, metallurgy and organic chemistry.

Chapter boundaries follow these declared concepts, not incidental words in a
question. Current technology, health/biotechnology and research branches remain
available in their existing locations; they are not forced into basic Physics,
Chemistry or Biology. There is no new miscellaneous chapter.

Existing concept IDs and question memberships are preserved exactly. The runtime
fails closed if an established concept is missing or listed twice. New finer
topics remain visible at zero until explicitly reviewed questions populate them;
this change does not pretend every empty subtopic has a classified MCQ.

Saved recipes operate on leaf IDs, not chapter titles. Frozen selections retain
their exact historical membership, and previous snapshots keep their original
labels. New NDA snapshots/results/PDFs use the new chapter labels. CDS, CSE and
the global GS syllabus remain unchanged. Parent counts remain unique unions.
