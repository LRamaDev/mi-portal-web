-- Ingreso Belgrano · Monserrat
-- Estado privado de una cuenta familiar.
-- Puede ejecutarse más de una vez en el SQL Editor de Supabase.

create table if not exists public.study_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.study_state enable row level security;

drop policy if exists "read own study state" on public.study_state;
drop policy if exists "insert own study state" on public.study_state;
drop policy if exists "update own study state" on public.study_state;
drop policy if exists "delete own study state" on public.study_state;

create policy "read own study state"
on public.study_state
for select
to authenticated
using (auth.uid() = user_id);

create policy "insert own study state"
on public.study_state
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "update own study state"
on public.study_state
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "delete own study state"
on public.study_state
for delete
to authenticated
using (auth.uid() = user_id);

comment on table public.study_state is
'Estado sincronizado de la app Ingreso Belgrano/Monserrat. Cada usuario autenticado sólo puede acceder a su propia fila.';
