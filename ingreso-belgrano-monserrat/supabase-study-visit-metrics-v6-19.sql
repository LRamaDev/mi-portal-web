-- V6.19 · Métricas anónimas de visitas.
-- No guarda nombres, correos, respuestas, progreso, IP ni identificadores de la cuenta familiar.

create table if not exists public.study_visit_events (
  id bigint generated always as identity primary key,
  visitor_id uuid not null,
  event_type text not null check (event_type in ('page_view','visitor_entry')),
  access_mode text not null check (access_mode in ('family','visitor','unknown')),
  occurred_at timestamptz not null default now()
);

comment on table public.study_visit_events is
'Métricas anónimas de acceso a la app. No guarda nombres, correo, IP, respuestas ni progreso de visitantes.';

create index if not exists study_visit_events_occurred_at_idx
  on public.study_visit_events(occurred_at desc);
create index if not exists study_visit_events_visitor_time_idx
  on public.study_visit_events(visitor_id, occurred_at desc);

alter table public.study_visit_events enable row level security;

revoke all privileges on table public.study_visit_events from anon, authenticated;
grant insert on table public.study_visit_events to anon, authenticated;
grant select on table public.study_visit_events to authenticated;

drop policy if exists "record anonymous visit events" on public.study_visit_events;
create policy "record anonymous visit events" on public.study_visit_events
for insert to anon, authenticated
with check (
  event_type in ('page_view','visitor_entry')
  and access_mode in ('family','visitor','unknown')
  and occurred_at between (now() - interval '1 day') and (now() + interval '5 minutes')
);

drop policy if exists "family reads anonymous visit metrics" on public.study_visit_events;
create policy "family reads anonymous visit metrics" on public.study_visit_events
for select to authenticated
using (
  exists (
    select 1 from public.study_access
    where user_id = (select auth.uid())
  )
);
