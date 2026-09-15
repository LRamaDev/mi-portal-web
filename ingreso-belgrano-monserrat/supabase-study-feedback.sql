-- Ingreso Belgrano · Monserrat
-- Opiniones del testeo familiar. Ejecutado en Supabase para la prueba familiar.

create table if not exists public.study_feedback (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id text not null check (profile_id in ('p1','p2','together')),
  session_type text not null check (session_type in ('diagnostico','practica','simulacro','otro')),
  area text,
  school text,
  rating text not null check (rating in ('facil','bien','dificil','confuso')),
  note text,
  created_at timestamptz not null default now(),
  constraint study_feedback_note_length check (note is null or char_length(note) <= 500)
);

alter table public.study_feedback enable row level security;

create index if not exists study_feedback_user_created_idx
  on public.study_feedback (user_id, created_at desc);

drop policy if exists "insert own study feedback" on public.study_feedback;
create policy "insert own study feedback"
on public.study_feedback
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "read own study feedback" on public.study_feedback;
create policy "read own study feedback"
on public.study_feedback
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "delete own study feedback" on public.study_feedback;
create policy "delete own study feedback"
on public.study_feedback
for delete
to authenticated
using (auth.uid() = user_id);
