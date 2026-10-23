# Test cart

The right panel contains only explicitly added syllabus parts. Browsing does not change its contents. An empty cart has zero MCQs and cannot open setup.

The accepted Minimal layout shows each item's name, parent syllabus path, matching MCQ count and Remove action. Compact exam-source chips above the items show the whole-test exam breakdown, avoiding repetition on every item. The unique total and Finalise test share one footer row. Fully covered branches coalesce using the existing selection helpers; the total is a union of canonical question IDs, not a sum of item counts.

Exam sources apply to the whole test and carry into subsequent additions. Disabling every source retains the added parts while disabling Finalise test. Clear all removes the parts without changing the open folder or source preferences.

Finalise test opens the existing online/PDF setup dialog. Snapshot generation, saved-draft membership protection and question eligibility gates are unchanged. No content or database migration is required.

Verification: 163 automated tests; library browser checks covering navigation independence, overlap deduplication, cross-subject PDF export, source filtering, restoration, setup cancellation and mobile panels. A separate empty-cart test verifies source preferences before the first addition.
