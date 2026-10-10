-- ==========================================================================
-- SIMULADOR DE NOTAS - ESQUEMA DE LA BASE DE DATOS COMPARTIDA (SUPABASE)
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Se puede ejecutar más de una vez sin duplicar nada.
--
-- Qué es compartido: universidades, asignaturas (universidad + código),
-- docentes, calificaciones de docentes y comentarios de cursos.
-- Qué es privado: datos_usuario guarda los cursos y notas de cada estudiante;
-- solo su dueño puede leerlos o modificarlos.
--
-- Seguridad: todas las tablas usan Row Level Security (RLS). La clave pública de
-- la app solo permite lo que dicen las políticas de abajo: leer lo compartido y,
-- con sesión iniciada, crear y editar únicamente lo propio.
-- ==========================================================================

create extension if not exists unaccent with schema extensions;

-- --------------------------------------------------------------------------
-- Funciones de normalización (mismas reglas que storage.js)
-- --------------------------------------------------------------------------

-- "mat-201", "MAT 201" y "MAT201" son el mismo código
create or replace function public.normalizar_codigo(texto text)
returns text language sql immutable set search_path = '' as $$
    select upper(regexp_replace(coalesce(texto, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

-- Sin tildes, en minúsculas y sin signos
create or replace function public.normalizar_texto(texto text)
returns text language sql stable set search_path = '' as $$
    select trim(regexp_replace(lower(extensions.unaccent(coalesce(texto, ''))), '[^a-z0-9]+', ' ', 'g'));
$$;

-- Como normalizar_texto y además sin títulos ("Dr. Juan Pérez" = "juan perez")
create or replace function public.normalizar_nombre_docente(texto text)
returns text language sql stable set search_path = '' as $$
    select trim(regexp_replace(
        regexp_replace(
            ' ' || public.normalizar_texto(texto) || ' ',
            ' (dr|dra|doctor|doctora|mg|mgtr|mag|magister|ing|lic|licenciado|licenciada|msc|phd|prof|profesor|profesora|ingeniero|ingeniera|abog|arq|econ)(?= )',
            '', 'g'),
        ' +', ' ', 'g'));
$$;

-- --------------------------------------------------------------------------
-- Universidades (solo lectura para la app; se administran desde el panel)
-- --------------------------------------------------------------------------
create table if not exists public.universidades (
    id               text primary key,
    siglas           text not null,
    nombre           text not null,
    nota_aprobatoria numeric(4, 2) not null check (nota_aprobatoria between 0 and 20),
    created_at       timestamptz not null default now()
);

-- Mismo catálogo que storage.js (verifica las notas con el reglamento de cada universidad)
insert into public.universidades (id, siglas, nombre, nota_aprobatoria) values
    ('unsa',   'UNSA',   'Universidad Nacional de San Agustín de Arequipa',    10.5),
    ('uni',    'UNI',    'Universidad Nacional de Ingeniería',                 10),
    ('unmsm',  'UNMSM',  'Universidad Nacional Mayor de San Marcos',           10.5),
    ('pucp',   'PUCP',   'Pontificia Universidad Católica del Perú',           10.5),
    ('ucsm',   'UCSM',   'Universidad Católica de Santa María',                10.5),
    ('unsaac', 'UNSAAC', 'Universidad Nacional de San Antonio Abad del Cusco', 10.5),
    ('unt',    'UNT',    'Universidad Nacional de Trujillo',                   10.5),
    ('unalm',  'UNALM',  'Universidad Nacional Agraria La Molina',             10.5)
on conflict (id) do update
    set siglas = excluded.siglas, nombre = excluded.nombre, nota_aprobatoria = excluded.nota_aprobatoria;

-- --------------------------------------------------------------------------
-- Perfiles (uno por usuario; se crea solo al registrarse)
-- --------------------------------------------------------------------------
create table if not exists public.perfiles (
    id             uuid primary key references auth.users (id) on delete cascade,
    nombre         text check (char_length(nombre) <= 80),
    universidad_id text references public.universidades (id),
    created_at     timestamptz not null default now()
);

create or replace function public.crear_perfil_nuevo_usuario()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
    insert into public.perfiles (id, nombre)
    values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80))
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
    after insert on auth.users
    for each row execute function public.crear_perfil_nuevo_usuario();

-- --------------------------------------------------------------------------
-- Asignaturas (clave única: universidad + código normalizado)
-- --------------------------------------------------------------------------
create table if not exists public.asignaturas (
    id                 uuid primary key default gen_random_uuid(),
    universidad_id     text not null references public.universidades (id),
    codigo             text not null check (char_length(codigo) between 1 and 20),
    codigo_normalizado text generated always as (public.normalizar_codigo(codigo)) stored,
    nombre             text not null check (char_length(nombre) between 1 and 120),
    creditos           smallint not null default 3 check (creditos between 1 and 10),
    creado_por         uuid default auth.uid() references auth.users (id) on delete set null,
    created_at         timestamptz not null default now(),
    unique (universidad_id, codigo_normalizado)
);

-- --------------------------------------------------------------------------
-- Docentes (clave única: universidad + nombre normalizado)
-- --------------------------------------------------------------------------
create table if not exists public.docentes (
    id                 uuid primary key default gen_random_uuid(),
    universidad_id     text not null references public.universidades (id),
    nombre             text not null check (char_length(nombre) between 1 and 80),
    nombre_normalizado text not null,
    creado_por         uuid default auth.uid() references auth.users (id) on delete set null,
    created_at         timestamptz not null default now(),
    unique (universidad_id, nombre_normalizado)
);

-- El nombre normalizado lo calcula la base de datos (no se confía en el cliente)
create or replace function public.normalizar_docente_antes_de_guardar()
returns trigger language plpgsql set search_path = '' as $$
begin
    new.nombre := trim(regexp_replace(new.nombre, '\s+', ' ', 'g'));
    new.nombre_normalizado := public.normalizar_nombre_docente(new.nombre);
    if new.nombre_normalizado = '' then
        raise exception 'El nombre del docente no es válido';
    end if;
    return new;
end;
$$;

drop trigger if exists normalizar_docente on public.docentes;
create trigger normalizar_docente
    before insert or update on public.docentes
    for each row execute function public.normalizar_docente_antes_de_guardar();

-- --------------------------------------------------------------------------
-- Calificaciones de docentes (una por usuario y docente; se puede cambiar)
-- --------------------------------------------------------------------------
create table if not exists public.calificaciones_docente (
    docente_id  uuid not null references public.docentes (id) on delete cascade,
    usuario_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
    estrellas   smallint not null check (estrellas between 1 and 5),
    updated_at  timestamptz not null default now(),
    primary key (docente_id, usuario_id)
);

-- --------------------------------------------------------------------------
-- Comentarios de cursos (anónimos para los demás; se ocultan si los reportan)
-- --------------------------------------------------------------------------
create table if not exists public.comentarios (
    id            uuid primary key default gen_random_uuid(),
    asignatura_id uuid not null references public.asignaturas (id) on delete cascade,
    docente_id    uuid references public.docentes (id) on delete set null,
    usuario_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
    texto         text not null check (char_length(trim(texto)) between 1 and 500),
    oculto        boolean not null default false,
    created_at    timestamptz not null default now()
);

create index if not exists comentarios_por_asignatura on public.comentarios (asignatura_id, created_at desc);

-- --------------------------------------------------------------------------
-- Reportes de comentarios (moderación: con 3 reportes el comentario se oculta)
-- --------------------------------------------------------------------------
create table if not exists public.reportes_comentario (
    comentario_id uuid not null references public.comentarios (id) on delete cascade,
    usuario_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
    motivo        text check (char_length(motivo) <= 300),
    created_at    timestamptz not null default now(),
    primary key (comentario_id, usuario_id)
);

create or replace function public.ocultar_comentario_reportado()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
    if (select count(*) from public.reportes_comentario where comentario_id = new.comentario_id) >= 3 then
        update public.comentarios set oculto = true where id = new.comentario_id;
    end if;
    return new;
end;
$$;

drop trigger if exists al_reportar_comentario on public.reportes_comentario;
create trigger al_reportar_comentario
    after insert on public.reportes_comentario
    for each row execute function public.ocultar_comentario_reportado();

-- --------------------------------------------------------------------------
-- Datos personales de cada estudiante (privados): cursos, notas, perfil y
-- catálogos propios, guardados como un solo documento JSON por usuario
-- --------------------------------------------------------------------------
create table if not exists public.datos_usuario (
    usuario_id     uuid primary key default auth.uid() references auth.users (id) on delete cascade,
    datos          jsonb not null default '{}'::jsonb check (pg_column_size(datos) < 1048576),
    actualizado_en timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Vistas públicas (solo datos agregados o anónimos)
-- --------------------------------------------------------------------------

-- Docentes con su promedio de estrellas, sin exponer quién calificó
create or replace view public.docentes_con_promedio as
select
    d.id,
    d.universidad_id,
    d.nombre,
    d.nombre_normalizado,
    round(avg(c.estrellas)::numeric, 1) as promedio,
    count(c.estrellas)                  as total_calificaciones
from public.docentes d
left join public.calificaciones_docente c on c.docente_id = d.id
group by d.id;

-- Comentarios visibles, sin el id del autor (solo indica si es tuyo)
create or replace view public.comentarios_publicos as
select
    c.id,
    c.asignatura_id,
    c.docente_id,
    c.texto,
    c.created_at,
    (c.usuario_id = auth.uid()) as es_mio
from public.comentarios c
where not c.oculto;

-- --------------------------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------------------------
alter table public.universidades          enable row level security;
alter table public.perfiles               enable row level security;
alter table public.asignaturas            enable row level security;
alter table public.docentes               enable row level security;
alter table public.calificaciones_docente enable row level security;
alter table public.comentarios            enable row level security;
alter table public.reportes_comentario    enable row level security;
alter table public.datos_usuario          enable row level security;

-- Universidades: cualquiera puede leer
drop policy if exists "universidades: leer" on public.universidades;
create policy "universidades: leer" on public.universidades
    for select to anon, authenticated using (true);

-- Perfiles: cada usuario ve y edita solo el suyo
drop policy if exists "perfiles: ver el propio" on public.perfiles;
create policy "perfiles: ver el propio" on public.perfiles
    for select to authenticated using (id = (select auth.uid()));
drop policy if exists "perfiles: editar el propio" on public.perfiles;
create policy "perfiles: editar el propio" on public.perfiles
    for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Asignaturas: cualquiera lee; con sesión se pueden agregar
drop policy if exists "asignaturas: leer" on public.asignaturas;
create policy "asignaturas: leer" on public.asignaturas
    for select to anon, authenticated using (true);
drop policy if exists "asignaturas: agregar con sesión" on public.asignaturas;
create policy "asignaturas: agregar con sesión" on public.asignaturas
    for insert to authenticated with check (creado_por = (select auth.uid()));

-- Docentes: cualquiera lee; con sesión se pueden agregar
drop policy if exists "docentes: leer" on public.docentes;
create policy "docentes: leer" on public.docentes
    for select to anon, authenticated using (true);
drop policy if exists "docentes: agregar con sesión" on public.docentes;
create policy "docentes: agregar con sesión" on public.docentes
    for insert to authenticated with check (creado_por = (select auth.uid()));

-- Calificaciones: cada usuario gestiona solo las suyas (los demás ven el promedio en la vista)
drop policy if exists "calificaciones: ver las propias" on public.calificaciones_docente;
create policy "calificaciones: ver las propias" on public.calificaciones_docente
    for select to authenticated using (usuario_id = (select auth.uid()));
drop policy if exists "calificaciones: crear la propia" on public.calificaciones_docente;
create policy "calificaciones: crear la propia" on public.calificaciones_docente
    for insert to authenticated with check (usuario_id = (select auth.uid()));
drop policy if exists "calificaciones: cambiar la propia" on public.calificaciones_docente;
create policy "calificaciones: cambiar la propia" on public.calificaciones_docente
    for update to authenticated using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
drop policy if exists "calificaciones: borrar la propia" on public.calificaciones_docente;
create policy "calificaciones: borrar la propia" on public.calificaciones_docente
    for delete to authenticated using (usuario_id = (select auth.uid()));

-- Comentarios: cada usuario gestiona los suyos (los demás los ven en la vista pública)
drop policy if exists "comentarios: ver los propios" on public.comentarios;
create policy "comentarios: ver los propios" on public.comentarios
    for select to authenticated using (usuario_id = (select auth.uid()));
drop policy if exists "comentarios: crear el propio" on public.comentarios;
create policy "comentarios: crear el propio" on public.comentarios
    for insert to authenticated with check (usuario_id = (select auth.uid()) and not oculto);
drop policy if exists "comentarios: borrar el propio" on public.comentarios;
create policy "comentarios: borrar el propio" on public.comentarios
    for delete to authenticated using (usuario_id = (select auth.uid()));

-- Reportes: con sesión se puede reportar (una vez por comentario) y ver los propios
drop policy if exists "reportes: crear" on public.reportes_comentario;
create policy "reportes: crear" on public.reportes_comentario
    for insert to authenticated with check (usuario_id = (select auth.uid()));
drop policy if exists "reportes: ver los propios" on public.reportes_comentario;
create policy "reportes: ver los propios" on public.reportes_comentario
    for select to authenticated using (usuario_id = (select auth.uid()));

-- Datos personales: solo el dueño puede verlos, crearlos, cambiarlos o borrarlos
drop policy if exists "datos_usuario: ver los propios" on public.datos_usuario;
create policy "datos_usuario: ver los propios" on public.datos_usuario
    for select to authenticated using (usuario_id = (select auth.uid()));
drop policy if exists "datos_usuario: crear los propios" on public.datos_usuario;
create policy "datos_usuario: crear los propios" on public.datos_usuario
    for insert to authenticated with check (usuario_id = (select auth.uid()));
drop policy if exists "datos_usuario: cambiar los propios" on public.datos_usuario;
create policy "datos_usuario: cambiar los propios" on public.datos_usuario
    for update to authenticated using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
drop policy if exists "datos_usuario: borrar los propios" on public.datos_usuario;
create policy "datos_usuario: borrar los propios" on public.datos_usuario
    for delete to authenticated using (usuario_id = (select auth.uid()));

-- Permisos de las vistas públicas
grant select on public.docentes_con_promedio to anon, authenticated;
grant select on public.comentarios_publicos to anon, authenticated;
