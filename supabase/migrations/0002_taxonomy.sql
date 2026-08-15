alter table public.questions add column if not exists taxonomy_version text;
alter table public.questions add column if not exists taxonomy_head text;
alter table public.questions add column if not exists taxonomy_chapter text;
alter table public.questions add column if not exists taxonomy_subtopic text;
alter table public.questions add column if not exists taxonomy_id text;

alter table public.questions drop constraint if exists questions_generated_taxonomy;
alter table public.questions add constraint questions_generated_taxonomy
  check (origin <> 'generated' or workflow_status <> 'published' or taxonomy_id is not null);

-- After applying this migration, run `npm run content:import -- --apply` to
-- backfill the canonical IDs for the existing question bank. Unmatched rows
-- intentionally keep these columns NULL and remain available unrestricted.

create index if not exists questions_taxonomy_filter_idx
  on public.questions (taxonomy_version, taxonomy_head, taxonomy_chapter, taxonomy_id);

comment on column public.questions.taxonomy_id is 'Stable canonical subtopic ID from the versioned UPSC taxonomy registry.';
