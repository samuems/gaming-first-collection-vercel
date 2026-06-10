import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";
import {
  COPIES_FOR_LEVEL,
  MAX_LEVEL,
  powerAtLevel,
  speedAtLevel,
} from "@/lib/game/progression";
import type { Unit, PlayerUnit, OperatorUnitOverride, Rarity } from "@/types/database";

// ── Drop table ────────────────────────────────────────────────────────────────
// Source: PLAN.md Phase 11
const DROP_ODDS: Record<Rarity, number> = {
  Common:    74,
  Rare:      23,
  Epic:       2,
  Legendary:  1,
};

function drawRarity(): Rarity {
  const roll = Math.random() * 100;
  if (roll < 1)  return "Legendary";  //  0–1   = 1%
  if (roll < 3)  return "Epic";       //  1–3   = 2%
  if (roll < 26) return "Rare";       //  3–26  = 23%
  return "Common";                    // 26–100 = 74%
}

// ── Auto level-up cascade ─────────────────────────────────────────────────────
// Called after copies_owned is incremented. Keeps leveling up while the
// player has enough copies, potentially jumping multiple levels at once.

async function applyAutoLevelUps(
  supabase: ReturnType<typeof createServiceClient>,
  pu: PlayerUnit,
  basePower: number,
  baseSpeed: number
): Promise<{ previousLevel: number; newLevel: number; levelsGained: number }> {
  const previousLevel = pu.level;
  let level = pu.level;
  let copies = pu.copies_owned;

  while (level < MAX_LEVEL) {
    const needed = COPIES_FOR_LEVEL[level];
    if (needed === null || copies < needed) break;
    level++;
  }

  if (level > previousLevel) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("player_units")
      .update({
        level,
        current_power: powerAtLevel(basePower, level),
        current_speed: speedAtLevel(baseSpeed, level),
      })
      .eq("id", pu.id);
  }

  return { previousLevel, newLevel: level, levelsGained: level - previousLevel };
}

// ── POST /api/chest/open ──────────────────────────────────────────────────────
/**
 * Opens one chest for the authenticated player.
 *
 * Drop table (PLAN.md Phase 11):
 *   Common 74% · Rare 23% · Epic 2% · Legendary 1%
 *
 * Outcomes:
 *   New unit    → inserted into player_units at Level 1 with base stats.
 *   Duplicate   → copies_owned++ then auto-levels up if threshold is reached
 *                 (can cascade through multiple levels in one chest open).
 *
 * Response:
 * {
 *   draw: { rarity, odds }          — what was rolled
 *   unit: {
 *     unitId, name, image, rarity, affinity, season,
 *     isNew, level, copiesOwned, copiesForNextLevel, power, speed
 *   },
 *   leveledUp: boolean,
 *   previousLevel: number | null,   — null if isNew
 *   levelsGained: number
 * }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { operator, playerId } = auth;
  const supabase = createServiceClient();

  // ── 1. Roll rarity ────────────────────────────────────────────────────────
  const rarity = drawRarity();

  // ── 2. Pick a random unit of that rarity ──────────────────────────────────
  const { data: poolRaw, error: poolError } = await supabase
    .from("units")
    .select("*")
    .eq("rarity", rarity);

  if (poolError || !poolRaw || poolRaw.length === 0) {
    return NextResponse.json(
      { error: `No units found for rarity "${rarity}". Check seed data.` },
      { status: 500 }
    );
  }

  const pool = poolRaw as Unit[];
  const unit = pool[Math.floor(Math.random() * pool.length)];

  // ── 3. Fetch operator override (for name/image) ───────────────────────────
  const { data: overrideRaw } = await supabase
    .from("operator_unit_overrides")
    .select("*")
    .eq("operator_id", operator.id)
    .eq("unit_id", unit.id)
    .single();

  const override = overrideRaw as OperatorUnitOverride | null;

  // ── 4. Fetch existing player_unit (if any) ────────────────────────────────
  const { data: existingRaw } = await supabase
    .from("player_units")
    .select("*")
    .eq("operator_id", operator.id)
    .eq("player_id", playerId)
    .eq("unit_id", unit.id)
    .single();

  const existing = existingRaw as PlayerUnit | null;

  // ── 5. New unit ───────────────────────────────────────────────────────────
  if (!existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertedRaw } = await (supabase as any)
      .from("player_units")
      .insert({
        operator_id: operator.id,
        player_id: playerId,
        unit_id: unit.id,
        copies_owned: 1,
        level: 1,
        current_power: unit.base_power,
        current_speed: unit.base_speed,
      })
      .select()
      .single();

    const inserted = insertedRaw as PlayerUnit;

    return NextResponse.json({
      draw: { rarity, odds: DROP_ODDS[rarity] },
      unit: {
        unitId: unit.id,
        name: override?.name_override ?? unit.name,
        image: override?.image_override ?? unit.image,
        rarity: unit.rarity,
        affinity: unit.affinity,
        season: unit.season,
        isNew: true,
        level: inserted?.level ?? 1,
        copiesOwned: inserted?.copies_owned ?? 1,
        copiesForNextLevel: COPIES_FOR_LEVEL[1],
        power: inserted?.current_power ?? unit.base_power,
        speed: inserted?.current_speed ?? unit.base_speed,
      },
      leveledUp: false,
      previousLevel: null,
      levelsGained: 0,
    });
  }

  // ── 6. Duplicate — increment copies ──────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updatedRaw } = await (supabase as any)
    .from("player_units")
    .update({ copies_owned: existing.copies_owned + 1 })
    .eq("id", existing.id)
    .select()
    .single();

  const afterCopies = (updatedRaw as PlayerUnit) ?? {
    ...existing,
    copies_owned: existing.copies_owned + 1,
  };

  // ── 7. Auto level-up cascade ──────────────────────────────────────────────
  const { previousLevel, newLevel, levelsGained } = await applyAutoLevelUps(
    supabase,
    afterCopies,
    unit.base_power,
    unit.base_speed
  );

  const finalPower = powerAtLevel(unit.base_power, newLevel);
  const finalSpeed = speedAtLevel(unit.base_speed, newLevel);

  return NextResponse.json({
    draw: { rarity, odds: DROP_ODDS[rarity] },
    unit: {
      unitId: unit.id,
      name: override?.name_override ?? unit.name,
      image: override?.image_override ?? unit.image,
      rarity: unit.rarity,
      affinity: unit.affinity,
      season: unit.season,
      isNew: false,
      level: newLevel,
      copiesOwned: afterCopies.copies_owned,
      copiesForNextLevel: COPIES_FOR_LEVEL[newLevel] ?? null,
      power: finalPower,
      speed: finalSpeed,
    },
    leveledUp: levelsGained > 0,
    previousLevel,
    levelsGained,
  });
}
