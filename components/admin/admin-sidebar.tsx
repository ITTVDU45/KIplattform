"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Key,
  Server,
  Activity,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";

const navItems = [
  { href: "/admin/dashboard", label: "Übersicht", icon: LayoutDashboard },
  { href: "/admin/users", label: "Nutzer", icon: Users },
  { href: "/admin/api-keys", label: "API-Keys", icon: Key },
  { href: "/admin/servers", label: "Server", icon: Server },
  { href: "/admin/logs", label: "Aktivitäten", icon: Activity },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success("Abgemeldet");
    router.replace("/admin-login");
  };

  return (
    <aside className="flex h-screen w-56 flex-shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-foreground">Admin Panel</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Verwaltung
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-amber-500/12 font-medium text-amber-400"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Abmelden
        </button>
      </div>
    </aside>
  );
}
