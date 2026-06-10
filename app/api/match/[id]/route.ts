import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";
import type { BattleLog } from "@/types/database";

/**
 * GET /api/match/:id
 *
 * Returns a single 1v1 match with full round-by-round replay data.
 * The match must belong to the authenticated player.
 *
 * Response:
 * {
 *   matchId, opponentName, result,
 *   playerRoundsWon, opponentRoundsWon,
 *   rounds, createdAt
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { operator, playerId } = auth;
  const { id } = await params;

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("battle_logs")
    .select("*")
    .eq("id", id)
    .eq("operator_id", operator.id)
    .eq("player_id", playerId)
    .is("tournament_id", null)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Match not found." },
      { status: 404 }
    );
  }

  const log = data as BattleLog;
  const rounds = (log.rounds ?? []) as typeof log.rounds;
  const playerRoundsWon = rounds.filter((r) => r.winner === "player").length;
  const opponentRoundsWon = rounds.filter((r) => r.winner === "opponent").length;

  return NextResponse.json({
    matchId: log.id,
    opponentName: log.opponent_name,
    result: log.result,
    playerRoundsWon,
    opponentRoundsWon,
    rounds: log.rounds,
    createdAt: log.created_at,
  });
}
