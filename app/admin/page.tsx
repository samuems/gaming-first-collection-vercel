import { createServiceClient } from "@/lib/supabase/service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Swords,
  Palette,
  Trophy,
  Gift,
  ArrowRight,
  Zap,
} from "lucide-react";

const sections = [
  {
    href: "/admin/operators",
    icon: Building2,
    title: "Operators",
    description:
      "Create casino operator accounts. Each gets an isolated game instance, API key, and custom theme.",
    phase: "Phase 2",
  },
  {
    href: "/admin/units",
    icon: Swords,
    title: "Units",
    description:
      "Define the global unit catalog — rarity, affinity, power, speed, images. Operators inherit and can extend.",
    phase: "Phase 3 ✓",
  },
  {
    href: "/admin/theme",
    icon: Palette,
    title: "Theme",
    description:
      'Rename "Unit" to "Card", "Fighter", "Monster" etc. per operator. Only terminology changes — mechanics stay identical.',
    phase: "Phase 12",
  },
  {
    href: "/admin/tournaments",
    icon: Trophy,
    title: "Tournaments",
    description:
      "Create tournament templates. Operators activate them. All battles are deterministic — no live PvP.",
    phase: "Phase 10",
  },
  {
    href: "/admin/chest",
    icon: Gift,
    title: "Chest Rewards",
    description:
      "Configure drop-rate tables per rarity. Operators override within allowed ranges.",
    phase: "Phase 11",
  },
];

const endpoints = [
  { method: "GET",  path: "/api/collection" },
  { method: "GET",  path: "/api/lineup" },
  { method: "PUT",  path: "/api/lineup" },
  { method: "GET",  path: "/api/tournament" },
  { method: "POST", path: "/api/tournament/enter" },
  { method: "GET",  path: "/api/battle-log" },
  { method: "POST", path: "/api/chest/open" },
];

const methodColor: Record<string, string> = {
  GET:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  POST: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PUT:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createServiceClient();

  const [
    { count: operatorCount },
    { count: unitCount },
    { count: tournamentCount },
  ] = await Promise.all([
    supabase.from("operators").select("*", { count: "exact", head: true }),
    supabase.from("units").select("*", { count: "exact", head: true }),
    supabase.from("tournaments").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);

  const stats = [
    { label: "Operators",           value: operatorCount ?? 0,    sub: "registered" },
    { label: "Units",               value: unitCount ?? 0,         sub: "in catalog" },
    { label: "Active Tournaments",  value: tournamentCount ?? 0,   sub: "running now" },
    { label: "Total Players",       value: 0,                      sub: "across all operators" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Configure the Gaming-First Collection framework. Operators consume
          game data through the REST API.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-sm font-medium mt-0.5">{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Config sections */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Configuration
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sections.map(({ href, icon: Icon, title, description, phase }) => (
            <a key={href} href={href} className="group block">
              <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:bg-accent/30">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <CardTitle className="text-sm">{title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-xs font-normal ${phase.includes("✓") ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : ""}`}
                      >
                        {phase}
                      </Badge>
                      <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs leading-relaxed">
                    {description}
                  </CardDescription>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>

      <Separator />

      {/* API reference */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            <CardTitle className="text-sm">REST API Endpoints</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Casino dev teams call these with{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">x-operator-key</code>{" "}
            +{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">x-player-id</code>{" "}
            headers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            {endpoints.map(({ method, path }) => (
              <div key={`${method}${path}`} className="flex items-center gap-3">
                <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-mono font-semibold w-12 justify-center ${methodColor[method]}`}>
                  {method}
                </span>
                <code className="text-xs text-muted-foreground font-mono">{path}</code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
