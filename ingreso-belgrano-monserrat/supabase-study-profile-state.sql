-- V6.5: progreso separado por perfil para permitir uso simultáneo en varios dispositivos.
-- Ejecutado en producción el 15/09/2026. Se conserva study_state como compatibilidad histórica.

create table if not exists public.study_profile_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id text not null check (profile_id in ('p1','p2')),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, profile_id)
);

alter table public.study_profile_state enable row level security;

drop policy if exists "read own study profile state" on public.study_profile_state;
create policy "read own study profile state" on public.study_profile_state
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "insert own study profile state" on public.study_profile_state;
create policy "insert own study profile state" on public.study_profile_state
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "update own study profile state" on public.study_profile_state;
create policy "update own study profile state" on public.study_profile_state
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "delete own study profile state" on public.study_profile_state;
create policy "delete own study profile state" on public.study_profile_state
for delete to authenticated using (auth.uid() = user_id);

-- Migración inicial desde el estado anterior: una fila por cada perfil.
insert into public.study_profile_state (user_id, profile_id, payload, updated_at)
select
  s.user_id,
  p.profile_id,
  jsonb_set(
    coalesce(s.payload->'profiles'->p.profile_id, '{}'::jsonb),
    '{updatedAt}',
    to_jsonb(coalesce(nullif(s.payload->>'updatedAt','')::bigint, (extract(epoch from s.updated_at) * 1000)::bigint)),
    true
  ),
  coalesce(to_timestamp(nullif(s.payload->>'updatedAt','')::double precision / 1000.0), s.updated_at)
from public.study_state s
cross join (values ('p1'::text), ('p2'::text)) as p(profile_id)
on conflict (user_id, profile_id) do nothing;

-- Guardado atómico por perfil. Una copia vieja nunca reemplaza una más nueva.
create or replace function public.save_study_profile_state(p_profile_id text, p_payload jsonb)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  incoming_ms bigint := coalesce(nullif(p_payload->>'updatedAt','')::bigint, 0);
  changed_rows integer := 0;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if p_profile_id not in ('p1','p2') then raise exception 'invalid profile'; end if;

  insert into public.study_profile_state(user_id, profile_id, payload, updated_at)
  values (auth.uid(), p_profile_id, p_payload, clock_timestamp())
  on conflict (user_id, profile_id) do update
    set payload = excluded.payload, updated_at = clock_timestamp()
    where coalesce(nullif(public.study_profile_state.payload->>'updatedAt','')::bigint, 0) <= incoming_ms;

  get diagnostics changed_rows = row_count;
  return changed_rows > 0;
end;
$$;

grant execute on function public.save_study_profile_state(text, jsonb) to authenticated;
