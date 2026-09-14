-- Tercer Tiempo · grupos compartidos, miembros, roles e invitaciones
-- Ejecutar una vez en Supabase > SQL Editor. El script es acumulativo y no borra datos existentes.

create extension if not exists pgcrypto;

create table if not exists public.tt_shared_groups (
  group_id text primary key,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  name text not null default 'Mi grupo',
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tt_group_members (
  group_id text not null references public.tt_shared_groups(group_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null default '',
  display_name text not null default '',
  role text not null default 'player' check (role in ('owner','admin','organizer','match_collaborator','third_time','player')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.tt_group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id text not null references public.tt_shared_groups(group_id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  role text not null default 'player' check (role in ('admin','organizer','match_collaborator','third_time','player')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz
);

create table if not exists public.tt_group_responsibilities (
  group_id text not null references public.tt_shared_groups(group_id) on delete cascade,
  responsibility text not null check (responsibility in ('organizer','result','third_time')),
  user_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid not null references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (group_id, responsibility)
);

create index if not exists tt_group_members_user_idx on public.tt_group_members(user_id);
create index if not exists tt_group_invites_group_idx on public.tt_group_invites(group_id);
create index if not exists tt_group_responsibilities_user_idx on public.tt_group_responsibilities(user_id);

create or replace function public.tt_is_group_member(p_group_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tt_group_members m
    where m.group_id = p_group_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.tt_group_role(p_group_id text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.tt_group_members m
  where m.group_id = p_group_id
    and m.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.tt_can_manage_group(p_group_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.tt_group_role(p_group_id) in ('owner','admin'), false);
$$;

create or replace function public.tt_has_group_capability(p_group_id text, p_capability text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with role_row as (
    select public.tt_group_role(p_group_id) as role
  )
  select case p_capability
    when 'manage' then coalesce((select role in ('owner','admin') from role_row), false)
    when 'organize' then
      coalesce((select role in ('owner','admin','organizer') from role_row), false)
      or exists (
        select 1 from public.tt_group_responsibilities r
        where r.group_id = p_group_id
          and r.responsibility = 'organizer'
          and r.user_id = auth.uid()
      )
    when 'result' then
      coalesce((select role in ('owner','admin','match_collaborator') from role_row), false)
      or exists (
        select 1 from public.tt_group_responsibilities r
        where r.group_id = p_group_id
          and r.responsibility = 'result'
          and r.user_id = auth.uid()
      )
    when 'third_time' then
      coalesce((select role in ('owner','admin','third_time') from role_row), false)
      or exists (
        select 1 from public.tt_group_responsibilities r
        where r.group_id = p_group_id
          and r.responsibility = 'third_time'
          and r.user_id = auth.uid()
      )
    when 'edit_any' then
      coalesce((select role in ('owner','admin','organizer','match_collaborator','third_time') from role_row), false)
      or exists (
        select 1 from public.tt_group_responsibilities r
        where r.group_id = p_group_id
          and r.user_id = auth.uid()
      )
    else false
  end;
$$;

alter table public.tt_shared_groups enable row level security;
alter table public.tt_group_members enable row level security;
alter table public.tt_group_invites enable row level security;
alter table public.tt_group_responsibilities enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tt_shared_groups' and policyname='members can read shared groups') then
    create policy "members can read shared groups"
    on public.tt_shared_groups for select to authenticated
    using (public.tt_is_group_member(group_id) or owner_user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tt_group_members' and policyname='members can read group members') then
    create policy "members can read group members"
    on public.tt_group_members for select to authenticated
    using (public.tt_is_group_member(group_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tt_group_invites' and policyname='admins can read group invites') then
    create policy "admins can read group invites"
    on public.tt_group_invites for select to authenticated
    using (public.tt_can_manage_group(group_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tt_group_responsibilities' and policyname='members can read responsibilities') then
    create policy "members can read responsibilities"
    on public.tt_group_responsibilities for select to authenticated
    using (public.tt_is_group_member(group_id));
  end if;
end
$$;

-- Las mutaciones se realizan mediante RPCs controladas. Las tablas quedan en lectura para usuarios autenticados.
revoke insert, update, delete on public.tt_shared_groups from authenticated;
revoke insert, update, delete on public.tt_group_members from authenticated;
revoke insert, update, delete on public.tt_group_invites from authenticated;
revoke insert, update, delete on public.tt_group_responsibilities from authenticated;
grant select on public.tt_shared_groups to authenticated;
grant select on public.tt_group_members to authenticated;
grant select on public.tt_group_invites to authenticated;
grant select on public.tt_group_responsibilities to authenticated;

create or replace function public.tt_ensure_shared_group(p_group_id text, p_name text, p_state jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_owner uuid;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if nullif(trim(p_group_id), '') is null then raise exception 'invalid group id'; end if;

  select owner_user_id into v_owner
  from public.tt_shared_groups
  where group_id = p_group_id;

  if v_owner is null then
    insert into public.tt_shared_groups(group_id, owner_user_id, name, state)
    values (p_group_id, v_user, coalesce(nullif(trim(p_name),''),'Mi grupo'), coalesce(p_state,'{}'::jsonb));

    insert into public.tt_group_members(group_id, user_id, email, role)
    values (p_group_id, v_user, coalesce(auth.jwt()->>'email',''), 'owner')
    on conflict (group_id, user_id) do update
      set role = 'owner', email = excluded.email, updated_at = now();
  elsif not public.tt_is_group_member(p_group_id) then
    raise exception 'group already belongs to another account';
  end if;

  return p_group_id;
end;
$$;

create or replace function public.tt_save_shared_group_state(p_group_id text, p_name text, p_state jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.tt_has_group_capability(p_group_id, 'edit_any') then
    raise exception 'permission denied';
  end if;

  update public.tt_shared_groups
  set name = coalesce(nullif(trim(p_name),''), name),
      state = coalesce(p_state, state),
      updated_at = v_now
  where group_id = p_group_id;

  if not found then raise exception 'group not found'; end if;
  return v_now;
end;
$$;

create or replace function public.tt_create_group_invite(p_group_id text, p_role text default 'player')
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
  v_role text := coalesce(nullif(trim(p_role),''),'player');
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.tt_can_manage_group(p_group_id) then raise exception 'permission denied'; end if;
  if v_role not in ('admin','organizer','match_collaborator','third_time','player') then
    raise exception 'invalid role';
  end if;

  insert into public.tt_group_invites(group_id, role, created_by)
  values (p_group_id, v_role, auth.uid())
  returning token into v_token;

  return v_token::text;
end;
$$;

create or replace function public.tt_accept_group_invite(p_token text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.tt_group_invites%rowtype;
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'authentication required'; end if;

  select * into v_invite
  from public.tt_group_invites
  where token::text = trim(p_token)
    and used_at is null
    and expires_at > now()
  for update;

  if not found then raise exception 'invite invalid or expired'; end if;

  insert into public.tt_group_members(group_id, user_id, email, role)
  values (v_invite.group_id, v_user, coalesce(auth.jwt()->>'email',''), v_invite.role)
  on conflict (group_id, user_id) do update
    set email = excluded.email,
        updated_at = now();

  update public.tt_group_invites
  set used_by = v_user, used_at = now()
  where id = v_invite.id;

  return v_invite.group_id;
end;
$$;

create or replace function public.tt_set_member_role(p_group_id text, p_user_id uuid, p_role text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_role text;
  v_role text := trim(p_role);
begin
  if not public.tt_can_manage_group(p_group_id) then raise exception 'permission denied'; end if;
  if v_role not in ('admin','organizer','match_collaborator','third_time','player') then raise exception 'invalid role'; end if;

  select role into v_current_role
  from public.tt_group_members
  where group_id = p_group_id and user_id = p_user_id;

  if v_current_role is null then raise exception 'member not found'; end if;
  if v_current_role = 'owner' then raise exception 'owner role can only change by transferring ownership'; end if;

  update public.tt_group_members
  set role = v_role, updated_at = now()
  where group_id = p_group_id and user_id = p_user_id;
  return true;
end;
$$;

create or replace function public.tt_remove_group_member(p_group_id text, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if not public.tt_can_manage_group(p_group_id) then raise exception 'permission denied'; end if;
  select role into v_role from public.tt_group_members where group_id=p_group_id and user_id=p_user_id;
  if v_role is null then return false; end if;
  if v_role = 'owner' then raise exception 'owner cannot be removed'; end if;

  delete from public.tt_group_responsibilities where group_id=p_group_id and user_id=p_user_id;
  delete from public.tt_group_members where group_id=p_group_id and user_id=p_user_id;
  return true;
end;
$$;

create or replace function public.tt_set_group_responsibility(p_group_id text, p_responsibility text, p_user_id uuid default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.tt_can_manage_group(p_group_id) then raise exception 'permission denied'; end if;
  if p_responsibility not in ('organizer','result','third_time') then raise exception 'invalid responsibility'; end if;

  if p_user_id is null then
    delete from public.tt_group_responsibilities
    where group_id=p_group_id and responsibility=p_responsibility;
    return true;
  end if;

  if not exists (
    select 1 from public.tt_group_members
    where group_id=p_group_id and user_id=p_user_id
  ) then raise exception 'target user is not a group member'; end if;

  insert into public.tt_group_responsibilities(group_id,responsibility,user_id,assigned_by)
  values (p_group_id,p_responsibility,p_user_id,auth.uid())
  on conflict (group_id,responsibility) do update
    set user_id=excluded.user_id, assigned_by=excluded.assigned_by, updated_at=now();
  return true;
end;
$$;

create or replace function public.tt_transfer_group_ownership(p_group_id text, p_new_owner uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if not exists (
    select 1 from public.tt_shared_groups
    where group_id=p_group_id and owner_user_id=v_user
  ) then raise exception 'only the owner can transfer ownership'; end if;

  if not exists (
    select 1 from public.tt_group_members
    where group_id=p_group_id and user_id=p_new_owner
  ) then raise exception 'new owner must already be a member'; end if;

  update public.tt_group_members set role='admin', updated_at=now()
  where group_id=p_group_id and user_id=v_user;
  update public.tt_group_members set role='owner', updated_at=now()
  where group_id=p_group_id and user_id=p_new_owner;
  update public.tt_shared_groups set owner_user_id=p_new_owner, updated_at=now()
  where group_id=p_group_id;
  return true;
end;
$$;

create or replace function public.tt_delete_shared_group(p_group_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.tt_shared_groups
    where group_id=p_group_id and owner_user_id=auth.uid()
  ) then raise exception 'only the owner can delete the shared group'; end if;
  delete from public.tt_shared_groups where group_id=p_group_id;
  return true;
end;
$$;

grant execute on function public.tt_is_group_member(text) to authenticated;
grant execute on function public.tt_group_role(text) to authenticated;
grant execute on function public.tt_can_manage_group(text) to authenticated;
grant execute on function public.tt_has_group_capability(text,text) to authenticated;
grant execute on function public.tt_ensure_shared_group(text,text,jsonb) to authenticated;
grant execute on function public.tt_save_shared_group_state(text,text,jsonb) to authenticated;
grant execute on function public.tt_create_group_invite(text,text) to authenticated;
grant execute on function public.tt_accept_group_invite(text) to authenticated;
grant execute on function public.tt_set_member_role(text,uuid,text) to authenticated;
grant execute on function public.tt_remove_group_member(text,uuid) to authenticated;
grant execute on function public.tt_set_group_responsibility(text,text,uuid) to authenticated;
grant execute on function public.tt_transfer_group_ownership(text,uuid) to authenticated;
grant execute on function public.tt_delete_shared_group(text) to authenticated;
