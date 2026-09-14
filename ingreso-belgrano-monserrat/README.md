# Ingreso Belgrano · Monserrat

Aplicación web de estudio para preparar, en una misma plataforma, los ingresos a la Escuela Superior de Comercio Manuel Belgrano y al Colegio Nacional de Monserrat.

## Estado actual

La V1 ya está publicada y validada en GitHub Pages. La V2 incorpora la base para que una misma cuenta familiar pueda conservar el progreso en distintos dispositivos mediante Supabase.

## Funcionalidades

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
- Persistencia local inmediata.
- Cuenta familiar y sincronización preparada con Supabase Auth + RLS.

## Fuente pedagógica

La matriz curricular se construyó a partir de los programas de ingreso 2026, modelos de examen y materiales de estudio aportados por la familia. El banco inicial usa ejercicios originales alineados con esos contenidos; no pretende reproducir ni sustituir exámenes oficiales.

## Estructura

```text
ingreso-belgrano-monserrat/
├─ index.html
├─ styles.css
├─ app.js
├─ config.js
├─ supabase-study-state.sql
├─ manifest.webmanifest
├─ sw.js
├─ assets/
│  └─ icon.svg
└─ data/
   ├─ habilidades.json
   └─ ejercicios.json
```

## Sincronización entre dispositivos

La app siempre guarda primero en `localStorage`, por lo que puede seguir usándose aunque no haya conexión. Cuando hay una cuenta familiar autenticada, el estado también se guarda en Supabase y puede recuperarse desde otro celular, tablet o PC.

La V2 reutiliza el mismo proyecto Supabase ya configurado para otras aplicaciones del portal. `config.js` contiene únicamente la URL y la clave pública/publicable del proyecto; no contiene claves privadas ni `service_role`.

### Crear la tabla privada de estudio

Ejecutar el archivo `supabase-study-state.sql` en el proyecto Supabase. El script:

- crea `public.study_state`;
- activa Row Level Security;
- permite a cada usuario autenticado leer, crear, modificar o borrar exclusivamente su propia fila;
- guarda dentro de `payload` los perfiles, avances e historial de la cuenta familiar.

La estructura principal es:

```sql
create table if not exists public.study_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
```

### Flujo familiar

1. Un adulto crea una cuenta familiar desde el panel de la app con correo y contraseña.
2. Se configuran los nombres de los dos perfiles dentro de la cuenta.
3. La práctica se guarda localmente y se sube a `study_state`.
4. En otro dispositivo se ingresa con la misma cuenta familiar.
5. La app compara las fechas del estado local y remoto y conserva la versión más reciente.

Los nombres de los perfiles y el progreso no se publican en GitHub: quedan en el almacenamiento local y, al activar la cuenta familiar, dentro de la fila privada protegida por RLS.

## Importante para pruebas de V2

Al cambiar la configuración de nube también se incrementó la versión del caché de la PWA a `ingreso-bm-v2`. Si un dispositivo mantuviera una versión anterior abierta, conviene recargar una vez la página para que el nuevo service worker tome control.

## Próximas etapas

- Mejorar la sincronización activa cuando dos dispositivos permanecen abiertos al mismo tiempo.
- Ampliar el banco de ejercicios por habilidad y dificultad.
- Incorporar un diagnóstico adaptativo por ramas, que detenga o profundice una habilidad según respuestas previas.
- Agregar simulacros extensos que repliquen mejor la estructura y ponderación de cada colegio.
- Mejorar la evaluación guiada de producción escrita.
- Incorporar estadísticas temporales y repaso espaciado.
- Agregar una tarjeta de acceso desde la portada de `mi-portal-web`.
