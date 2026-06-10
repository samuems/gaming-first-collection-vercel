import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";
import type { BattleLog } from "@/types/database";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

/**
 * GET /api/battle-log
 *
 * Returns the authenticated player's battle history for this operator,
 * newest first. Each entry includes the full round-by-round breakdown
 * so the player can understand exactly why they won or lost.
 *
 * Query params:
 *   limit  — number of records to return (default 20, max 100)
 *   offset — pagination offset (default 0)
 *   result — filter by "win" | "loss" | "draw" (optional)
 *
 * Response:
 * {
 *   playerId: string,
 *   total: number,       // total records (before pagination)
 *   limit: number,
 *   offset: number,
 *   battles: Array<{
 *     id, tournamentId, opponentName, result, createdAt,
 *     summary: { playerRoundsWon, opponentRoundsWon },
 *     rounds: BattleRound[]
 *   }>
 * }
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { operator, playerId } = auth;
  const { searchParams } = new URL(req.url);

  const limit = Math.min(
    Math.max(1, Number(searchParams.get("limit") ?? DEFAULT_LIMIT)),
    MAX_LIMIT
  );
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));
  const resultFilter = searchParams.get("result");

  const supabase = createServiceClient();

  // Count total for pagination
  let countQuery = supabase
    .from("battle_logs")
    .select("*", { count: "exact", head: true })
    .eq("operator_id", operator.id)
    .eq("player_id", playerId);

  if (resultFilter === "win" || resultFilter === "loss" || resultFilter === "draw") {
    countQuery = countQuery.eq("result", resultFilter);
  }

  const { count } = await countQuery;

  // Fetch paginated records
  let dataQuery = supabase
    .from("battle_logs")
    .select("*")
    .eq("operator_id", operator.id)
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (resultFilter === "win" || resultFilter === "loss" || resultFilter === "draw") {
    dataQuery = dataQuery.eq("result", resultFilter);
  }

  const { data, error } = await dataQuery;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch battle logs." }, { status: 500 });
  }

  const logs = (data ?? []) as BattleLog[];

  const battles = logs.map((log) => {
    const playerRoundsWon = log.rounds.filter((r) => r.winner === "player").length;
    const opponentRoundsWon = log.rounds.filter((r) => r.winner === "opponent").length;

    return {
      id: log.id,
      tournamentId: log.tournament_id,
      opponentName: log.opponent_name,
      result: log.result,
      createdAt: log.created_at,
      summary: { playerRoundsWon, opponentRoundsWon },
      rounds: log.rounds,
    };
  });

  return NextResponse.json({
    playerId,
    total: count ?? 0,
    limit,
    offset,
    battles,
  });
}
