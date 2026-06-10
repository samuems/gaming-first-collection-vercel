/**
 * Phase 3 — Seed Data
 * Inserts 60 units into the global catalog:
 *   24 Common · 18 Rare · 12 Epic · 6 Legendary
 *   across all 9 affinities (Air/Earth/Lightning/Water/Fire/Ice/Nature/Light/Shadow)
 *
 * Run: npm run db:seed
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

// ---------------------------------------------------------------------------
// Load env (tsx doesn't auto-load .env.local — read manually)
// ---------------------------------------------------------------------------
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // env already set (CI / Vercel)
  }
}

loadEnv();

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ---------------------------------------------------------------------------
// Unit definitions
// Stats scale by rarity: Common < Rare < Epic < Legendary
// ---------------------------------------------------------------------------

type UnitSeed = {
  name: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  affinity:
    | "Air"
    | "Earth"
    | "Lightning"
    | "Water"
    | "Fire"
    | "Ice"
    | "Nature"
    | "Light"
    | "Shadow";
  base_power: number;
  base_speed: number;
  season: number;
};

const units: UnitSeed[] = [
  // ── COMMON (24) ── 2-3 per affinity ──────────────────────────────────────
  // Air (3)
  { name: "Gust Sprite",   rarity: "Common", affinity: "Air",       base_power: 10, base_speed: 14, season: 1 },
  { name: "Wind Hawk",     rarity: "Common", affinity: "Air",       base_power: 12, base_speed: 16, season: 1 },
  { name: "Storm Finch",   rarity: "Common", affinity: "Air",       base_power: 11, base_speed: 13, season: 1 },
  // Earth (3)
  { name: "Stone Crab",    rarity: "Common", affinity: "Earth",     base_power: 15, base_speed: 8,  season: 1 },
  { name: "Mud Toad",      rarity: "Common", affinity: "Earth",     base_power: 13, base_speed: 9,  season: 1 },
  { name: "Rock Beetle",   rarity: "Common", affinity: "Earth",     base_power: 14, base_speed: 10, season: 1 },
  // Lightning (3)
  { name: "Spark Fly",     rarity: "Common", affinity: "Lightning", base_power: 11, base_speed: 15, season: 1 },
  { name: "Bolt Lizard",   rarity: "Common", affinity: "Lightning", base_power: 13, base_speed: 14, season: 1 },
  { name: "Zap Frog",      rarity: "Common", affinity: "Lightning", base_power: 10, base_speed: 16, season: 1 },
  // Water (3)
  { name: "Wave Crab",     rarity: "Common", affinity: "Water",     base_power: 12, base_speed: 12, season: 1 },
  { name: "Tide Fish",     rarity: "Common", affinity: "Water",     base_power: 11, base_speed: 13, season: 1 },
  { name: "Stream Turtle", rarity: "Common", affinity: "Water",     base_power: 14, base_speed: 9,  season: 1 },
  // Fire (3)
  { name: "Ember Moth",    rarity: "Common", affinity: "Fire",      base_power: 13, base_speed: 13, season: 1 },
  { name: "Cinder Fox",    rarity: "Common", affinity: "Fire",      base_power: 15, base_speed: 12, season: 1 },
  { name: "Flame Newt",    rarity: "Common", affinity: "Fire",      base_power: 12, base_speed: 14, season: 1 },
  // Ice (3)
  { name: "Frost Beetle",  rarity: "Common", affinity: "Ice",       base_power: 14, base_speed: 10, season: 1 },
  { name: "Chill Hare",    rarity: "Common", affinity: "Ice",       base_power: 10, base_speed: 16, season: 1 },
  { name: "Snow Cub",      rarity: "Common", affinity: "Ice",       base_power: 12, base_speed: 12, season: 1 },
  // Nature (3)
  { name: "Leaf Sprite",   rarity: "Common", affinity: "Nature",    base_power: 11, base_speed: 13, season: 1 },
  { name: "Thorn Shrub",   rarity: "Common", affinity: "Nature",    base_power: 13, base_speed: 11, season: 1 },
  { name: "Vine Crawler",  rarity: "Common", affinity: "Nature",    base_power: 12, base_speed: 10, season: 1 },
  // Light (3) — but we only need 3 to total 24 with Shadow having 0 extra
  { name: "Glow Moth",     rarity: "Common", affinity: "Light",     base_power: 11, base_speed: 14, season: 1 },
  { name: "Dawn Bird",     rarity: "Common", affinity: "Light",     base_power: 12, base_speed: 13, season: 1 },
  // Shadow (1)
  { name: "Dusk Bat",      rarity: "Common", affinity: "Shadow",    base_power: 14, base_speed: 13, season: 1 },

  // ── RARE (18) ── 2 per affinity ──────────────────────────────────────────
  { name: "Cyclone Eagle",    rarity: "Rare", affinity: "Air",       base_power: 25, base_speed: 32, season: 1 },
  { name: "Tempest Lynx",     rarity: "Rare", affinity: "Air",       base_power: 28, base_speed: 30, season: 1 },
  { name: "Granite Bear",     rarity: "Rare", affinity: "Earth",     base_power: 35, base_speed: 20, season: 1 },
  { name: "Quake Rhino",      rarity: "Rare", affinity: "Earth",     base_power: 33, base_speed: 22, season: 1 },
  { name: "Thunder Wolf",     rarity: "Rare", affinity: "Lightning", base_power: 27, base_speed: 31, season: 1 },
  { name: "Static Panther",   rarity: "Rare", affinity: "Lightning", base_power: 29, base_speed: 29, season: 1 },
  { name: "Tidal Drake",      rarity: "Rare", affinity: "Water",     base_power: 30, base_speed: 27, season: 1 },
  { name: "Deep Serpent",     rarity: "Rare", affinity: "Water",     base_power: 28, base_speed: 26, season: 1 },
  { name: "Blaze Tiger",      rarity: "Rare", affinity: "Fire",      base_power: 32, base_speed: 28, season: 1 },
  { name: "Magma Lion",       rarity: "Rare", affinity: "Fire",      base_power: 34, base_speed: 24, season: 1 },
  { name: "Glacier Elk",      rarity: "Rare", affinity: "Ice",       base_power: 26, base_speed: 30, season: 1 },
  { name: "Permafrost Boar",  rarity: "Rare", affinity: "Ice",       base_power: 31, base_speed: 22, season: 1 },
  { name: "Grove Stag",       rarity: "Rare", affinity: "Nature",    base_power: 28, base_speed: 28, season: 1 },
  { name: "Bramble Bear",     rarity: "Rare", affinity: "Nature",    base_power: 33, base_speed: 23, season: 1 },
  { name: "Radiant Crane",    rarity: "Rare", affinity: "Light",     base_power: 27, base_speed: 30, season: 1 },
  { name: "Solar Falcon",     rarity: "Rare", affinity: "Light",     base_power: 29, base_speed: 32, season: 1 },
  { name: "Eclipse Raven",    rarity: "Rare", affinity: "Shadow",    base_power: 30, base_speed: 29, season: 1 },
  { name: "Void Jackal",      rarity: "Rare", affinity: "Shadow",    base_power: 32, base_speed: 27, season: 1 },

  // ── EPIC (12) ── ~1-2 per affinity ───────────────────────────────────────
  { name: "Vortex Griffin",    rarity: "Epic", affinity: "Air",       base_power: 48, base_speed: 58, season: 1 },
  { name: "Sky Leviathan",     rarity: "Epic", affinity: "Air",       base_power: 52, base_speed: 55, season: 1 },
  { name: "Tectonic Golem",    rarity: "Epic", affinity: "Earth",     base_power: 62, base_speed: 40, season: 1 },
  { name: "Ancient Tortoise",  rarity: "Epic", affinity: "Earth",     base_power: 58, base_speed: 43, season: 1 },
  { name: "Storm Dragon",      rarity: "Epic", affinity: "Lightning", base_power: 55, base_speed: 57, season: 1 },
  { name: "Plasma Hydra",      rarity: "Epic", affinity: "Lightning", base_power: 50, base_speed: 60, season: 1 },
  { name: "Abyssal Kraken",    rarity: "Epic", affinity: "Water",     base_power: 56, base_speed: 50, season: 1 },
  { name: "Inferno Phoenix",   rarity: "Epic", affinity: "Fire",      base_power: 54, base_speed: 56, season: 1 },
  { name: "Glacier Titan",     rarity: "Epic", affinity: "Ice",       base_power: 60, base_speed: 45, season: 1 },
  { name: "World Tree Spirit", rarity: "Epic", affinity: "Nature",    base_power: 53, base_speed: 52, season: 1 },
  { name: "Celestial Seraph",  rarity: "Epic", affinity: "Light",     base_power: 51, base_speed: 58, season: 1 },
  { name: "Umbra Specter",     rarity: "Epic", affinity: "Shadow",    base_power: 57, base_speed: 53, season: 1 },

  // ── LEGENDARY (6) ────────────────────────────────────────────────────────
  { name: "Sovereign Tempest",  rarity: "Legendary", affinity: "Air",    base_power: 72, base_speed: 88, season: 1 },
  { name: "Elder of Mountains", rarity: "Legendary", affinity: "Earth",  base_power: 90, base_speed: 65, season: 1 },
  { name: "Ocean's Wrath",      rarity: "Legendary", affinity: "Water",  base_power: 82, base_speed: 78, season: 1 },
  { name: "Eternal Flame",      rarity: "Legendary", affinity: "Fire",   base_power: 85, base_speed: 75, season: 1 },
  { name: "Celestial Judge",    rarity: "Legendary", affinity: "Light",  base_power: 78, base_speed: 82, season: 1 },
  { name: "The Darkness",       rarity: "Legendary", affinity: "Shadow", base_power: 88, base_speed: 72, season: 1 },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
async function seed() {
  console.log(`\n🌱 GFC Seed — Phase 3`);
  console.log(`   Inserting ${units.length} units...\n`);

  // Check if already seeded
  const { count } = await supabase
    .from("units")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    console.log(`⚠️  units table already has ${count} rows. Skipping to avoid duplicates.`);
    console.log(`   To re-seed: TRUNCATE units CASCADE; in Supabase SQL editor.`);
    process.exit(0);
  }

  const { data, error } = await supabase
    .from("units")
    .insert(units)
    .select("id, name, rarity");

  if (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }

  // Summary by rarity
  const summary: Record<string, number> = {};
  for (const u of data ?? []) {
    summary[u.rarity] = (summary[u.rarity] ?? 0) + 1;
  }

  console.log("✅ Seed complete!\n");
  console.log("   Rarity breakdown:");
  for (const [rarity, n] of Object.entries(summary)) {
    console.log(`   ${rarity.padEnd(10)} ${n} units`);
  }
  console.log(`\n   Total: ${data?.length} units inserted.`);
}

seed();
