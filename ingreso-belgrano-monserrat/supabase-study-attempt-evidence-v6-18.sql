-- V6.18 · Evidencia pedagógica detallada por intento.
-- Migración ADITIVA: no modifica ni elimina study_state, study_profile_state
-- ni ningún dato histórico existente. El cliente mantiene una cola local/payload
-- si esta tabla todavía no fue creada.

create table if not exists public.study_attempt_evidence (
  event_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id text not null check (profile_id in ('p1','p2')),
  occurred_at timestamptz not null,
  exercise_id text not null,
  skill_id text not null,
  area text not null check (area in ('matematica','lengua')),
  school text null check (school is null or school in ('belgrano','monserrat')),
  difficulty smallint not null check (difficulty between 1 and 4),
  correct boolean not null,
  hint_used boolean not null default false,
  autonomous boolean not null default true,
  context text not null,
  origin text not null default 'manual',
  purpose text not null default 'practica',
  duration_ms integer null check (duration_ms is null or duration_ms >= 0),
  evaluation_mode text not null default 'objective' check (evaluation_mode in ('objective','selfcheck')),
  evaluation_weight numeric(4,3) not null default 1 check (evaluation_weight >= 0.4 and evaluation_weight <= 1),
  created_at timestamptz not null default now()
);

comment on table public.study_attempt_evidence is
'Historial append-only de evidencias de aprendizaje por intento. Complementa study_profile_state sin reemplazarlo.';

comment on column public.study_attempt_evidence.context is
'Tipo de sesión: diagnostico, practica o simulacro.';
comment on column public.study_attempt_evidence.origin is
'Origen de la actividad: manual, recomendacion, video, contenidos, simulacro u otro.';
comment on column public.study_attempt_evidence.purpose is
'Propósito pedagógico: exploracion, practica, comprobacion, desafio, retencion o evaluacion.';

create index if not exists study_attempt_evidence_user_profile_time_idx
  on public.study_attempt_evidence(user_id, profile_id, occurred_at desc);

create index if not exists study_attempt_evidence_user_profile_skill_time_idx
  on public.study_attempt_evidence(user_id, profile_id, skill_id, occurred_at desc);

alter table public.study_attempt_evidence enable row level security;

drop policy if exists "read own study attempt evidence" on public.study_attempt_evidence;
create policy "read own study attempt evidence" on public.study_attempt_evidence
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "insert own study attempt evidence" on public.study_attempt_evidence;
create policy "insert own study attempt evidence" on public.study_attempt_evidence
for insert to authenticated
with check (auth.uid() = user_id);

-- El historial de evidencias no se edita ni se borra desde el cliente.
revoke update, delete on table public.study_attempt_evidence from authenticated;
revoke all privileges on table public.study_attempt_evidence from anon;
grant select, insert on table public.study_attempt_evidence to authenticated;

-- Vista cómoda para evaluación adulta del estado actual calculado por la app.
-- security_invoker hace que se respeten las políticas RLS de study_profile_state.
create or replace view public.study_skill_current
with (security_invoker = true)
as
select
  s.user_id,
  s.profile_id,
  p.key as skill_id,
  p.value #>> '{pedagogy,state}' as state,
  p.value #>> '{pedagogy,trend}' as trend,
  p.value #>> '{pedagogy,confidence}' as confidence,
  nullif(p.value #>> '{pedagogy,recentScore}','')::integer as recent_score,
  nullif(p.value #>> '{pedagogy,detailedEvidenceCount}','')::integer as detailed_evidence_count,
  nullif(p.value #>> '{pedagogy,legacyAttempts}','')::integer as legacy_attempts,
  nullif(p.value #>> '{pedagogy,establishedDifficulty}','')::numeric as established_difficulty,
  nullif(p.value #>> '{pedagogy,demonstratedDifficulty}','')::numeric as demonstrated_difficulty,
  nullif(p.value #>> '{pedagogy,retentionDueAt}','')::bigint as retention_due_at_ms,
  nullif(p.value #>> '{pedagogy,nextReviewAt}','')::bigint as next_review_at_ms,
  coalesce((p.value #>> '{pedagogy,retentionVerified}')::boolean, false) as retention_verified,
  coalesce((p.value #>> '{pedagogy,needsVerification}')::boolean, false) as needs_verification,
  s.updated_at
from public.study_profile_state s
cross join lateral jsonb_each(coalesce(s.payload->'progress', '{}'::jsonb)) as p(key, value);

grant select on public.study_skill_current to authenticated;
