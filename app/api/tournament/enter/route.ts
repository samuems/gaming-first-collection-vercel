import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { simulateBattle, type BattleUnit } from "@/lib/game/battle";
import type { Tournament, Lineup, Unit, PlayerUnit } from "@/types/database";

// Maximum number of opponents to battle per tournament entry
const MAX_OPPONENTS = 5;

// ── Helper: resolve lineup slots → BattleUnit[] ───────────────────────────────

async function resolveLineup(
  supabase: ReturnType<typeof createServiceClient>,
  operatorId: string,
  playerId: string,
  slotIds: string[]              // exactly 5 non-null unit UUIDs
): Promise<BattleUnit[]> {
  const [{ data: unitsRaw }, { data: puRaw }] = await Promise.all([
    supabase
      .from("units")
      .select("id, name, affinity, base_power, base_speed")
      .in("id", slotIds),
    supabase
      .from("player_units")
      .select("unit_id, level, current_power, current_speed")
      .eq("operator_id", operatorId)
      .eq("player_id", playerId)
      .in("unit_id", slotIds),
  ]);

  const unitMap = new Map<string, Pick<Unit, "id" | "name" | "affinity" | "base_power" | "base_speed">>();
  for (const u of (unitsRaw ?? []) as Pick<Unit, "id" | "name" | "affinity" | "base_power" | "base_speed">[]) {
    unitMap.set(u.id, u);
  }

  const puMap = new Map<string, Pick<PlayerUnit, "unit_id" | "level" | "current_power" | "current_speed">>();
  for (const pu of (puRaw ?? []) as Pick<PlayerUnit, "unit_id" | "level" | "current_power" | "current_speed">[]) {
    puMap.set(pu.unit_id, pu);
  }

  return slotIds.map((id) => {
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

// ── Extract non-null slot IDs from a Lineup row ───────────────────────────────

function slotIds(lineup: Lineup): string[] {
  return [lineup.slot1, lineup.slot2, lineup.slot3, lineup.slot4, lineup.slot5].filter(
    Boolean
  ) as string[];
}

// ── POST /api/tournament/enter ────────────────────────────────────────────────
/**
 * Enters the authenticated player into a tournament.
 *
 * Flow:
 *   1. Validate tournament is active and belongs to this operator.
 *   2. Validate player's lineup is complete (5 units) and not locked.
 *   3. Verify the player hasn't already entered this tournament.
 *   4. Lock the player's lineup.
 *   5. Simulate battles against up to 5 other registered players.
 *   6. Write battle logs for each battle.
 *   7. Return the match summary.
 *
 * Body: { "tournamentId": "<uuid>" }
 *
 * Errors:
 *   400 — missing/invalid body
 *   403 — lineup is locked (already in another tournament)
 *   404 — tournament not found or not active
 *   409 — already entered this tournament | lineup incomplete
 *   500 — DB or simulation error
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { operator, playerId } = auth;

  // ── 1. Parse body ─────────────────────────────────────────────────────────
  let tournamentId: string;
  try {
    const body = await req.json();
    if (!body?.tournamentId || typeof body.tournamentId !== "string") throw new Error();
    tournamentId = body.tournamentId;
  } catch {
    return NextResponse.json(
      { error: 'Body must be JSON with a "tournamentId" string.' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // ── 2. Validate tournament ────────────────────────────────────────────────
  const { data: tourneyRaw } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .eq("operator_id", operator.id)
    .single();

  if (!tourneyRaw) {
    return NextResponse.json(
      { error: "Tournament not found for this operator." },
      { status: 404 }
    );
  }

  const tournament = tourneyRaw as Tournament;

  if (tournament.status !== "active") {
    return NextResponse.json(
      { error: `Tournament is not active (status: ${tournament.status}).` },
      { status: 404 }
    );
  }

  // ── 3. Validate player lineup ─────────────────────────────────────────────
  const { data: lineupRaw } = await supabase
    .from("lineups")
    .select("*")
    .eq("operator_id", operator.id)
    .eq("player_id", playerId)
    .single();

  if (!lineupRaw) {
    return NextResponse.json(
      { error: "No lineup saved. Save a full lineup before entering a tournament." },
      { status: 409 }
    );
  }

  const lineup = lineupRaw as Lineup;

  if (lineup.locked) {
    return NextResponse.json(
      { error: "Your lineup is locked (you may already be in an active tournament)." },
      { status: 403 }
    );
  }

  const playerSlotIds = slotIds(lineup);
  if (playerSlotIds.length !== 5) {
    return NextResponse.json(
      {
        error: `Lineup must have all 5 slots filled (currently ${playerSlotIds.length}/5).`,
        filledSlots: playerSlotIds.length,
      },
      { status: 409 }
    );
  }

  // ── 4. Check for duplicate entry ──────────────────────────────────────────
  const { count: alreadyEntered } = await supabase
    .from("battle_logs")
    .select("*", { count: "exact", head: true })
    .eq("operator_id", operator.id)
    .eq("player_id", playerId)
    .eq("tournament_id", tournamentId);

  if (alreadyEntered && alreadyEntered > 0) {
    return NextResponse.json(
      { error: "You have already entered this tournament." },
      { status: 409 }
    );
  }

  // ── 5. Lock player's lineup ───────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("lineups")
    .update({ locked: true })
    .eq("operator_id", operator.id)
    .eq("player_id", playerId);

  // ── 6. Resolve player's BattleUnit[] ─────────────────────────────────────
  const playerUnits = await resolveLineup(supabase, operator.id, playerId, playerSlotIds);

  // ── 7. Find opponents: other players with saved lineups ───────────────────
  const { data: opponentLineups } = await supabase
    .from("lineups")
    .select("*")
    .eq("operator_id", operator.id)
    .neq("player_id", playerId)
    .limit(MAX_OPPONENTS * 3); // fetch extra to allow filtering incomplete lineups

  const validOpponents = ((opponentLineups ?? []) as Lineup[])
    .filter((l) => slotIds(l).length === 5)
    .slice(0, MAX_OPPONENTS);

  // ── 8. Simulate battles + write logs ─────────────────────────────────────
  const battleResults: {
    opponentId: string;
    result: "win" | "loss" | "draw";
    playerRoundsWon: number;
    opponentRoundsWon: number;
  }[] = [];

  for (const oLineup of validOpponents) {
    const opponentSlotIds = slotIds(oLineup);
    const opponentUnits = await resolveLineup(
      supabase,
      operator.id,
      oLineup.player_id,
      opponentSlotIds
    );

    const outcome = simulateBattle(playerUnits, opponentUnits);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: logError } = await (supabase as any)
      .from("battle_logs")
      .insert({
        operator_id: operator.id,
        tournament_id: tournamentId,
        player_id: playerId,
        opponent_name: oLineup.player_id,
        result: outcome.result,
        rounds: outcome.rounds,
      });

    if (!logError) {
      battleResults.push({
        opponentId: oLineup.player_id,
        result: outcome.result,
        playerRoundsWon: outcome.playerRoundsWon,
        opponentRoundsWon: outcome.opponentRoundsWon,
      });
    }
  }

  // ── 9. Build summary ──────────────────────────────────────────────────────
  const wins = battleResults.filter((r) => r.result === "win").length;
  const losses = battleResults.filter((r) => r.result === "loss").length;
  const draws = battleResults.filter((r) => r.result === "draw").length;

  return NextResponse.json({
    tournamentId,
    tournamentName: tournament.name,
    lineupLocked: true,
    battlesSimulated: battleResults.length,
    summary: { wins, losses, draws },
    battles: battleResults,
    message:
      battleResults.length === 0
        ? "Registered successfully. No other players have entered yet — check back later."
        : `Entered tournament. Fought ${battleResults.length} battle(s): ${wins}W ${losses}L ${draws}D.`,
  });
}
