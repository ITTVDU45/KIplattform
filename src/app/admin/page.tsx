"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { hasAnyRole } from "@/lib/auth/authorization";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";

export default function AdminPage() {
  const router = useRouter();
  const { authenticated, isLoading, roles } = useAuth();

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10">
        <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Authentifizierung wird geprueft...</p>
        </div>
      </main>
    );
  }

  if (!authenticated || !hasAnyRole(roles, ["superadmin", "admin"])) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6">
          <h1 className="text-2xl font-semibold text-amber-900">Kein Zugriff</h1>
          <p className="mt-2 text-sm text-amber-800">
            Dein Account hat keine Admin-Berechtigung fuer diesen Bereich.
          </p>
          <Button
            className="mt-6"
            onClick={() => router.replace(`/${routing.defaultLocale}/dashboard`)}
            variant="outline"
          >
            Zum Dashboard
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
