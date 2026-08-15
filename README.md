# UPSCPuraan

UPSCPuraan is a minimal, mobile-first UPSC CSE, CAPF, CDS and NDA test-series
PWA. Visitors can browse the catalogue and attempt a guest test immediately.
Google sign-in is optional and adds cloud history, saved recipes and
cross-device resume.

The production target is GitHub + Vercel + Supabase PostgreSQL. The bundled
question bank contains 1,519 source-preserved PYQs. They are imported as
editorial-review records; only verified, explanation-complete questions can be
published into student tests.

## Local development

Prerequisite: Node.js 22.13.0 or newer.

    npm install
    npm run dev
    npm test
    npm run build

Without Supabase variables the app remains usable as a local anonymous demo.
Server APIs intentionally return a clear DATABASE_UNCONFIGURED response
instead of exposing a client-side database secret.

## Supabase and Vercel setup

1. Create a Supabase project and configure Google under Authentication /
   Providers. Add https://upscpuraan.vercel.app/auth/callback (and the local
   callback URL) to the provider redirect allow-list.
2. Run supabase/migrations/0001_upscpuraan.sql and
   supabase/migrations/0002_taxonomy.sql in the Supabase SQL editor, followed
   by supabase/seed/exam-papers.sql.
3. Add the variables in .env.example to the Vercel project:
   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL,
   DATABASE_POOL_SIZE, and NEXT_PUBLIC_APP_URL. DATABASE_URL is server-only
   and must never be prefixed with NEXT_PUBLIC_.
4. Check the canonical geography backfill and import the existing bank in
   dry-run mode, inspect both reports, and then apply it from a trusted machine:

       npm run content:taxonomy

       npm run content:import
       npm run content:import -- --apply

   The taxonomy backfill uses `upsc-geography-v1.1` and maps 1,017 current
   records by source identifiers. Unmatched rows remain unrestricted until
   editorially mapped. The import preserves exact PYQ stem/options, upserts
   canonical taxonomy columns for existing records, and uses a source
   fingerprint to detect duplicates. All existing records start as review and
   unverified.
5. Sign in once, then promote the first editorial account in Supabase:

       update public.profiles
       set role = 'admin', updated_at = now()
       where email = 'your-editor@example.com';

6. Deploy the main branch from Vercel. Configure a custom domain only after
   UPSCPuraan trademark and domain checks are complete.

## Routes

- Public: /, /exams/[exam], /subjects/[subject],
  /pyqs/[exam]/[year]/[slug], and the legal/source pages.
- Student: /app, /app/build, /app/tests/[id],
  /app/results/[id], /app/attempts, /app/saved.
- Editorial: /admin, /admin/imports, /admin/questions/[id],
  /admin/review, /admin/history.

Attempts and results are deliberately excluded from the sitemap and marked
noindex. Published PYQ explanations can be indexed; generated-MCQ answers
remain protected.

## Content and API notes

POST /api/tests creates an immutable, deterministic question snapshot and
returns 409 with shortage details when the recipe cannot be fulfilled.
Answer autosave, deadlines, submission, scoring and ownership are enforced on
the server. All subjects, All types and All subsections are unrestricted
defaults, while Mixed deliberately cycles through Easy, Moderate and Hard
pools. Subsection IDs are canonical and use OR semantics.

Use scripts/import-questions-to-supabase.mjs for batch imports. The admin
import endpoint supports dry-run validation; editorial PATCH operations record
every change in editorial_events and prevent edits to source-locked PYQ text.

## Deployment checks

    npm test
    npm run build
    node scripts/import-questions-to-supabase.mjs

Before public launch, run the acceptance matrix in the production plan:
Google onboarding and role boundaries, shortages, deterministic snapshots,
timer/timeout recovery, exact PYQ rendering, PWA install/offline behavior,
accessibility, and load tests representing 5,000 registered students.
