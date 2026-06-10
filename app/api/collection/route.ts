import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { COPIES_FOR_LEVEL } from "@/lib/game/progression";
import type { Unit, PlayerUnit, OperatorUnitOverride } from "@/types/database";

// ── Starter pack ──────────────────────────────────────────────────────────────
// New players automatically receive 5 random Common units on first collection
// access. They start at Level 1 with base stats.
const STARTER_COUNT = 5;

async function initStarterPack(
  supabase: ReturnType<typeof createServiceClient>,
  operatorId: string,
  playerId: string,
  allUnits: Unit[]
): Promise<PlayerUnit[]> {
  const commons = allUnits.filter((u) => u.rarity === "Common");

  // Fisher-Yates shuffle then take STARTER_COUNT
  const pool = [...commons];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const starters = pool.slice(0, Math.min(STARTER_COUNT, pool.length));

  const rows = starters.map((unit) => ({
    operator_id: operatorId,
    player_id: playerId,
    unit_id: unit.id,
    copies_owned: 1,
    level: 1,
    current_power: unit.base_power,
    current_speed: unit.base_speed,
  }));

  // ignoreDuplicates handles the rare race-condition case where two simultaneous
  // first-calls try to init the same player.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabase
    .from("player_units")
    .upsert(rows as any, { onConflict: "operator_id,player_id,unit_id", ignoreDuplicates: true });

  // Re-fetch the actual inserted rows (upsert with ignoreDuplicates returns
  // nothing useful, so we always re-query).
  const { data } = await supabase
    .from("player_units")
    .select("*")
    .eq("operator_id", operatorId)
    .eq("player_id", playerId);

  return (data ?? []) as PlayerUnit[];
}

// ── GET /api/collection ───────────────────────────────────────────────────────
/**
 * Returns the full unit roster with collection status for the authenticated
 * player. Units are returned in a stable order: Legendary → Epic → Rare →
 * Common, then alphabetically within each rarity.
 *
 * Headers required:
 *   x-operator-key  — operator API key
 *   x-player-id     — casino's internal player identifier
 *
 * Response shape:
 * {
 *   playerId: string,
 *   stats: { owned: number, total: number, completionPct: number },
 *   units: Array<{
 *     unitId, name, image, rarity, affinity, season,
 *     owned, level, copiesOwned, copiesForNextLevel,
 *     power, speed
 *   }>
 * }
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { operator, playerId } = auth;
  const supabase = createServiceClient();

  // ── 1. Fetch global unit catalog ──────────────────────────────────────────
  const rarityOrder = { Legendary: 0, Epic: 1, Rare: 2, Common: 3 } as Record<string, number>;

  const { data: unitsRaw, error: unitsError } = await supabase
    .from("units")
    .select("*")
    .order("name");

  if (unitsError || !unitsRaw) {
    return NextResponse.json({ error: "Failed to fetch unit catalog" }, { status: 500 });
  }

  const allUnits = (unitsRaw as Unit[]).sort(
    (a, b) => (rarityOrder[a.rarity] ?? 9) - (rarityOrder[b.rarity] ?? 9)
  );

  // ── 2. Fetch operator theme overrides ─────────────────────────────────────
  const { data: overridesRaw } = await supabase
    .from("operator_unit_overrides")
    .select("*")
    .eq("operator_id", operator.id);

  const overrideMap = new Map<string, OperatorUnitOverride>();
  for (const o of (overridesRaw ?? []) as OperatorUnitOverride[]) {
    overrideMap.set(o.unit_id, o);
  }

  // ── 3. Fetch player collection (auto-init if first visit) ─────────────────
  const { data: existingRaw } = await supabase
    .from("player_units")
    .select("*")
    .eq("operator_id", operator.id)
    .eq("player_id", playerId);

  let playerUnits: PlayerUnit[];

  if (!existingRaw || existingRaw.length === 0) {
    playerUnits = await initStarterPack(supabase, operator.id, playerId, allUnits);
  } else {
    playerUnits = existingRaw as PlayerUnit[];
  }

  const playerUnitMap = new Map<string, PlayerUnit>();
  for (const pu of playerUnits) {
    playerUnitMap.set(pu.unit_id, pu);
  }

  // ── 4. Build response ─────────────────────────────────────────────────────
  const units = allUnits.map((unit) => {
    const override = overrideMap.get(unit.id);
    const pu = playerUnitMap.get(unit.id);
    const owned = !!pu;

    return {
      unitId: unit.id,
      name: override?.name_override ?? unit.name,
      image: override?.image_override ?? unit.image,
      rarity: unit.rarity,
      affinity: unit.affinity,
      season: unit.season,
      owned,
      level: pu?.level ?? 0,
      copiesOwned: pu?.copies_owned ?? 0,
      copiesForNextLevel: owned ? (COPIES_FOR_LEVEL[pu!.level] ?? null) : null,
      power: owned ? pu!.current_power : unit.base_power,
      speed: owned ? pu!.current_speed : unit.base_speed,
    };
  });

  const ownedCount = playerUnits.length;
  const totalCount = allUnits.length;

  return NextResponse.json({
    playerId,
    stats: {
      owned: ownedCount,
      total: totalCount,
      completionPct:
        totalCount > 0 ? Math.round((ownedCount / totalCount) * 1000) / 10 : 0,
    },
    units,
  });
}
