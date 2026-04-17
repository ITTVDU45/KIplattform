"use client";

import Link from "next/link";
import { Server, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { mockAdminUsers } from "@/lib/mock/admin-data";

const allServers = mockAdminUsers.flatMap((user) =>
  user.servers.map((srv) => ({
    ...srv,
    userId: user.id,
    userName: `${user.firstName} ${user.lastName}`,
    userEmail: user.email,
  })),
);

function statusBadge(status: string) {
  switch (status) {
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

export default function AdminServersPage() {
  const running = allServers.filter((s) => s.status === "running").length;
  const stopped = allServers.filter((s) => s.status === "stopped").length;
  const maintenance = allServers.filter((s) => s.status === "maintenance").length;

  const byRegion = allServers.reduce<Record<string, number>>((acc, s) => {
    acc[s.region] = (acc[s.region] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Server</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {allServers.length} Server gesamt · {running} laufend · {stopped} gestoppt ·{" "}
          {maintenance} in Wartung
        </p>
      </div>

      {/* Region summary */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Object.entries(byRegion).map(([region, count]) => (
          <div key={region} className="glass-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Server className="h-4 w-4" /> {region}
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{count}</p>
            <p className="text-xs text-muted-foreground">Server</p>
          </div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Server
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Region
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Nutzer
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allServers.map((srv) => (
                <tr key={srv.id} className="hover:bg-surface">
                  <td className="px-4 py-3">
                    <p className="font-medium font-mono text-foreground">{srv.name}</p>
                    <p className="text-xs font-mono text-muted-foreground">{srv.id}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{srv.region}</td>
                  <td className="px-4 py-3">{statusBadge(srv.status)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${srv.userId}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {srv.userName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{srv.userEmail}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
