import { affinityBonus } from "./affinity";
import type { Affinity, BattleRound, BattleResult, RoundWinner } from "@/types/database";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BattleUnit {
  id: string;
  name: string;
  affinity: Affinity;
  power: number;
  speed: number;
  level: number;
}

export interface BattleOutcome {
  result: BattleResult;           // from the player's perspective
  playerRoundsWon: number;
  opponentRoundsWon: number;
  playerTeamInitiative: number;
  opponentTeamInitiative: number;
  rounds: BattleRound[];
}

// ── Deterministic coin flip ───────────────────────────────────────────────────
// Used as the last tiebreaker when all stats are identical.
// Comparing UUIDs lexicographically always yields the same winner for
// the same pair of units — no randomness, no state needed.

function deterministicWinner(
  playerUnitId: string,
  opponentUnitId: string
): "player" | "opponent" {
  return playerUnitId < opponentUnitId ? "player" : "opponent";
}

// ── Round simulation ──────────────────────────────────────────────────────────

function simulateRound(
  roundNum: 1 | 2 | 3 | 4 | 5,
  pUnit: BattleUnit,
  oUnit: BattleUnit,
  pTeamInit: number,
  oTeamInit: number
): BattleRound {
  const pAffBonus = affinityBonus(pUnit.affinity, oUnit.affinity);
  const oAffBonus = affinityBonus(oUnit.affinity, pUnit.affinity);
  const pScore = pUnit.power + pAffBonus;
  const oScore = oUnit.power + oAffBonus;

  let winner: RoundWinner;

  if (pScore > oScore) {
    winner = "player";
  } else if (oScore > pScore) {
    winner = "opponent";
  } else if (pUnit.speed > oUnit.speed) {
    // Tiebreaker 1: higher individual unit speed
    winner = "player";
  } else if (oUnit.speed > pUnit.speed) {
    winner = "opponent";
  } else if (pTeamInit > oTeamInit) {
    // Tiebreaker 2: team initiative (sum of all 5 units' speeds)
    winner = "player";
  } else if (oTeamInit > pTeamInit) {
    winner = "opponent";
  } else {
    // Tiebreaker 3: deterministic coin flip — ensures no true draws
    winner = deterministicWinner(pUnit.id, oUnit.id);
  }

  return {
    round: roundNum,
    player_unit: {
      id: pUnit.id,
      name: pUnit.name,
      affinity: pUnit.affinity,
      power: pUnit.power,
      speed: pUnit.speed,
      level: pUnit.level,
    },
    opponent_unit: {
      id: oUnit.id,
      name: oUnit.name,
      affinity: oUnit.affinity,
      power: oUnit.power,
      speed: oUnit.speed,
      level: oUnit.level,
    },
    player_battle_score: pScore,
    opponent_battle_score: oScore,
    player_affinity_bonus: pAffBonus,
    opponent_affinity_bonus: oAffBonus,
    winner,
  };
}

// ── Match simulation ──────────────────────────────────────────────────────────

/**
 * Simulates a full 5-round match between two lineups.
 *
 * Rules (from PLAN.md):
 * - Round N: player slot N vs opponent slot N.
 * - Battle Score = Power + Affinity Bonus.
 * - Tiebreakers per round: Battle Score → Speed → Team Initiative → coin flip.
 * - Win condition: win 3 of 5 rounds.
 *
 * Both lineups must contain exactly 5 units.
 * The result is deterministic — same lineups always produce the same outcome.
 */
export function simulateBattle(
  playerLineup: BattleUnit[],
  opponentLineup: BattleUnit[]
): BattleOutcome {
  if (playerLineup.length !== 5 || opponentLineup.length !== 5) {
    throw new Error("Both lineups must have exactly 5 units.");
  }

  const pTeamInit = playerLineup.reduce((s, u) => s + u.speed, 0);
  const oTeamInit = opponentLineup.reduce((s, u) => s + u.speed, 0);

  const rounds: BattleRound[] = [];
  let pWins = 0;
  let oWins = 0;

  for (let i = 0; i < 5; i++) {
    const round = simulateRound(
      (i + 1) as 1 | 2 | 3 | 4 | 5,
      playerLineup[i],
      opponentLineup[i],
      pTeamInit,
      oTeamInit
    );
    rounds.push(round);
    if (round.winner === "player") pWins++;
    else if (round.winner === "opponent") oWins++;
  }

  // With a deterministic round winner for every round, the match score can
  // only be 5-0, 4-1, or 3-2 — never a draw.
  const result: BattleResult =
    pWins > oWins ? "win" : oWins > pWins ? "loss" : "draw";

  return {
    result,
    playerRoundsWon: pWins,
    opponentRoundsWon: oWins,
    playerTeamInitiative: pTeamInit,
    opponentTeamInitiative: oTeamInit,
    rounds,
  };
}
