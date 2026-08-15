create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  role text not null default 'student' check (role in ('student', 'editor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id text primary key,
  exam text not null,
  year integer,
  paper text,
  source_question_number text,
  subject text not null,
  topic text not null,
  subtopic text,
  stem text not null,
  prompt_lines jsonb not null default '[]'::jsonb,
  options jsonb not null,
  correct_option text not null,
  explanation text,
  elimination_notes jsonb,
  origin text not null check (origin in ('pyq', 'generated')),
  source jsonb not null default '{}'::jsonb,
  source_fingerprint text not null unique,
  source_text_hash text not null,
  source_text_locked boolean not null default true,
  verification_status text not null default 'unverified',
  evidence jsonb,
  suggested_difficulty text,
  editorial_difficulty text,
  workflow_status text not null default 'draft' check (workflow_status in ('draft', 'review', 'approved', 'rejected', 'published')),
  requires_figure boolean not null default false,
  figure_key text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questions_published_explanation check (workflow_status <> 'published' or explanation is not null and length(trim(explanation)) > 0)
);

create table if not exists public.question_sources (
  id uuid primary key default gen_random_uuid(),
  question_id text not null references public.questions(id) on delete cascade,
  kind text not null,
  url text,
  label text,
  evidence text,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.exam_papers (
  id text primary key,
  exam text not null,
  paper text not null,
  year integer,
  question_count integer not null check (question_count > 0),
  duration_seconds integer not null check (duration_seconds > 0),
  marks_per_question numeric(8,4) not null,
  negative_marks_per_question numeric(8,4) not null,
  source text not null,
  version text not null,
  active boolean not null default true,
  unique (exam, paper, year, version)
);

create table if not exists public.tests (
  id text primary key,
  user_id uuid references public.profiles(id) on delete set null,
  guest_session_id text,
  exam text not null,
  paper text,
  mode text not null check (mode in ('exam', 'practice')),
  recipe jsonb not null,
  scoring jsonb not null,
  duration_seconds integer not null,
  started_at timestamptz not null default now(),
  deadline_at timestamptz,
  submitted_at timestamptz,
  status text not null default 'active' check (status in ('active', 'submitted', 'expired')),
  constraint tests_owner_check check (user_id is not null or guest_session_id is not null)
);

create table if not exists public.test_questions (
  test_id text not null references public.tests(id) on delete cascade,
  question_id text not null references public.questions(id),
  position integer not null check (position >= 0),
  question_snapshot jsonb not null,
  primary key (test_id, question_id),
  unique (test_id, position)
);

create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  test_id text not null references public.tests(id) on delete cascade,
  question_id text not null references public.questions(id),
  selected_option text,
  marked_for_review boolean not null default false,
  seconds_spent integer not null default 0 check (seconds_spent >= 0),
  updated_at timestamptz not null default now(),
  unique (test_id, question_id)
);

create table if not exists public.results (
  test_id text primary key references public.tests(id) on delete cascade,
  score numeric(10,4) not null,
  max_score numeric(10,4) not null,
  accuracy numeric(7,4) not null,
  correct_count integer not null,
  incorrect_count integer not null,
  unattempted_count integer not null,
  time_used_seconds integer not null,
  breakdown jsonb not null,
  weak_areas jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  recipe jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.editorial_events (
  id uuid primary key default gen_random_uuid(),
  question_id text not null references public.questions(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists questions_published_filter_idx on public.questions (exam, subject, topic, workflow_status, editorial_difficulty);
create index if not exists tests_user_status_idx on public.tests (user_id, status, started_at desc);
create index if not exists tests_guest_status_idx on public.tests (guest_session_id, status, started_at desc);
create index if not exists test_questions_test_position_idx on public.test_questions (test_id, position);
create index if not exists editorial_events_question_idx on public.editorial_events (question_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do update set email = excluded.email, name = coalesce(excluded.name, profiles.name), updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.question_sources enable row level security;
alter table public.exam_papers enable row level security;
alter table public.tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.results enable row level security;
alter table public.saved_tests enable row level security;
alter table public.editorial_events enable row level security;

create policy "published questions are public" on public.questions
  for select using (workflow_status = 'published' and verification_status = 'verified' and explanation is not null);
create policy "users can view their profile" on public.profiles
  for select using (auth.uid() = id);
create policy "users can update their profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "users can view their tests" on public.tests
  for select using (auth.uid() = user_id);
create policy "users can view their test questions" on public.test_questions
  for select using (exists (select 1 from public.tests t where t.id = test_id and t.user_id = auth.uid()));
create policy "users can manage their answers" on public.attempt_answers
  for all using (exists (select 1 from public.tests t where t.id = test_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.tests t where t.id = test_id and t.user_id = auth.uid()));
create policy "users can view their results" on public.results
  for select using (exists (select 1 from public.tests t where t.id = test_id and t.user_id = auth.uid()));
create policy "users can manage saved tests" on public.saved_tests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role in ('editor', 'admin')); $$;

create policy "staff can manage questions" on public.questions
  for all using (public.is_staff()) with check (public.is_staff());
create policy "staff can manage sources" on public.question_sources
  for all using (public.is_staff()) with check (public.is_staff());
create policy "staff can manage editorial events" on public.editorial_events
  for all using (public.is_staff()) with check (public.is_staff());
