"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth/auth.service";
import { Button } from "@/components/ui/button";

function hasAdminRole(roles: string[] | undefined): boolean {
  if (!roles || roles.length === 0) {
    return false;
  }

  return roles.some((role) => role.toLowerCase() === "admin");
}

export default function AdminPage() {
  const router = useRouter();
  const currentUser = authService.getCurrentUser();

  const roles = useMemo(() => {
    if (!currentUser) {
      return [] as string[];
    }

    if (Array.isArray(currentUser.roles) && currentUser.roles.length > 0) {
      return currentUser.roles.map(String);
    }

    if (typeof currentUser.role === "string" && currentUser.role.trim().length > 0) {
      return [currentUser.role];
    }

    return [] as string[];
  }, [currentUser]);

  const isAdmin = hasAdminRole(roles);

  if (!isAdmin) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6">
          <h1 className="text-2xl font-semibold text-amber-900">Kein Zugriff</h1>
          <p className="mt-2 text-sm text-amber-800">
            Dein Account hat keine Admin-Berechtigung fuer diesen Bereich.
          </p>
          <Button className="mt-6" onClick={() => router.replace("/app")} variant="outline">
            Zum Kundenbereich
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10">
      <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Adminbereich</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Platzhalter fuer geschuetzte Admin-Funktionen.
        </p>
      </div>
    </main>
  );
}
