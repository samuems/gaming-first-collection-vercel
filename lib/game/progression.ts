// Level-up system for unit progression (Phase 5).
// Progression is duplicate-based — no XP.

export const MAX_LEVEL = 5;

// How many total copies a player needs to own to reach the NEXT level.
// null = this is the max level, no further upgrade.
export const COPIES_FOR_LEVEL: Record<number, number | null> = {
  1: 2,
  2: 3,
  3: 5,
  4: 8,
  5: null,
};

// Stat bonus added on top of base stats at a given level.
function statBonus(level: number): number {
  return level - 1; // Level 1 → 0 bonus, Level 5 → +4
}

export function powerAtLevel(basePower: number, level: number): number {
  return basePower + statBonus(level);
}

export function speedAtLevel(baseSpeed: number, level: number): number {
  return baseSpeed + statBonus(level);
}
