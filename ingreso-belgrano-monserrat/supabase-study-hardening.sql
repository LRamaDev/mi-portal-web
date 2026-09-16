-- Ingreso Belgrano · Monserrat
-- Hardening de acceso aplicado en producción el 16/09/2026.
-- Objetivo: impedir acceso directo de anon, limitar permisos por tabla,
-- restringir la RPC de guardado a authenticated y exigir pertenencia a study_access.

-- 1) El rol anon no necesita acceso directo a las tablas privadas.
revoke all privileges on table public.study_state from anon;
revoke all privileges on table public.study_profile_state from anon;
revoke all privileges on table public.study_access from anon;
revoke all privileges on table public.study_feedback from anon;
revoke all privileges on table public.study_profile_intro_state from anon;

-- 2) Permisos mínimos para usuarios autenticados.
revoke all privileges on table public.study_access from authenticated;
grant select on table public.study_access to authenticated;

revoke all privileges on table public.study_feedback from authenticated;
grant select, insert, delete on table public.study_feedback to authenticated;

revoke all privileges on table public.study_profile_intro_state from authenticated;
grant select, insert, update on table public.study_profile_intro_state to authenticated;

revoke all privileges on table public.study_state from authenticated;
grant select, insert, update, delete on table public.study_state to authenticated;

revoke all privileges on table public.study_profile_state from authenticated;
grant select, insert, update, delete on table public.study_profile_state to authenticated;

-- 3) La RPC sólo puede ser ejecutada por usuarios autenticados.
revoke execute on function public.save_study_profile_state(text, jsonb) from public;
revoke execute on function public.save_study_profile_state(text, jsonb) from anon;
grant execute on function public.save_study_profile_state(text, jsonb) to authenticated;

-- 4) study_access: sólo cada usuario puede comprobar su propia habilitación.
drop policy if exists "read own study access" on public.study_access;
create policy "read own study access" on public.study_access
for select to authenticated
using ((select auth.uid()) = user_id);

-- 5) study_state: propiedad + autorización explícita en study_access.
drop policy if exists "read own study state" on public.study_state;
drop policy if exists "insert own study state" on public.study_state;
drop policy if exists "update own study state" on public.study_state;
drop policy if exists "delete own study state" on public.study_state;

create policy "read own study state" on public.study_state
for select to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.study_access a where a.user_id = (select auth.uid()))
);

create policy "insert own study state" on public.study_state
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.study_access a where a.user_id = (select auth.uid()))
);

create policy "update own study state" on public.study_state
for update to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.study_access a where a.user_id = (select auth.uid()))
)
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.study_access a where a.user_id = (select auth.uid()))
);

create policy "delete own study state" on public.study_state
for delete to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.study_access a where a.user_id = (select auth.uid()))
);

-- 6) study_profile_state: propiedad + autorización explícita en study_access.
drop policy if exists "read own study profile state" on public.study_profile_state;
drop policy if exists "insert own study profile state" on public.study_profile_state;
drop policy if exists "update own study profile state" on public.study_profile_state;
drop policy if exists "delete own study profile state" on public.study_profile_state;

create policy "read own study profile state" on public.study_profile_state
for select to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.study_access a where a.user_id = (select auth.uid()))
);

create policy "insert own study profile state" on public.study_profile_state
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.study_access a where a.user_id = (select auth.uid()))
);

create policy "update own study profile state" on public.study_profile_state
for update to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.study_access a where a.user_id = (select auth.uid()))
)
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.study_access a where a.user_id = (select auth.uid()))
);

create policy "delete own study profile state" on public.study_profile_state
for delete to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.study_access a where a.user_id = (select auth.uid()))
);

-- 7) study_feedback: sólo el propietario autorizado puede operar.
drop policy if exists "read own study feedback" on public.study_feedback;
drop policy if exists "insert own study feedback" on public.study_feedback;
drop policy if exists "delete own study feedback" on public.study_feedback;

create policy "read own study feedback" on public.study_feedback
for select to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.study_access a where a.user_id = (select auth.uid()))
);

create policy "insert own study feedback" on public.study_feedback
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.study_access a where a.user_id = (select auth.uid()))
);

create policy "delete own study feedback" on public.study_feedback
for delete to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.study_access a where a.user_id = (select auth.uid()))
);

-- 8) Estado de introducción/diagnóstico: sólo propietario autorizado.
drop policy if exists "read own study intro state" on public.study_profile_intro_state;
drop policy if exists "insert own study intro state" on public.study_profile_intro_state;
drop policy if exists "update own study intro state" on public.study_profile_intro_state;

create policy "read own study intro state" on public.study_profile_intro_state
for select to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.study_access a where a.user_id = (select auth.uid()))
);

create policy "insert own study intro state" on public.study_profile_intro_state
for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.study_access a where a.user_id = (select auth.uid()))
);

create policy "update own study intro state" on public.study_profile_intro_state
for update to authenticated
using (
  (select auth.uid()) = user_id
  and exists (select 1 from public.study_access a where a.user_id = (select auth.uid()))
)
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.study_access a where a.user_id = (select auth.uid()))
);
