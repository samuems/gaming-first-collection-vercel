import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/service";
import type { Unit, Rarity, Affinity } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Wind, Mountain, Zap, Waves, Flame, Snowflake, Leaf, Sun, Moon,
  Sword, Timer,
} from "lucide-react";

// ── Rarity config ─────────────────────────────────────────────────────────────

type RarityConfig = {
  outerBorder: string;   // card outer ring
  innerBorder: string;   // inner artwork ring
  headerBg: string;      // top pill
  ribbonBg: string;      // bottom rarity ribbon
  ribbonText: string;
  cardBg: string;
  nameColor: string;
  glowClass: string;
  statsBg: string;
};

const RARITY_CFG: Record<Rarity, RarityConfig> = {
  Common: {
    outerBorder:  "ring-1 ring-zinc-500/60",
    innerBorder:  "ring-1 ring-zinc-600/40",
    headerBg:     "bg-zinc-700",
    ribbonBg:     "bg-zinc-600",
    ribbonText:   "text-zinc-200",
    cardBg:       "bg-gradient-to-b from-zinc-800 via-zinc-850 to-zinc-900",
    nameColor:    "text-zinc-100",
    glowClass:    "",
    statsBg:      "bg-zinc-800/60",
  },
  Rare: {
    outerBorder:  "ring-2 ring-blue-400/70",
    innerBorder:  "ring-1 ring-blue-500/50",
    headerBg:     "bg-blue-900",
    ribbonBg:     "bg-blue-600",
    ribbonText:   "text-blue-100",
    cardBg:       "bg-gradient-to-b from-blue-950 via-zinc-900 to-zinc-900",
    nameColor:    "text-blue-200",
    glowClass:    "shadow-blue-500/20 shadow-lg",
    statsBg:      "bg-blue-950/50",
  },
  Epic: {
    outerBorder:  "ring-2 ring-purple-400/80",
    innerBorder:  "ring-1 ring-purple-500/60",
    headerBg:     "bg-purple-950",
    ribbonBg:     "bg-gradient-to-r from-purple-700 to-purple-500",
    ribbonText:   "text-purple-100",
    cardBg:       "bg-gradient-to-b from-purple-950 via-zinc-900 to-zinc-900",
    nameColor:    "text-purple-200",
    glowClass:    "shadow-purple-500/25 shadow-xl",
    statsBg:      "bg-purple-950/50",
  },
  Legendary: {
    outerBorder:  "ring-2 ring-amber-400",
    innerBorder:  "ring-1 ring-amber-500/70",
    headerBg:     "bg-amber-950",
    ribbonBg:     "bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-500",
    ribbonText:   "text-amber-900",
    cardBg:       "bg-gradient-to-b from-amber-950 via-zinc-900 to-zinc-900",
    nameColor:    "text-amber-300",
    glowClass:    "shadow-amber-400/30 shadow-xl",
    statsBg:      "bg-amber-950/40",
  },
};

// ── Affinity config ───────────────────────────────────────────────────────────

type AffinityConfig = { icon: React.ElementType; color: string; bg: string; label: string };

const AFFINITY_CFG: Record<Affinity, AffinityConfig> = {
  Air:       { icon: Wind,      color: "text-sky-200",    bg: "bg-sky-500/25 border border-sky-500/30",       label: "Air" },
  Earth:     { icon: Mountain,  color: "text-lime-200",   bg: "bg-lime-600/25 border border-lime-500/30",     label: "Earth" },
  Lightning: { icon: Zap,       color: "text-yellow-200", bg: "bg-yellow-500/25 border border-yellow-400/30", label: "Lightning" },
  Water:     { icon: Waves,     color: "text-blue-200",   bg: "bg-blue-500/25 border border-blue-400/30",     label: "Water" },
  Fire:      { icon: Flame,     color: "text-red-200",    bg: "bg-red-600/25 border border-red-500/30",       label: "Fire" },
  Ice:       { icon: Snowflake, color: "text-cyan-200",   bg: "bg-cyan-500/25 border border-cyan-400/30",     label: "Ice" },
  Nature:    { icon: Leaf,      color: "text-green-200",  bg: "bg-green-600/25 border border-green-500/30",   label: "Nature" },
  Light:     { icon: Sun,       color: "text-orange-100", bg: "bg-orange-400/25 border border-orange-300/30", label: "Light" },
  Shadow:    { icon: Moon,      color: "text-violet-200", bg: "bg-violet-600/25 border border-violet-500/30", label: "Shadow" },
};

const RARITIES: Rarity[] = ["Common", "Rare", "Epic", "Legendary"];
const AFFINITIES: Affinity[] = ["Air", "Earth", "Lightning", "Water", "Fire", "Ice", "Nature", "Light", "Shadow"];

// ── Rarity distribution badge styles ─────────────────────────────────────────

