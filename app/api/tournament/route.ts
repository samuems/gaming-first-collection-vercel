import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/service";
import type { Tournament, BattleLog } from "@/types/database";

/**
 * GET /api/tournament
 *
 * Returns tournaments for this operator, newest first.
 * Each entry includes the authenticated player's participation stats.
 *
 * Query params:
 *   status — filter by "pending" | "active" | "completed" (optional)
 *
 * Response:
 * {
 *   tournaments: Array<{
 *     id, name, status, startTime, endTime, createdAt,
 *     player: { registered: boolean, wins: number, losses: number, draws: number }
 *   }>
 * }
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { operator, playerId } = auth;
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");

  const supabase = createServiceClient();

  // Fetch tournaments for this operator
  let query = supabase
    .from("tournaments")
    .select("*")
    .eq("operator_id", operator.id)
    .order("created_at", { ascending: false });

  if (statusFilter === "pending" || statusFilter === "active" || statusFilter === "completed") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Failed to fetch tournaments." }, { status: 500 });
  }

  const tournaments = (data ?? []) as Tournament[];

  // Aggregate player stats per tournament from battle_logs
  const playerStatMap: Record<string, { registered: boolean; wins: number; losses: number; draws: number }> = {};

  if (tournaments.length > 0) {
    const ids = tournaments.map((t) => t.id);
    const { data: logs } = await supabase
      .from("battle_logs")
      .select("tournament_id, result")
      .eq("operator_id", operator.id)
      .eq("player_id", playerId)
      .in("tournament_id", ids);

    for (const log of (logs ?? []) as Pick<BattleLog, "tournament_id" | "result">[]) {
      const tid = log.tournament_id!;
      if (!playerStatMap[tid]) {
        playerStatMap[tid] = { registered: true, wins: 0, losses: 0, draws: 0 };
      }
      if (log.result === "win") playerStatMap[tid].wins++;
      else if (log.result === "loss") playerStatMap[tid].losses++;
      else playerStatMap[tid].draws++;
    }
  }

  const result = tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    status: t.status,
    startTime: t.start_time,
    endTime: t.end_time,
    createdAt: t.created_at,
    player: playerStatMap[t.id] ?? { registered: false, wins: 0, losses: 0, draws: 0 },
  }));

  return NextResponse.json({ tournaments: result });
}
