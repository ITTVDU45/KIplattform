"use client";

import Link from "next/link";
import {
  Users,
  Key,
  Cpu,
  Server,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { mockAdminUsers, getAdminStats } from "@/lib/mock/admin-data";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

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

export default function AdminDashboardPage() {
  const stats = getAdminStats();
  const recentUsers = [...mockAdminUsers]
    .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
    .slice(0, 5);

  const kpiCards = [
    {
      label: "Nutzer gesamt",
      value: String(stats.totalUsers),
      sub: `${stats.activeUsers} aktiv · ${stats.pendingUsers} ausstehend`,
      icon: Users,
      color: "text-primary bg-primary/10",
    },
    {
      label: "API-Keys aktiv",
      value: String(stats.activeApiKeys),
      sub: `${stats.totalApiKeys} gesamt`,
      icon: Key,
      color: "text-accent-success bg-accent-success/10",
    },
    {
      label: "Tokens (dieser Monat)",
      value: formatNumber(stats.totalTokensThisMonth),
      sub: `${formatNumber(stats.totalTokensAll)} gesamt`,
      icon: Cpu,
      color: "text-accent-purple bg-accent-purple/10",
    },
    {
      label: "Server laufend",
      value: String(stats.runningServers),
      sub: `${stats.totalServers} gesamt`,
      icon: Server,
      color: "text-amber-400 bg-amber-400/10",
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Übersicht</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plattform-Status und Nutzerstatistiken auf einen Blick.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-1.5 text-3xl font-bold text-foreground">{card.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <TrendingUp className="h-4 w-4 text-accent-success" />
            Anwendungen verbunden
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">{stats.totalApplications}</p>
          <p className="mt-1 text-xs text-muted-foreground">Über alle Nutzer</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CheckCircle2 className="h-4 w-4 text-accent-success" />
            Aktive Nutzer
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">{stats.activeUsers}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {((stats.activeUsers / stats.totalUsers) * 100).toFixed(0)}% der Gesamtnutzer
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            Ausstehende Freischaltungen
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">{stats.pendingUsers}</p>
          <p className="mt-1 text-xs text-muted-foreground">Warten auf Aktivierung</p>
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="glass-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">Neueste Registrierungen</h2>
          </div>
          <Link
            href="/admin/users"
            className="text-xs font-medium text-primary hover:underline"
          >
            Alle anzeigen
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentUsers.map((user) => (
            <Link
              key={user.id}
              href={`/admin/users/${user.id}`}
              className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-surface"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{user.registeredAt}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(user.status)}`}
                >
                  {statusLabel(user.status)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
