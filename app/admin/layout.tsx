"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Building2,
  Swords,
  Palette,
  Trophy,
  Gift,
  ChevronRight,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/operators", label: "Operators", icon: Building2 },
  { href: "/admin/units", label: "Units", icon: Swords },
  { href: "/admin/theme", label: "Theme", icon: Palette },
  { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/admin/chest", label: "Chest Rewards", icon: Gift },
  { href: "/admin/matches", label: "1v1 Matches", icon: Shield },
];

function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            G
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">GFC</span>
            <span className="text-xs text-muted-foreground">Back Office</span>
          </div>
        </div>
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {nav.map(({ href, label, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname.startsWith(href);
              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={label}
                    render={<Link href={href} />}
                  >
                    <Icon className="size-4" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">MVP0 · v0.1.0</span>
          <Badge variant="outline" className="text-xs">
            Phase 1
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="flex h-12 items-center gap-3 border-b border-border px-4 sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="h-5" />
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Admin</span>
            <ChevronRight className="size-3.5" />
          </nav>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 max-w-5xl w-full mx-auto">{children}</main>
      </div>
    </SidebarProvider>
  );
}
