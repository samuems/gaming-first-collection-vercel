import { NextRequest, NextResponse } from "next/server";
import { requireOperatorAuth } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";
import type { Unit, OperatorUnitOverride } from "@/types/database";

/**
 * GET /api/theme
 *
 * Returns the full unit catalog with this operator's current overrides applied.
 * Units that have no override show their global name/image.
 *
 * Header: x-operator-key
 *
 * Response:
 * {
 *   operatorId: string,
 *   overridesApplied: number,
 *   units: Array<{
 *     unitId, rarity, affinity, season,
 *     global: { name, image },
 *     override: { name: string|null, image: string|null },
 *     effective: { name, image }   — what players actually see
 *   }>
 * }
 */
export async function GET(req: NextRequest) {
  const auth = await requireOperatorAuth(req);
  if (!auth.ok) return auth.response;

  const { operator } = auth;
  const supabase = createServiceClient();

  const [{ data: unitsRaw }, { data: overridesRaw }] = await Promise.all([
    supabase.from("units").select("*").order("rarity").order("name"),
    supabase
      .from("operator_unit_overrides")
      .select("*")
      .eq("operator_id", operator.id),
  ]);

  const overrideMap = new Map<string, OperatorUnitOverride>();
  for (const o of (overridesRaw ?? []) as OperatorUnitOverride[]) {
    overrideMap.set(o.unit_id, o);
  }

  const units = (unitsRaw ?? []) as Unit[];
  const result = units.map((unit) => {
    const ov = overrideMap.get(unit.id);
    return {
      unitId: unit.id,
      rarity: unit.rarity,
      affinity: unit.affinity,
      season: unit.season,
      global: { name: unit.name, image: unit.image },
      override: { name: ov?.name_override ?? null, image: ov?.image_override ?? null },
      effective: {
        name: ov?.name_override ?? unit.name,
        image: ov?.image_override ?? unit.image,
      },
    };
  });

  return NextResponse.json({
    operatorId: operator.id,
    overridesApplied: overrideMap.size,
    units: result,
  });
}

/**
 * PUT /api/theme
 *
 * Upserts theme overrides for one or more units. Send only the units you
 * want to override — existing overrides for other units are left untouched.
 * To remove an override, set nameOverride and imageOverride both to null.
 *
 * Header: x-operator-key
 *
 * Body: Array<{
 *   unitId: string,
 *   nameOverride?: string | null,
 *   imageOverride?: string | null
 * }>
 *
 * Response: { updated: number, removed: number }
 */
export async function PUT(req: NextRequest) {
  const auth = await requireOperatorAuth(req);
  if (!auth.ok) return auth.response;

  const { operator } = auth;

  let entries: { unitId: string; nameOverride?: string | null; imageOverride?: string | null }[];
  try {
    const body = await req.json();
    if (!Array.isArray(body) || body.length === 0) throw new Error();
    entries = body;
  } catch {
    return NextResponse.json(
      { error: "Body must be a non-empty JSON array of { unitId, nameOverride?, imageOverride? }." },
      { status: 400 }
    );
  }

  // Validate all unitIds are strings
  for (const e of entries) {
    if (!e?.unitId || typeof e.unitId !== "string") {
      return NextResponse.json(
        { error: 'Each entry must have a "unitId" string.' },
        { status: 400 }
      );
    }
  }

  const supabase = createServiceClient();

  // Split: entries with both null = remove override; others = upsert
  const toRemove = entries.filter(
    (e) => (e.nameOverride ?? null) === null && (e.imageOverride ?? null) === null
  );
  const toUpsert = entries.filter(
    (e) => (e.nameOverride ?? null) !== null || (e.imageOverride ?? null) !== null
  );

  let updated = 0;
  let removed = 0;

  if (toUpsert.length > 0) {
    const rows = toUpsert.map((e) => ({
      operator_id: operator.id,
      unit_id: e.unitId,
      name_override: e.nameOverride ?? null,
      image_override: e.imageOverride ?? null,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("operator_unit_overrides")
      .upsert(rows, { onConflict: "operator_id,unit_id" });

    if (!error) updated = toUpsert.length;
  }

  if (toRemove.length > 0) {
    const ids = toRemove.map((e) => e.unitId);
    const { error } = await supabase
      .from("operator_unit_overrides")
      .delete()
      .eq("operator_id", operator.id)
      .in("unit_id", ids);

    if (!error) removed = toRemove.length;
  }

  return NextResponse.json({ updated, removed });
}
