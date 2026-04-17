"use client";

import { useState } from "react";
import { Search, Key, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { mockAdminUsers } from "@/lib/mock/admin-data";
import Link from "next/link";

const allKeys = mockAdminUsers.flatMap((user) =>
  user.apiKeys.keys.map((key) => ({
    ...key,
    userId: user.id,
    userName: `${user.firstName} ${user.lastName}`,
    userEmail: user.email,
  })),
);

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
    default:
      return <span className="text-xs text-muted-foreground">{status}</span>;
  }
}

export default function AdminApiKeysPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "revoked">(
    "all",
  );

  const filtered = allKeys.filter((key) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      key.name.toLowerCase().includes(q) ||
      key.userName.toLowerCase().includes(q) ||
      key.userEmail.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || key.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    active: allKeys.filter((k) => k.status === "active").length,
    inactive: allKeys.filter((k) => k.status === "inactive").length,
    revoked: allKeys.filter((k) => k.status === "revoked").length,
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">API-Keys</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {allKeys.length} Keys gesamt · {counts.active} aktiv · {counts.inactive} inaktiv ·{" "}
          {counts.revoked} widerrufen
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Key-Name oder Nutzer suchen..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "active", "inactive", "revoked"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "Alle" : s === "active" ? "Aktiv" : s === "inactive" ? "Inaktiv" : "Widerrufen"}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Key className="h-3 w-3" /> Key
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Nutzer
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Erstellt
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Zuletzt genutzt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Keine API-Keys gefunden.
                  </td>
                </tr>
              ) : (
                filtered.map((key) => (
                  <tr key={key.id} className="hover:bg-surface">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{key.name}</p>
                      <p className="text-xs font-mono text-muted-foreground">{key.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${key.userId}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {key.userName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{key.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">{statusBadge(key.status)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{key.createdAt}</td>
                    <td className="px-4 py-3 text-muted-foreground">{key.lastUsed}</td>
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
