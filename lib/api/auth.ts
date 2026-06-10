import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Operator } from "@/types/database";

export type AuthResult =
  | { ok: true; operator: Operator; playerId: string }
  | { ok: false; response: NextResponse };

export type OperatorAuthResult =
  | { ok: true; operator: Operator }
  | { ok: false; response: NextResponse };

// Validates x-operator-key and x-player-id headers on every API request.
// Returns the operator row so callers can scope queries by operator_id.
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const apiKey = req.headers.get("x-operator-key");
  const playerId = req.headers.get("x-player-id");

  if (!apiKey || !playerId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing x-operator-key or x-player-id header" },
        { status: 401 }
      ),
    };
  }

  const supabase = createServiceClient();
  const { data: operator, error } = await supabase
    .from("operators")
    .select("*")
    .eq("api_key", apiKey)
    .eq("status", "active")
    .single();

  if (error || !operator) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid or inactive operator API key" },
        { status: 401 }
      ),
    };
  }

  return { ok: true, operator, playerId };
}

// Operator-only auth — for management endpoints that don't involve a player.
// Only requires x-operator-key.
export async function requireOperatorAuth(req: NextRequest): Promise<OperatorAuthResult> {
  const apiKey = req.headers.get("x-operator-key");

  if (!apiKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing x-operator-key header" },
        { status: 401 }
      ),
    };
  }

  const supabase = createServiceClient();
  const { data: operator, error } = await supabase
    .from("operators")
    .select("*")
    .eq("api_key", apiKey)
    .eq("status", "active")
    .single();

  if (error || !operator) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid or inactive operator API key" },
        { status: 401 }
      ),
    };
  }

  return { ok: true, operator };
}
