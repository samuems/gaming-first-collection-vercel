-- ============================================================
-- GFC — Themes (Phase MVP1.5)
-- Apply via: supabase db push  OR  paste into Supabase SQL editor
-- ============================================================

-- Reusable theme templates (name + set of unit overrides)
create table if not exists themes (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  created_at  timestamptz not null default now()
);

-- Per-unit overrides within a theme
create table if not exists theme_unit_overrides (
  theme_id       uuid  not null references themes(id) on delete cascade,
  unit_id        uuid  not null references units(id)  on delete cascade,
  name_override  text,
  image_override text,
  primary key (theme_id, unit_id)
);

-- Per-affinity label overrides within a theme (e.g. "Lightning" → "Quarterback")
create table if not exists theme_affinity_overrides (
  theme_id  uuid  not null references themes(id) on delete cascade,
  affinity  text  not null,
  label     text  not null,
  primary key (theme_id, affinity)
);

-- Link each operator to an optional theme
alter table operators
  add column if not exists theme_id uuid references themes(id) on delete set null;
