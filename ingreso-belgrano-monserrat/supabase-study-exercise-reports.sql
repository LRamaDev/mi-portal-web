-- Ingreso Belgrano / Monserrat: avisos de errores asociados a ejercicios.
-- Migración aditiva, sin modificar intentos ni opiniones existentes.
-- Compatible con las restricciones de Data API posteriores al 30/10/2026.

create table if not exists public.study_exercise_reports (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id text not null check (profile_id in ('p1', 'p2')),
  session_type text not null check (session_type in ('diagnostico', 'practica', 'simulacro')),
  exercise_id text not null check (length(exercise_id) between 1 and 100),
  skill_id text,
  area text not null check (area in ('matematica', 'lengua')),
  school text check (school is null or school in ('belgrano', 'monserrat')),
  issue_type text not null check (issue_type in ('respuesta', 'consigna', 'opciones', 'contenido', 'otro')),
  note text check (note is null or length(note) <= 500),
  snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'pendiente' check (status in ('pendiente', 'revisado', 'corregido')),
  created_at timestamptz not null default now()
);

create index if not exists study_exercise_reports_user_created_idx
  on public.study_exercise_reports (user_id, created_at desc);

alter table public.study_exercise_reports enable row level security;

-- Los visitantes no pueden leer ni registrar avisos familiares.
revoke all on public.study_exercise_reports from anon;
grant select, insert on public.study_exercise_reports to authenticated;
grant update (status) on public.study_exercise_reports to authenticated;

-- Tanto el usuario como su habilitación en study_access deben coincidir.
do $policies$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'study_exercise_reports'
      and policyname = 'ingreso insert own exercise reports'
  ) then
    create policy "ingreso insert own exercise reports"
      on public.study_exercise_reports for insert to authenticated
      with check (
        (select auth.uid()) = user_id
        and exists (
          select 1 from public.study_access a
          where a.user_id = (select auth.uid())
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'study_exercise_reports'
      and policyname = 'ingreso read own exercise reports'
  ) then
    create policy "ingreso read own exercise reports"
      on public.study_exercise_reports for select to authenticated
      using (
        (select auth.uid()) = user_id
        and exists (
          select 1 from public.study_access a
          where a.user_id = (select auth.uid())
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'study_exercise_reports'
      and policyname = 'ingreso update own exercise report status'
  ) then
    create policy "ingreso update own exercise report status"
      on public.study_exercise_reports for update to authenticated
      using (
        (select auth.uid()) = user_id
        and exists (
          select 1 from public.study_access a
          where a.user_id = (select auth.uid())
        )
      )
      with check (
        (select auth.uid()) = user_id
        and exists (
          select 1 from public.study_access a
          where a.user_id = (select auth.uid())
        )
      );
  end if;
end $policies$;
