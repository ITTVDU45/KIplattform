"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Key, Cpu, AppWindow, Server } from "lucide-react";
import { Input } from "@/components/ui/input";
import { mockAdminUsers } from "@/lib/mock/admin-data";
import type { AdminUser } from "@/lib/mock/admin-data";

function statusColor(status: string) {
  switch (status) {
    case "active":
      return "text-accent-success bg-accent-success/10";
    case "pending":
      return "text-amber-400 bg-amber-400/10";
    case "inactive":
      return "text-muted-foreground bg-surface";
    default:
      return "text-muted-foreground bg-surface";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "active":
      return "Aktiv";
    case "pending":
      return "Ausstehend";
    case "inactive":
      return "Inaktiv";
    default:
      return status;
  }
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function TokenBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color = pct > 80 ? "bg-accent-danger" : pct > 60 ? "bg-amber-400" : "bg-accent-success";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{formatTokens(used)}</span>
    </div>
  );
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "pending">("all");

  const filtered = mockAdminUsers.filter((user: AdminUser) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filterButtons: { value: typeof filterStatus; label: string }[] = [
    { value: "all", label: "Alle" },
    { value: "active", label: "Aktiv" },
    { value: "pending", label: "Ausstehend" },
    { value: "inactive", label: "Inaktiv" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Nutzer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mockAdminUsers.length} registrierte Nutzer
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Name oder E-Mail suchen..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilterStatus(btn.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === btn.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Nutzer
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Key className="h-3 w-3" /> API-Keys
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Cpu className="h-3 w-3" /> Tokens (Monat)
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <AppWindow className="h-3 w-3" /> Apps
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Server className="h-3 w-3" /> Server
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Letzter Login
                </th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Keine Nutzer gefunden.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-surface"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${user.id}`} className="group block">
                        <p className="font-medium text-foreground group-hover:text-primary">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(user.status)}`}
                      >
                        {statusLabel(user.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{user.apiKeys.active}</span>
                      <span className="text-muted-foreground"> / {user.apiKeys.total}</span>
                    </td>
                    <td className="px-4 py-3">
                      <TokenBar
                        used={user.tokens.usedThisMonth}
                        limit={user.tokens.limit}
                      />
                    </td>
                    <td className="px-4 py-3 text-foreground">{user.applications.length}</td>
                    <td className="px-4 py-3 text-foreground">{user.servers.length}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{user.lastLogin}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${user.id}`}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
