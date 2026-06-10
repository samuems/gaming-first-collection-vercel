// Auto-maintained hand-written types for GFC database schema.
// Keep in sync with supabase/migrations/001_initial_schema.sql

export type Rarity = "Common" | "Rare" | "Epic" | "Legendary";

export type Affinity =
  | "Air"
  | "Earth"
  | "Lightning"
  | "Water"
  | "Fire"
  | "Ice"
  | "Nature"
  | "Light"
  | "Shadow";

export type OperatorStatus = "active" | "suspended" | "draft";
export type TournamentStatus = "pending" | "active" | "completed";
export type BattleResult = "win" | "loss" | "draw";
export type RoundWinner = "player" | "opponent" | "draw";

// ── Table row types ────────────────────────────────────────────────────────

export interface Operator {
  id: string;
  name: string;
  api_key: string;
  status: OperatorStatus;
  theme_id: string | null;
  created_at: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ThemeUnitOverride {
  theme_id: string;
  unit_id: string;
  name_override: string | null;
  image_override: string | null;
}

export interface ThemeAffinityOverride {
  theme_id: string;
  affinity: string;
  label: string;
}

export interface Unit {
  id: string;
  name: string;
  image: string | null;
  rarity: Rarity;
  affinity: Affinity;
  base_power: number;
  base_speed: number;
  season: number;
  created_at: string;
}

export interface OperatorUnitOverride {
  id: string;
  operator_id: string;
  unit_id: string;
  name_override: string | null;
  image_override: string | null;
}

export interface PlayerUnit {
  id: string;
  operator_id: string;
  player_id: string;
  unit_id: string;
  copies_owned: number;
  level: number;
  current_power: number;
  current_speed: number;
  created_at: string;
}

export interface Lineup {
  id: string;
  operator_id: string;
  player_id: string;
  slot1: string | null;
  slot2: string | null;
  slot3: string | null;
  slot4: string | null;
  slot5: string | null;
  locked: boolean;
  updated_at: string;
}

export interface Tournament {
  id: string;
  operator_id: string;
  name: string;
  status: TournamentStatus;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
}

// Shape stored in battle_logs.rounds (JSONB array)
export interface BattleRound {
  round: 1 | 2 | 3 | 4 | 5;
  player_unit: {
    id: string;
    name: string;
    affinity: Affinity;
    power: number;
    speed: number;
    level: number;
  };
  opponent_unit: {
    id: string;
    name: string;
    affinity: Affinity;
    power: number;
    speed: number;
    level: number;
  };
  player_battle_score: number;
  opponent_battle_score: number;
  player_affinity_bonus: number;
  opponent_affinity_bonus: number;
  winner: RoundWinner;
}

export interface BattleLog {
  id: string;
  operator_id: string;
  tournament_id: string | null;
  player_id: string;
  opponent_name: string;
  result: BattleResult;
  rounds: BattleRound[];
  created_at: string;
}

// ── Supabase Database type (for createClient<Database>()) ─────────────────

export interface Database {
  public: {
    Tables: {
      operators: {
        Row: Operator;
        Insert: Omit<Operator, "id" | "api_key" | "created_at"> & {
          id?: string;
          api_key?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Operator, "id">>;
      };
      units: {
        Row: Unit;
        Insert: Omit<Unit, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Unit, "id">>;
      };
      operator_unit_overrides: {
        Row: OperatorUnitOverride;
        Insert: Omit<OperatorUnitOverride, "id"> & { id?: string };
        Update: Partial<Omit<OperatorUnitOverride, "id">>;
      };
      player_units: {
        Row: PlayerUnit;
        Insert: Omit<PlayerUnit, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<PlayerUnit, "id">>;
      };
      lineups: {
        Row: Lineup;
        Insert: Omit<Lineup, "id" | "updated_at"> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Lineup, "id">>;
      };
      tournaments: {
        Row: Tournament;
        Insert: Omit<Tournament, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Tournament, "id">>;
      };
      battle_logs: {
        Row: BattleLog;
        Insert: Omit<BattleLog, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<BattleLog, "id">>;
      };
    };
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
}
