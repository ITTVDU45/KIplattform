"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Key,
  Cpu,
  AppWindow,
  Server,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Circle,
} from "lucide-react";
import { mockAdminUsers } from "@/lib/mock/admin-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <span className="flex items-center gap-1 rounded-full bg-accent-success/10 px-2 py-0.5 text-xs font-medium text-accent-success">
          <CheckCircle2 className="h-3 w-3" /> Aktiv
        </span>
      );
    case "inactive":
      return (
        <span className="flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted-foreground">
          <XCircle className="h-3 w-3" /> Inaktiv
        </span>
      );
    case "revoked":
      return (
        <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
          <AlertTriangle className="h-3 w-3" /> Widerrufen
        </span>
      );
    case "pending":
      return (
        <span className="flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-400">
          <Circle className="h-3 w-3" /> Ausstehend
        </span>
      );
    case "running":
      return (
        <span className="flex items-center gap-1 rounded-full bg-accent-success/10 px-2 py-0.5 text-xs font-medium text-accent-success">
          <CheckCircle2 className="h-3 w-3" /> Läuft
        </span>
      );
    case "stopped":
      return (
        <span className="flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted-foreground">
          <XCircle className="h-3 w-3" /> Gestoppt
        </span>
      );
    case "maintenance":
      return (
        <span className="flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-400">
          <AlertTriangle className="h-3 w-3" /> Wartung
        </span>
      );
    default:
      return <span className="text-xs text-muted-foreground">{status}</span>;
  }
}

function userStatusColor(status: string) {
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

function userStatusLabel(status: string) {
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

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const user = mockAdminUsers.find((u) => u.id === userId);

  if (!user) {
    notFound();
  }

  const tokenPct =
    user.tokens.limit > 0
      ? Math.min((user.tokens.usedThisMonth / user.tokens.limit) * 100, 100)
      : 0;
  const tokenBarColor =
    tokenPct > 80 ? "bg-accent-danger" : tokenPct > 60 ? "bg-amber-400" : "bg-accent-success";

  return (
    <div className="p-6 lg:p-8">
      {/* Breadcrumb */}
      <Link
        href="/admin/users"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Nutzerliste
      </Link>

      {/* User Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground capitalize">
            {user.role}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${userStatusColor(user.status)}`}
          >
            {userStatusLabel(user.status)}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Key className="h-4 w-4" /> API-Keys
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{user.apiKeys.active}</p>
          <p className="text-xs text-muted-foreground">
            {user.apiKeys.inactive} inaktiv · {user.apiKeys.revoked} widerrufen
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cpu className="h-4 w-4" /> Tokens (Monat)
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {formatTokens(user.tokens.usedThisMonth)}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full ${tokenBarColor}`}
              style={{ width: `${tokenPct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            von {formatTokens(user.tokens.limit)} ({tokenPct.toFixed(0)}%)
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AppWindow className="h-4 w-4" /> Anwendungen
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{user.applications.length}</p>
          <p className="text-xs text-muted-foreground">verbundene Apps</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Server className="h-4 w-4" /> Server
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{user.servers.length}</p>
          <p className="text-xs text-muted-foreground">
            {user.servers.filter((s) => s.status === "running").length} laufend
          </p>
        </div>
      </div>

      {/* Meta Info */}
      <div className="mb-6 glass-card grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Nutzer-ID</p>
          <p className="mt-0.5 text-sm font-medium font-mono text-foreground">{user.id}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Registriert am</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">{user.registeredAt}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Letzter Login</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">{user.lastLogin}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Tokens gesamt</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            {formatTokens(user.tokens.usedTotal)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="api-keys">
        <TabsList className="mb-4">
          <TabsTrigger value="api-keys">
            API-Keys ({user.apiKeys.total})
          </TabsTrigger>
          <TabsTrigger value="applications">
            Anwendungen ({user.applications.length})
          </TabsTrigger>
          <TabsTrigger value="servers">
            Server ({user.servers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys">
          <div className="glass-card overflow-hidden">
            {user.apiKeys.keys.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                Keine API-Keys vorhanden.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Name
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Erstellt
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Zuletzt genutzt
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {user.apiKeys.keys.map((key) => (
                    <tr key={key.id} className="hover:bg-surface">
                      <td className="px-5 py-3">
                        <p className="font-medium text-foreground">{key.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{key.id}</p>
                      </td>
                      <td className="px-5 py-3">{statusBadge(key.status)}</td>
                      <td className="px-5 py-3 text-muted-foreground">{key.createdAt}</td>
                      <td className="px-5 py-3 text-muted-foreground">{key.lastUsed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="applications">
          <div className="glass-card overflow-hidden">
            {user.applications.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                Keine Anwendungen verbunden.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Anwendung
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Kategorie
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Verbunden am
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {user.applications.map((app) => (
                    <tr key={app.id} className="hover:bg-surface">
                      <td className="px-5 py-3 font-medium text-foreground">{app.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{app.category}</td>
                      <td className="px-5 py-3 text-muted-foreground">{app.connectedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="servers">
          <div className="glass-card overflow-hidden">
            {user.servers.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                Keine Server zugewiesen.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Server
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Region
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {user.servers.map((srv) => (
                    <tr key={srv.id} className="hover:bg-surface">
                      <td className="px-5 py-3">
                        <p className="font-medium font-mono text-foreground">{srv.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{srv.id}</p>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{srv.region}</td>
                      <td className="px-5 py-3">{statusBadge(srv.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