const DIST_STYLE: Record<Rarity, { count: string; badge: string }> = {
  Common:    { count: "text-zinc-100",   badge: "text-zinc-400 border-zinc-600 bg-zinc-800" },
  Rare:      { count: "text-blue-300",   badge: "text-blue-400 border-blue-700 bg-blue-950/60" },
  Epic:      { count: "text-purple-300", badge: "text-purple-400 border-purple-700 bg-purple-950/60" },
  Legendary: { count: "text-amber-300",  badge: "text-amber-400 border-amber-700 bg-amber-950/60" },
};

// ── Unit Card ─────────────────────────────────────────────────────────────────

function UnitCard({ unit }: { unit: Unit }) {
  const r = RARITY_CFG[unit.rarity];
  const a = AFFINITY_CFG[unit.affinity];
  const AffinityIcon = a.icon;

  return (
    <article
      className={`
        flex flex-col rounded-2xl overflow-hidden
        ${r.cardBg} ${r.outerBorder} ${r.glowClass}
        transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.02]
        cursor-pointer
      `}
    >
      {/* ── Header bar ── */}
      <div className={`${r.headerBg} flex items-center justify-between px-2.5 py-1.5`}>
        {/* Affinity pill */}
        <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${a.bg}`}>
          <AffinityIcon className={`size-3 ${a.color}`} />
          <span className={`text-[9px] font-bold uppercase tracking-wider ${a.color}`}>
            {a.label}
          </span>
        </div>
        {/* Level badge */}
        <div className="rounded-full bg-black/30 px-1.5 py-0.5 text-[10px] font-bold text-white/70 leading-none">
          Lv&nbsp;1
        </div>
      </div>

      {/* ── Artwork ── */}
      <div className={`relative aspect-square mx-2 mt-1.5 rounded-xl overflow-hidden ${r.innerBorder}`}>
        {unit.image ? (
          <Image
            src={unit.image}
            alt={unit.name}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 15vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800/80 flex items-center justify-center text-zinc-600 text-3xl font-bold">
            ?
          </div>
        )}

        {/* Rarity ribbon — overlaid at bottom of art */}
        <div className={`absolute inset-x-0 bottom-0 ${r.ribbonBg} py-0.5`}>
          <p className={`text-center text-[9px] font-black tracking-[0.15em] ${r.ribbonText} drop-shadow`}>
            ✦ {unit.rarity.toUpperCase()} ✦
          </p>
        </div>
      </div>

      {/* ── Name ── */}
      <div className="px-2.5 pt-2">
        <p className={`text-sm font-extrabold leading-tight tracking-tight ${r.nameColor}`}>
          {unit.name}
        </p>
      </div>

      {/* ── Stats ── */}
      <div className={`mx-2.5 mt-1.5 mb-2 rounded-lg ${r.statsBg} px-2.5 py-1.5 flex items-center justify-between`}>
        {/* Power */}
        <div className="flex items-center gap-1.5">
          <div className="size-5 rounded-md bg-red-500/20 flex items-center justify-center">
            <Sword className="size-3 text-red-400" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[8px] text-zinc-500 uppercase font-semibold">Power</span>
            <span className="text-sm font-black text-white">{unit.base_power}</span>
          </div>
        </div>

        <div className="w-px h-6 bg-zinc-700/60" />

        {/* Speed */}
        <div className="flex items-center gap-1.5">
          <div className="size-5 rounded-md bg-emerald-500/20 flex items-center justify-center">
            <Timer className="size-3 text-emerald-400" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[8px] text-zinc-500 uppercase font-semibold">Speed</span>
            <span className="text-sm font-black text-white">{unit.base_speed}</span>
          </div>
        </div>

        {/* Season */}
        <div className="rounded-full bg-zinc-700/50 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 border border-zinc-600/40">
          S{unit.season}
        </div>
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export const revalidate = 0;

export default async function UnitsPage() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .order("rarity", { ascending: false })
    .order("affinity")
    .order("name");

  const units = data as Unit[] | null;

  const distribution = RARITIES.map((rarity) => ({
    rarity,
    count: units?.filter((u) => u.rarity === rarity).length ?? 0,
  }));

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Units</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {units?.length ?? 0} units &middot; 4 rarities &middot; 9 affinities
          </p>
        </div>
        <Button disabled className="gap-2 shrink-0">
          <Plus className="size-4" />
          New Unit
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error: {error.message}
        </div>
      )}

      {/* Distribution cards */}
      <div className="grid grid-cols-4 gap-3">
        {distribution.map(({ rarity, count }) => {
          const s = DIST_STYLE[rarity];
          return (
            <Card key={rarity} className="border-border">
              <CardContent className="pt-4 pb-3 flex items-end justify-between">
                <div>
                  <p className={`text-3xl font-black ${s.count}`}>{count}</p>
                  <span className={`mt-1 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.badge}`}>
                    {rarity}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters (stubbed) */}
      <div className="flex gap-2 flex-wrap">
        <Select disabled>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="All Rarities" />
          </SelectTrigger>
          <SelectContent>
            {RARITIES.map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select disabled>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="All Affinities" />
          </SelectTrigger>
          <SelectContent>
            {AFFINITIES.map((a) => <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Card grid */}
      {!units?.length ? (
        <p className="text-muted-foreground text-sm">No units found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {units.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>
      )}
    </div>
  );
}
