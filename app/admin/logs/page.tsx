"use client";

import { Activity } from "lucide-react";
import { mockAdminUsers } from "@/lib/mock/admin-data";
import Link from "next/link";

const activityLog = mockAdminUsers
  .flatMap((user) => [
    ...user.apiKeys.keys.slice(0, 2).map((key) => ({
      id: `log-key-${key.id}`,
      type: "api_key_used" as const,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      description: `API-Key "${key.name}" verwendet`,
      timestamp: key.lastUsed === "—" ? user.registeredAt : key.lastUsed,
    })),
    {
      id: `log-reg-${user.id}`,
      type: "registration" as const,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      description: "Account registriert",
      timestamp: user.registeredAt,
    },
  ])
  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  .slice(0, 50);

function typeLabel(type: string) {
  switch (type) {
    case "api_key_used":
      return (
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          API-Key
        </span>
      );
    case "registration":
      return (
        <span className="rounded-full bg-accent-success/10 px-2 py-0.5 text-xs font-medium text-accent-success">
          Registrierung
        </span>
      );
    default:
      return (
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {type}
        </span>
      );
  }
}

export default function AdminLogsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Aktivitäten</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Letzte Nutzeraktivitäten und Systemereignisse
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">
            {activityLog.length} Ereignisse
          </h2>
        </div>
        <div className="divide-y divide-border">
          {activityLog.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface">
              <div className="flex items-center gap-3">
                {typeLabel(entry.type)}
                <div>
                  <p className="text-sm text-foreground">{entry.description}</p>
                  <Link
                    href={`/admin/users/${entry.userId}`}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    {entry.userName}
                  </Link>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
