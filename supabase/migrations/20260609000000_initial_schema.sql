-- ============================================================
-- GFC Framework — Initial Schema (Phase 2)
-- Apply via: supabase db push  OR  paste into Supabase SQL editor
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Helpers ──────────────────────────────────────────────────
create or replace function generate_api_key()
returns text language sql as $$
  select 'gfc_' || encode(gen_random_bytes(24), 'hex');
$$;

-- ============================================================
-- 1. OPERATORS
--    One row per casino client. API key is used by all player
--    API calls to scope data to this operator.
-- ============================================================
create table operators (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  api_key     text        not null unique default generate_api_key(),
  status      text        not null default 'active'
                          check (status in ('active', 'suspended', 'draft')),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 2. UNITS  (global catalog — admin managed)
--    Operators inherit this. Theme overrides live in
--    operator_unit_overrides.
-- ============================================================
create table units (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  image       text,                              -- URL to artwork
  rarity      text        not null
                          check (rarity in ('Common', 'Rare', 'Epic', 'Legendary')),
  affinity    text        not null
                          check (affinity in (
                            'Air', 'Earth', 'Lightning', 'Water', 'Fire',
                            'Ice', 'Nature', 'Light', 'Shadow'
                          )),
  base_power  int         not null check (base_power > 0),
  base_speed  int         not null check (base_speed > 0),
  season      int         not null default 1,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 3. OPERATOR UNIT OVERRIDES  (theme layer — Phase 12)
--    Operators can rename units and swap images without
--    touching the global catalog.
-- ============================================================
create table operator_unit_overrides (
  id             uuid  primary key default gen_random_uuid(),
  operator_id    uuid  not null references operators(id) on delete cascade,
  unit_id        uuid  not null references units(id) on delete cascade,
  name_override  text,
  image_override text,
  unique (operator_id, unit_id)
);

-- ============================================================
-- 4. PLAYER UNITS  (collection per operator + player)
--    player_id is the casino's own internal ID (string).
--    Copies drive the level-up system (Phase 5).
-- ============================================================
create table player_units (
  id             uuid        primary key default gen_random_uuid(),
  operator_id    uuid        not null references operators(id) on delete cascade,
  player_id      text        not null,
  unit_id        uuid        not null references units(id) on delete cascade,
  copies_owned   int         not null default 1 check (copies_owned >= 1),
  level          int         not null default 1 check (level >= 1),
  current_power  int         not null,
  current_speed  int         not null,
  created_at     timestamptz not null default now(),
  unique (operator_id, player_id, unit_id)
);

create index player_units_lookup on player_units (operator_id, player_id);

-- ============================================================
-- 5. LINEUPS  (one active lineup per operator + player)
--    slot1–slot5 store unit IDs. Order matters for battle.
--    locked = true while a tournament is in progress.
-- ============================================================
create table lineups (
  id           uuid        primary key default gen_random_uuid(),
  operator_id  uuid        not null references operators(id) on delete cascade,
  player_id    text        not null,
  slot1        uuid        references units(id),
  slot2        uuid        references units(id),
  slot3        uuid        references units(id),
  slot4        uuid        references units(id),
  slot5        uuid        references units(id),
  locked       boolean     not null default false,
  updated_at   timestamptz not null default now(),
  unique (operator_id, player_id)
);

-- ============================================================
-- 6. TOURNAMENTS  (scoped to operator)
-- ============================================================
create table tournaments (
  id           uuid        primary key default gen_random_uuid(),
  operator_id  uuid        not null references operators(id) on delete cascade,
  name         text        not null,
  status       text        not null default 'pending'
                           check (status in ('pending', 'active', 'completed')),
  start_time   timestamptz,
  end_time     timestamptz,
  created_at   timestamptz not null default now()
);

create index tournaments_operator on tournaments (operator_id, status);

-- ============================================================
-- 7. BATTLE LOGS  (scoped to operator + player)
--    rounds is a JSONB array — one entry per round (1–5).
--    See types/database.ts for the Round shape.
-- ============================================================
create table battle_logs (
  id             uuid        primary key default gen_random_uuid(),
  operator_id    uuid        not null references operators(id) on delete cascade,
  tournament_id  uuid        references tournaments(id) on delete set null,
  player_id      text        not null,
  opponent_name  text        not null,
  result         text        not null check (result in ('win', 'loss', 'draw')),
  rounds         jsonb       not null default '[]',
  created_at     timestamptz not null default now()
);

create index battle_logs_lookup on battle_logs (operator_id, player_id, created_at desc);

-- ============================================================
-- Row Level Security
-- All writes go through server-side API routes (service_role)
-- so RLS just prevents accidental direct anon access.
-- ============================================================
alter table operators              enable row level security;
alter table units                  enable row level security;
alter table operator_unit_overrides enable row level security;
alter table player_units           enable row level security;
alter table lineups                enable row level security;
alter table tournaments            enable row level security;
alter table battle_logs            enable row level security;

-- Service role bypasses RLS automatically — no policy needed for it.
-- Block everything from anon/authenticated roles (all access via API).
create policy "deny anon" on operators              for all to anon using (false);
create policy "deny anon" on units                  for all to anon using (false);
create policy "deny anon" on operator_unit_overrides for all to anon using (false);
create policy "deny anon" on player_units           for all to anon using (false);
create policy "deny anon" on lineups               for all to anon using (false);
create policy "deny anon" on tournaments            for all to anon using (false);
create policy "deny anon" on battle_logs            for all to anon using (false);
