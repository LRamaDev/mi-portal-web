-- Idempotente: aplicada en Supabase al 17/11/2026 como
-- ai_poc_daily_limit_four_server_only. Se conserva aquí por trazabilidad.
create table if not exists public.ai_poc_daily_quota (
  quota_day date primary key,
  requests integer not null default 0 check (requests between 0 and 4),
  updated_at timestamptz not null default now()
);
alter table public.ai_poc_daily_quota enable row level security;
revoke all on table public.ai_poc_daily_quota from public, anon, authenticated;
grant select, insert, update on table public.ai_poc_daily_quota to service_role;

create or replace function public.ai_poc_take_slot()
returns boolean
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare new_count integer;
begin
  insert into public.ai_poc_daily_quota as q (quota_day, requests)
  values ((now() at time zone 'UTC')::date, 1)
  on conflict (quota_day) do update
  set requests = q.requests + 1, updated_at = now()
  where q.requests < 4
  returning requests into new_count;
  return new_count is not null;
end;
$$;
revoke all on function public.ai_poc_take_slot() from public, anon, authenticated;
grant execute on function public.ai_poc_take_slot() to service_role;
