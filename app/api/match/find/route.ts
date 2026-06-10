import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { simulateBattle, type BattleUnit } from "@/lib/game/battle";
import type { Unit, PlayerUnit, Lineup } from "@/types/database";

const AI_PLAYER_ID = "ai-bot";

// ── Helpers ───────────────────────────────────────────────────────────────────

function slotIds(lineup: Lineup): string[] {
  return [
    lineup.slot1,
    lineup.slot2,
    lineup.slot3,
    lineup.slot4,
    lineup.slot5,
  ].filter(Boolean) as string[];
}

async function resolveLineup(
  supabase: ReturnType<typeof createServiceClient>,
  operatorId: string,
  playerId: string,
  ids: string[]
): Promise<BattleUnit[]> {
  const [{ data: unitsRaw }, { data: puRaw }] = await Promise.all([
    supabase
      .from("units")
      .select("id, name, affinity, base_power, base_speed")
      .in("id", ids),
    supabase
      .from("player_units")
      .select("unit_id, level, current_power, current_speed")
      .eq("operator_id", operatorId)
      .eq("player_id", playerId)
      .in("unit_id", ids),
  ]);

  const unitMap = new Map<string, Pick<Unit, "id" | "name" | "affinity" | "base_power" | "base_speed">>();
  for (const u of (unitsRaw ?? []) as Pick<Unit, "id" | "name" | "affinity" | "base_power" | "base_speed">[]) {
    unitMap.set(u.id, u);
  }

  const puMap = new Map<string, Pick<PlayerUnit, "unit_id" | "level" | "current_power" | "current_speed">>();
  for (const pu of (puRaw ?? []) as Pick<PlayerUnit, "unit_id" | "level" | "current_power" | "current_speed">[]) {
    puMap.set(pu.unit_id, pu);
  }

  return ids.map((id) => {
    const unit = unitMap.get(id)!;
    const pu = puMap.get(id);
    return {
      id,
      name: unit.name,
      affinity: unit.affinity,
      power: pu?.current_power ?? unit.base_power,
      speed: pu?.current_speed ?? unit.base_speed,
      level: pu?.level ?? 1,
    };
  });
}

// AI opponent: pick 5 random units from the catalog (seeded variety across rarities)
function buildAILineup(units: Unit[]): BattleUnit[] {
  const shuffled = [...units].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5).map((u) => ({
    id: u.id,
    name: u.name,
    affinity: u.affinity,
    power: u.base_power,
    speed: u.base_speed,
    level: 1,
  }));
}

const AI_NAMES = [
  "Shadow Bot",
  "Iron Titan",
  "Storm Runner",
  "Frost Reaper",
  "Ember Knight",
];

// ── POST /api/match/find ──────────────────────────────────────────────────────
/**
 * Finds a 1v1 opponent for the player and simulates an instant battle.
 *
 * Matching:
 *   1. Look for another player in this operator with a complete lineup (5 slots).
 *   2. If none found → generate an AI opponent from the unit catalog.
 *
 * The result is stored in battle_logs with tournament_id = null (marks it as 1v1).
 *
 * Response:
 * {
 *   matchId: string,
 *   opponent: { id: string, name: string, isAI: boolean },
 *   result: "win" | "loss" | "draw",
 *   playerRoundsWon: number,
 *   opponentRoundsWon: number,
 *   rounds: BattleRound[],
 *   summary: string
 * }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { operator, playerId } = auth;
  const supabase = createServiceClient();

  // ── 1. Get player lineup ──────────────────────────────────────────────────
  const { data: lineupRaw } = await supabase
    .from("lineups")
    .select("*")
    .eq("operator_id", operator.id)
    .eq("player_id", playerId)
    .single();

  if (!lineupRaw) {
    return NextResponse.json(
      { error: "No lineup saved. Build and save a 5-unit lineup first." },
      { status: 409 }
    );
  }

  const lineup = lineupRaw as Lineup;
  const playerSlotIds = slotIds(lineup);

  if (playerSlotIds.length !== 5) {
    return NextResponse.json(
      {
        error: `Lineup incomplete (${playerSlotIds.length}/5 slots filled). Fill all 5 slots first.`,
        filledSlots: playerSlotIds.length,
      },
      { status: 409 }
    );
  }

  // ── 2. Resolve player units ───────────────────────────────────────────────
  const playerUnits = await resolveLineup(
    supabase,
    operator.id,
    playerId,
    playerSlotIds
  );

  // ── 3. Find a real opponent ───────────────────────────────────────────────
  const { data: candidateLineups } = await supabase
    .from("lineups")
    .select("*")
    .eq("operator_id", operator.id)
    .neq("player_id", playerId)
    .limit(20);

  const validOpponents = ((candidateLineups ?? []) as Lineup[]).filter(
    (l) => slotIds(l).length === 5
  );

  let opponentUnits: BattleUnit[];
  let opponentId: string;
  let opponentName: string;
  let isAI = false;

  if (validOpponents.length > 0) {
    // Pick a random real opponent
    const oLineup = validOpponents[Math.floor(Math.random() * validOpponents.length)];
    opponentId = oLineup.player_id;
    opponentName = oLineup.player_id;
    opponentUnits = await resolveLineup(
      supabase,
      operator.id,
      opponentId,
      slotIds(oLineup)
    );
  } else {
    // AI fallback
    const { data: allUnits } = await supabase.from("units").select("*");
    const units = (allUnits ?? []) as Unit[];

    if (units.length < 5) {
      return NextResponse.json(
        { error: "Not enough units in catalog for AI opponent." },
        { status: 500 }
      );
    }

    opponentUnits = buildAILineup(units);
    opponentId = AI_PLAYER_ID;
    opponentName = AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];
    isAI = true;
  }

  // ── 4. Simulate battle ────────────────────────────────────────────────────
  const outcome = simulateBattle(playerUnits, opponentUnits);

  // ── 5. Store in battle_logs (tournament_id = null = 1v1) ──────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logRaw, error: logError } = await (supabase as any)
    .from("battle_logs")
    .insert({
      operator_id: operator.id,
      tournament_id: null,
      player_id: playerId,
      opponent_name: opponentName,
      result: outcome.result,
      rounds: outcome.rounds,
    })
    .select()
    .single();

  if (logError) {
    return NextResponse.json(
      { error: "Failed to save match result." },
      { status: 500 }
    );
  }

  const resultLabel =
    outcome.result === "win"
      ? "Victory!"
      : outcome.result === "loss"
      ? "Defeat"
      : "Draw";

  return NextResponse.json({
    matchId: logRaw.id,
    opponent: { id: opponentId, name: opponentName, isAI },
    result: outcome.result,
    playerRoundsWon: outcome.playerRoundsWon,
    opponentRoundsWon: outcome.opponentRoundsWon,
    rounds: outcome.rounds,
    summary: `${resultLabel} — ${outcome.playerRoundsWon}–${outcome.opponentRoundsWon} vs ${opponentName}`,
  });
}
