import type { Affinity } from "@/types/database";

// ── Affinity order (index maps to RAW rows/cols) ──────────────────────────────

const ORDER: Affinity[] = [
  "Air", "Earth", "Lightning", "Water", "Fire",
  "Ice", "Nature", "Light", "Shadow",
];

// ── Affinity matrix ───────────────────────────────────────────────────────────
// RAW[attacker_index][defender_index]
// Source: PLAN.md — exact CardCrush affinity model
//
//  Positive → attacker has the edge (bonus added to attacker's score)
//  Zero     → neutral
//  Negative → defender has the edge (the defender's own row lookup gives them a bonus)
//
//                 Air  Ear  Ltn  Wat  Fir  Ice  Nat  Lgt  Sha
const RAW: readonly (readonly number[])[] = [
  /* Air       */ [  0,  3,  2,  1,  1, -1, -1, -2, -3 ],
  /* Earth     */ [ -3,  0,  3,  2,  1,  1, -1, -1, -2 ],
  /* Lightning */ [ -2, -3,  0,  3,  2,  1,  1, -1, -1 ],
  /* Water     */ [ -1, -2, -3,  0,  3,  2,  1,  1, -1 ],
  /* Fire      */ [ -1, -1, -2, -3,  0,  3,  2,  1,  1 ],
  /* Ice       */ [  1, -1, -1, -2, -3,  0,  3,  2,  1 ],
  /* Nature    */ [  1,  1, -1, -1, -2, -3,  0,  3,  2 ],
  /* Light     */ [  2,  1,  1, -1, -1, -2, -3,  0,  3 ],
  /* Shadow    */ [  3,  2,  1,  1, -1, -1, -2, -3,  0 ],
];

const IDX = new Map<Affinity, number>(ORDER.map((a, i) => [a, i]));

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Raw value from the affinity matrix.
 * Positive = attacker advantage, zero = neutral, negative = defender advantage.
 */
export function rawAffinityValue(attacker: Affinity, defender: Affinity): number {
  return RAW[IDX.get(attacker)!][IDX.get(defender)!];
}

/**
 * Bonus added to the attacker's battle score.
 * Only positive values count — negative entries yield 0 for the attacker.
 */
export function affinityBonus(attacker: Affinity, defender: Affinity): number {
  return Math.max(0, rawAffinityValue(attacker, defender));
}

/**
 * Full matrix as a plain object — used by the BO affinity viewer and by tests.
 * matrix[attacker][defender] = raw value
 */
export function affinityMatrix(): Record<Affinity, Record<Affinity, number>> {
  const result = {} as Record<Affinity, Record<Affinity, number>>;
  for (const atk of ORDER) {
    result[atk] = {} as Record<Affinity, number>;
    for (const def of ORDER) {
      result[atk][def] = rawAffinityValue(atk, def);
    }
  }
  return result;
}

export { ORDER as AFFINITY_ORDER };
