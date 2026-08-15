-- Versioned scoring presets. Confirm against the notice for the selected year
-- before activating a new paper configuration.
insert into public.exam_papers (
  id, exam, paper, year, question_count, duration_seconds,
  marks_per_question, negative_marks_per_question, source, version, active
) values
  ('cse-gs1-2026', 'CSE', 'GS-I', 2026, 100, 7200, 2, 0.6667,
   'https://www.upsc.gov.in/examinations/Civil%20Services%20%28Preliminary%29%20Examination%2C%202026', '2026-official', true),
  ('capf-paper1-2026', 'CAPF', 'I', 2026, 125, 7200, 2, 0.6667,
   'https://upsc.gov.in/examinations/active-exams', '2026-official', true),
  ('cds-gk-2026', 'CDS', 'General Knowledge', 2026, 100, 7200, 1, 0.3333,
   'https://upsc.gov.in/examinations/active-exams', '2026-official', true),
  ('nda-gat-2026', 'NDA', 'General Ability', 2026, 150, 9000, 4, 1.3333,
   'https://upsc.gov.in/examinations/active-exams', '2026-official', true)
on conflict (id) do update set
  question_count = excluded.question_count,
  duration_seconds = excluded.duration_seconds,
  marks_per_question = excluded.marks_per_question,
  negative_marks_per_question = excluded.negative_marks_per_question,
  source = excluded.source,
  version = excluded.version,
  active = excluded.active;
