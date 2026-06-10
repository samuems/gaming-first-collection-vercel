import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";
import type { BattleLog } from "@/types/database";

/**
 * GET /api/match
 *
 * Returns the player's 1v1 match history (battle_logs where tournament_id IS NULL).
 * Newest first. Includes full round data for replays.
 *
 * Query params:
 *   limit  — default 20, max 100
 *   offset — default 0
 *
 * Response:
 * {
 *   total: number,
 *   matches: Array<{
 *     matchId, opponentName, result,
 *     playerRoundsWon, opponentRoundsWon,
 *     rounds, createdAt
 *   }>
 * }
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { operator, playerId } = auth;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const supabase = createServiceClient();

  const { data, error, count } = await supabase
    .from("battle_logs")
    .select("*", { count: "exact" })
    .eq("operator_id", operator.id)
    .eq("player_id", playerId)
    .is("tournament_id", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch match history." },
      { status: 500 }
    );
  }

  const logs = (data ?? []) as BattleLog[];

  const matches = logs.map((log) => {
    const rounds = (log.rounds ?? []) as typeof log.rounds;
    const playerRoundsWon = rounds.filter((r) => r.winner === "player").length;
    const opponentRoundsWon = rounds.filter((r) => r.winner === "opponent").length;

    return {
      matchId: log.id,
      opponentName: log.opponent_name,
      result: log.result,
      playerRoundsWon,
      opponentRoundsWon,
      rounds: log.rounds,
      createdAt: log.created_at,
    };
  });

  return NextResponse.json({ total: count ?? 0, matches });
}
