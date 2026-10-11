# PYQ practice selection

The public builder at `/` is an account-free, browser-local practice flow.
It uses the existing Book PYP question bank; this redesign does not import or
reclassify questions, change answers or hashes, add accounts, or add timed exams.

## Selection rules

- Subject cards include/remove that subject's classified subtopics.
- Choosing a section, topic, or subtopic replaces only its subject's scope.
- Breadcrumbs, Browse, and context expansion change the view, not the recipe.
- Add another topic previews additional unique questions, then explicitly merges
  the branch. Cancel leaves the recipe unchanged.
- A single subtopic-to-exams map is authoritative. Empty exam arrays retain a
  deliberately selected scope with no enabled sources.
- Existing leaf overrides survive replacement and addition. Newly selected
  leaves inherit sources currently enabled somewhere in their subject's selected
  eligible leaves; sources absent from those leaves retain entry-page defaults.
- `/` starts with all sources; `/exams/CSE` and other exam pages start strictly
  with that exam, even for branches containing zero questions from it.
- The matching inventory and requested practice size are separate. Size defaults
  to 20. Shortages require a smaller size or explicit Use all; All means exactly
  the current matching pool.

## Counts and compatibility

Inventory version 3 IDs include complete ancestry:
`subject → section → topic → subtopic`. Each question belongs to one leaf.
Parent totals conserve both complete counts and per-exam counts.

All-source reference counts are Geography 1,021; Physical Geography 363;
Physical Geography's Geomorphology 140; Earth Interior 41; Earth Interior plus
Weathering 117. Physical Geomorphology contains 12 CSE questions. Seven separate
Geomorphology questions remain under Other Geography.

`POST /api/practice-snapshots` accepts legacy, V2, and V3 recipes. Old leaf IDs
resolve through inventory aliases before filtering. V3 requires exact known
paths, selected subjects, available exam sources, a valid order, and an integer
size from 1 to 100 or `all`. Responses include `matchingCount` separately from
`questions.length`. Answers remain outside the practice snapshot.

Existing IndexedDB attempts and bookmarks keep their schema and snapshots.
The session-storage draft is versioned and validated against the inventory.
Creating practice freezes the visible recipe. Failed requests or failed local
storage retain the selection and prevent navigation to a missing attempt.

## Views and verification

Wide screens use four fixed Sankey columns with a sticky summary. Geometry uses
available inventory; coloured overlays use matching selections. Residual context
groups have real counts and expand without selecting them. Labels use native
controls and never scale down with the SVG. Smaller screens use a native nested
selector and persistent matching-count/Start bar, with an optional flow overview.

Run:

```sh
npm test
npm run test:browser
```

For an existing preview or staged release, set `PLAYWRIGHT_BASE_URL` to its
origin before the browser command; the suite then skips the local dev server.
Deployment protection must remain enabled where configured.

Browser coverage includes actual selection clicks, additions, source overrides,
shortages, draft restoration, exact posted recipes, old V2 attempt resume/retake,
request/storage failures, keyboard/reduced-motion use, long-label target spacing,
and 390/768/1024/1600px layouts. API tests cover count conservation, strict V3
validation, deduplication, and legacy compatibility.

The repository-wide TypeScript check currently has nine pre-existing diagnostics
in the admin importer, D1 example, legacy test services, taxonomy typing, and
Worker platform types. These are outside the selector redesign; changed selector
and snapshot files add no diagnostics.
