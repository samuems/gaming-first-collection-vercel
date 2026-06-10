import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";
import {
  COPIES_FOR_LEVEL,
  MAX_LEVEL,
  powerAtLevel,
  speedAtLevel,
} from "@/lib/game/progression";
import type { Unit, PlayerUnit } from "@/types/database";

/**
 * POST /api/collection/levelup
 *
 * Levels up one unit by one level if the player has accumulated enough copies.
 * Copies are never consumed — they are permanent progress counters.
 * Call this endpoint multiple times to advance through several levels at once.
 *
 * Body: { "unitId": "<uuid>" }
 *
 * Errors:
 *   400 — missing/invalid body
 *   404 — unit not in player's collection
 *   409 — already max level, or not enough copies
 *   500 — DB error
 *
 * Success 200:
 * {
 *   unitId, previousLevel, level, power, speed,
 *   copiesOwned, copiesForNextLevel,
 *   canLevelUpAgain   — true if the player has enough copies to level up again
 * }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { operator, playerId } = auth;

  // ── Parse body ────────────────────────────────────────────────────────────
  let unitId: string;
  try {
    const body = await req.json();
    if (!body?.unitId || typeof body.unitId !== "string") throw new Error();
    unitId = body.unitId;
  } catch {
    return NextResponse.json(
      { error: 'Body must be JSON with a "unitId" string field.' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // ── Fetch player's unit ───────────────────────────────────────────────────
  const { data: puRaw, error: puError } = await supabase
    .from("player_units")
    .select("*")
    .eq("operator_id", operator.id)
    .eq("player_id", playerId)
    .eq("unit_id", unitId)
    .single();

  if (puError || !puRaw) {
    return NextResponse.json(
      { error: "Unit not found in this player's collection." },
      { status: 404 }
    );
  }

  const pu = puRaw as PlayerUnit;

  // ── Guard: max level ──────────────────────────────────────────────────────
  if (pu.level >= MAX_LEVEL) {
    return NextResponse.json(
      { error: `Unit is already at max level (${MAX_LEVEL}).`, level: pu.level },
      { status: 409 }
    );
  }

  // ── Guard: not enough copies ──────────────────────────────────────────────
  const copiesNeeded = COPIES_FOR_LEVEL[pu.level] as number;
  if (pu.copies_owned < copiesNeeded) {
    return NextResponse.json(
      {
        error: "Not enough copies to level up.",
        copiesOwned: pu.copies_owned,
        copiesNeeded,
        missing: copiesNeeded - pu.copies_owned,
      },
      { status: 409 }
    );
  }

  // ── Fetch base stats from the unit catalog ────────────────────────────────
  const { data: unitRaw } = await supabase
    .from("units")
    .select("base_power, base_speed")
    .eq("id", unitId)
    .single();

  const baseUnit = unitRaw as Pick<Unit, "base_power" | "base_speed"> | null;
  if (!baseUnit) {
    return NextResponse.json({ error: "Unit not found in catalog." }, { status: 500 });
  }

  // ── Apply level up ────────────────────────────────────────────────────────
  const newLevel = pu.level + 1;
  const newPower = powerAtLevel(baseUnit.base_power, newLevel);
  const newSpeed = speedAtLevel(baseUnit.base_speed, newLevel);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updatedRaw, error: updateError } = await (supabase as any)
    .from("player_units")
    .update({ level: newLevel, current_power: newPower, current_speed: newSpeed })
    .eq("id", pu.id)
    .select()
    .single();

  if (updateError || !updatedRaw) {
    return NextResponse.json({ error: "Failed to apply level up." }, { status: 500 });
  }

  const updated = updatedRaw as PlayerUnit;
  const nextThreshold = COPIES_FOR_LEVEL[updated.level] ?? null;
  const canLevelUpAgain =
    updated.level < MAX_LEVEL &&
    nextThreshold !== null &&
    updated.copies_owned >= nextThreshold;

  return NextResponse.json({
    unitId,
    previousLevel: pu.level,
    level: updated.level,
    power: updated.current_power,
    speed: updated.current_speed,
    copiesOwned: updated.copies_owned,
    copiesForNextLevel: nextThreshold,
    canLevelUpAgain,
  });
}
