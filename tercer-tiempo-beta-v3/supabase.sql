create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_app_state enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_app_state'
      and policyname = 'users can read own app state'
  ) then
    create policy "users can read own app state"
    on public.user_app_state
    for select
    to authenticated
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_app_state'
      and policyname = 'users can insert own app state'
  ) then
    create policy "users can insert own app state"
    on public.user_app_state
    for insert
    to authenticated
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_app_state'
      and policyname = 'users can update own app state'
  ) then
    create policy "users can update own app state"
    on public.user_app_state
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$$;
