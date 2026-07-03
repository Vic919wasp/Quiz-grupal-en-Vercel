-- ══════════════════════════════════════════════════════════════════
-- QUIZ GRUPAL — Setup de tablas en Supabase
-- Pegar todo esto en Supabase → SQL Editor → New query → Run
-- ══════════════════════════════════════════════════════════════════

-- ── Tabla: grupos ─────────────────────────────────────────────────
create table if not exists grupos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  email       text,
  escuela     text not null,
  curso       text not null,
  fecha       text,
  version     text default 'A',
  alumnos     int  default 0,
  created_at  timestamptz default now()
);

-- ── Tabla: alumnos ────────────────────────────────────────────────
create table if not exists alumnos (
  id          uuid primary key default gen_random_uuid(),
  grupo_id    uuid references grupos(id) on delete cascade not null,
  user_id     uuid references auth.users not null,
  nro_alumno  text,
  escuela     text,
  curso       text,
  fecha       text,
  version     text,
  alu_id      text,
  answers     jsonb,
  ins         jsonb,
  gar         jsonb,
  op          jsonb,
  d_i         text,
  d_g         text,
  created_at  timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────────
alter table grupos  enable row level security;
alter table alumnos enable row level security;

-- Grupos: cada usuario solo ve y edita los suyos
create policy "grupos_select" on grupos for select using (auth.uid() = user_id);
create policy "grupos_insert" on grupos for insert with check (auth.uid() = user_id);
create policy "grupos_update" on grupos for update using (auth.uid() = user_id);
create policy "grupos_delete" on grupos for delete using (auth.uid() = user_id);

-- Alumnos: cada usuario solo ve y edita los de sus grupos
create policy "alumnos_select" on alumnos for select using (auth.uid() = user_id);
create policy "alumnos_insert" on alumnos for insert with check (auth.uid() = user_id);
create policy "alumnos_update" on alumnos for update using (auth.uid() = user_id);
create policy "alumnos_delete" on alumnos for delete using (auth.uid() = user_id);

-- ── Índices ───────────────────────────────────────────────────────
create index if not exists idx_grupos_user  on grupos(user_id);
create index if not exists idx_alumnos_grupo on alumnos(grupo_id);
create index if not exists idx_alumnos_user  on alumnos(user_id);
