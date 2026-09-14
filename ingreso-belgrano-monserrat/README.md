# Ingreso Belgrano · Monserrat

Aplicación web de estudio para preparar, en una misma plataforma, los ingresos a la Escuela Superior de Comercio Manuel Belgrano y al Colegio Nacional de Monserrat.

## Objetivos de la V1

- Dos perfiles independientes, sin nombres reales dentro del repositorio.
- Modo `Estudiar juntas` con turnos alternados en un único dispositivo.
- Diagnóstico inicial de Matemática y Lengua.
- Mapa de habilidades con contenidos comunes y específicos de cada colegio.
- Práctica adaptativa que prioriza habilidades con menor dominio sin abandonar el repaso.
- Pistas y explicaciones durante la práctica.
- Simulacros breves Belgrano/Monserrat con corrección al final.
- Actividades que indican cuándo conviene resolver en cuaderno.
- Seguimiento de progreso por habilidad.
- PWA instalable.
- Persistencia local inmediata y arquitectura preparada para sincronización con Supabase.

## Fuente pedagógica

La matriz curricular se construyó a partir de los programas de ingreso 2026, modelos de examen y materiales de estudio aportados por la familia. El banco inicial usa ejercicios originales alineados con esos contenidos; no pretende reproducir ni sustituir exámenes oficiales.

## Estructura

```text
ingreso-belgrano-monserrat/
├─ index.html
├─ styles.css
├─ app.js
├─ config.js
├─ manifest.webmanifest
├─ sw.js
├─ assets/
│  └─ icon.svg
└─ data/
   ├─ habilidades.json
   └─ ejercicios.json
```

## Sincronización entre dispositivos

Sin configuración adicional la app guarda el progreso en `localStorage`, por lo que funciona únicamente en el dispositivo actual.

Para activar una cuenta familiar y mantener el mismo progreso en celulares y PC:

1. Crear un proyecto en Supabase.
2. En `config.js`, completar `supabaseUrl` y `supabaseAnonKey`.
3. Crear la tabla y políticas RLS con este SQL:

```sql
create table if not exists public.study_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.study_state enable row level security;

create policy "read own study state"
on public.study_state
for select
using (auth.uid() = user_id);

create policy "insert own study state"
on public.study_state
for insert
with check (auth.uid() = user_id);

create policy "update own study state"
on public.study_state
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

La app utiliza autenticación por correo y contraseña mediante Supabase Auth. Los nombres de los perfiles quedan dentro del estado privado de la cuenta familiar y no se publican en GitHub.

## Próximas etapas

- Ampliar el banco de ejercicios por habilidad y dificultad.
- Incorporar un diagnóstico adaptativo por ramas, que detenga o profundice una habilidad según respuestas previas.
- Agregar simulacros extensos que repliquen mejor la estructura y ponderación de cada colegio.
- Mejorar la evaluación guiada de producción escrita.
- Incorporar estadísticas temporales y repaso espaciado.
- Agregar una tarjeta de acceso desde la portada de `mi-portal-web` cuando la V1 quede validada.
