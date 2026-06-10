import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";
import type { Lineup, Unit, PlayerUnit, OperatorUnitOverride } from "@/types/database";

// ── Shared: build slot detail array ──────────────────────────────────────────

type SlotUnit = {
  unitId: string;
  name: string;
  image: string | null;
  rarity: string;
  affinity: string;
  season: number;
  level: number;
  power: number;
  speed: number;
};

async function buildSlots(
  supabase: ReturnType<typeof createServiceClient>,
  lineup: Lineup,
  operatorId: string,
  playerId: string
): Promise<({ position: number; unit: SlotUnit | null })[]> {
  const slotFields = [lineup.slot1, lineup.slot2, lineup.slot3, lineup.slot4, lineup.slot5];
  const unitIds = slotFields.filter(Boolean) as string[];

  if (unitIds.length === 0) {
    return Array.from({ length: 5 }, (_, i) => ({ position: i + 1, unit: null }));
  }

  // Fetch unit catalog entries
  const { data: unitsRaw } = await supabase.from("units").select("*").in("id", unitIds);
  const unitMap = new Map<string, Unit>();
  for (const u of (unitsRaw ?? []) as Unit[]) unitMap.set(u.id, u);

  // Fetch player stats for these units
  const { data: puRaw } = await supabase
    .from("player_units")
    .select("*")
    .eq("operator_id", operatorId)
    .eq("player_id", playerId)
    .in("unit_id", unitIds);
  const puMap = new Map<string, PlayerUnit>();
  for (const pu of (puRaw ?? []) as PlayerUnit[]) puMap.set(pu.unit_id, pu);

  // Fetch operator overrides
  const { data: overridesRaw } = await supabase
    .from("operator_unit_overrides")
    .select("*")
    .eq("operator_id", operatorId)
    .in("unit_id", unitIds);
  const overrideMap = new Map<string, OperatorUnitOverride>();
  for (const o of (overridesRaw ?? []) as OperatorUnitOverride[]) overrideMap.set(o.unit_id, o);

  return slotFields.map((unitId, idx) => {
    if (!unitId) return { position: idx + 1, unit: null };

    const unit = unitMap.get(unitId);
    const pu = puMap.get(unitId);
    const override = overrideMap.get(unitId);

    if (!unit) return { position: idx + 1, unit: null };

    return {
      position: idx + 1,
      unit: {
        unitId: unit.id,
        name: override?.name_override ?? unit.name,
        image: override?.image_override ?? unit.image,
        rarity: unit.rarity,
        affinity: unit.affinity,
        season: unit.season,
        level: pu?.level ?? 1,
        power: pu?.current_power ?? unit.base_power,
        speed: pu?.current_speed ?? unit.base_speed,
      },
    };
  });
}

// ── GET /api/lineup ───────────────────────────────────────────────────────────
/**
 * Returns the player's current lineup. If no lineup has been saved yet,
 * returns a response with 5 empty slots and locked: false.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { operator, playerId } = auth;
  const supabase = createServiceClient();

  const { data: lineupRaw } = await supabase
    .from("lineups")
    .select("*")
    .eq("operator_id", operator.id)
    .eq("player_id", playerId)
    .single();

  if (!lineupRaw) {
    return NextResponse.json({
      playerId,
      locked: false,
      updatedAt: null,
      slots: Array.from({ length: 5 }, (_, i) => ({ position: i + 1, unit: null })),
    });
  }

  const lineup = lineupRaw as Lineup;
  const slots = await buildSlots(supabase, lineup, operator.id, playerId);

  return NextResponse.json({
    playerId,
    locked: lineup.locked,
    updatedAt: lineup.updated_at,
    slots,
  });
}

// ── PUT /api/lineup ───────────────────────────────────────────────────────────
/**
 * Saves the player's lineup.
 *
 * Body: { "slots": ["<unitId>", "<unitId>", "<unitId>", "<unitId>", "<unitId>"] }
 *   - Exactly 5 elements.
 *   - Each element is a unit UUID or null for an empty slot.
 *   - No duplicate unit IDs.
 *   - All non-null IDs must be in the player's collection.
 *
 * Errors:
 *   400 — bad body / bad slot count / duplicates
 *   403 — lineup is locked (tournament in progress)
 *   404 — one or more units not in player's collection
 *   500 — DB write error
 */
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { operator, playerId } = auth;

  // ── Parse + validate body ─────────────────────────────────────────────────
  let slots: (string | null)[];
  try {
    const body = await req.json();
    if (!Array.isArray(body?.slots)) throw new Error();
    slots = body.slots;
  } catch {
    return NextResponse.json(
      { error: 'Body must be JSON: { "slots": [<unitId|null>, ...] }' },
      { status: 400 }
    );
  }

  if (slots.length !== 5) {
    return NextResponse.json(
      { error: "slots must contain exactly 5 elements (use null for empty slots)." },
      { status: 400 }
    );
  }

  const nonNull = slots.filter((s): s is string => s !== null && s !== undefined);

  // Validate each non-null slot is a non-empty string
  for (const s of nonNull) {
    if (typeof s !== "string" || s.trim() === "") {
      return NextResponse.json(
        { error: "Each slot must be a unit UUID string or null." },
        { status: 400 }
      );
    }
  }

  // No duplicates
  const unique = new Set(nonNull);
  if (unique.size !== nonNull.length) {
    return NextResponse.json(
      { error: "Duplicate unit IDs are not allowed in a lineup." },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // ── Check lock ────────────────────────────────────────────────────────────
  const { data: existingRaw } = await supabase
    .from("lineups")
    .select("locked")
    .eq("operator_id", operator.id)
    .eq("player_id", playerId)
    .single();

  if (existingRaw && (existingRaw as Pick<Lineup, "locked">).locked) {
    return NextResponse.json(
      { error: "Lineup is locked while a tournament is in progress." },
      { status: 403 }
    );
  }

  // ── Validate all units are in player's collection ─────────────────────────
  if (nonNull.length > 0) {
    const { data: ownedRaw } = await supabase
      .from("player_units")
      .select("unit_id")
      .eq("operator_id", operator.id)
      .eq("player_id", playerId)
      .in("unit_id", nonNull);

    const owned = new Set((ownedRaw ?? []).map((r) => (r as Pick<PlayerUnit, "unit_id">).unit_id));
    const missing = nonNull.filter((id) => !owned.has(id));

    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Unit(s) not in player collection.", missing },
        { status: 404 }
      );
    }
  }

  // ── Upsert lineup ─────────────────────────────────────────────────────────
  const row = {
    operator_id: operator.id,
    player_id: playerId,
    slot1: slots[0] ?? null,
    slot2: slots[1] ?? null,
    slot3: slots[2] ?? null,
    slot4: slots[3] ?? null,
    slot5: slots[4] ?? null,
    locked: false,
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: savedRaw, error: saveError } = await (supabase as any)
    .from("lineups")
    .upsert(row, { onConflict: "operator_id,player_id" })
    .select()
    .single();

  if (saveError || !savedRaw) {
    return NextResponse.json({ error: "Failed to save lineup." }, { status: 500 });
  }

  const saved = savedRaw as Lineup;
  const resultSlots = await buildSlots(supabase, saved, operator.id, playerId);

  return NextResponse.json({
    playerId,
    locked: saved.locked,
    updatedAt: saved.updated_at,
    slots: resultSlots,
  });
}
