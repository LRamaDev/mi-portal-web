-- Acceso privado para Ingreso Belgrano · Monserrat
-- La app exige autenticación Supabase y que el usuario exista en esta tabla.

create table if not exists public.study_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.study_access enable row level security;

drop policy if exists "read own study access" on public.study_access;
create policy "read own study access"
on public.study_access
for select
to authenticated
using (auth.uid() = user_id);

-- Al instalar esta migración por primera vez, autoriza cuentas familiares
-- que ya venían utilizando study_state.
insert into public.study_access (user_id)
select user_id from public.study_state
on conflict (user_id) do nothing;

-- Para habilitar otra cuenta en el futuro, agregar explícitamente su UUID:
-- insert into public.study_access (user_id) values ('UUID-DE-LA-CUENTA');
