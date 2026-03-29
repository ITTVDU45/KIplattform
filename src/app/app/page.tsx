"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";

export default function CustomerAppPage() {
  const router = useRouter();
  const { authenticated, isLoading, logout, roles, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10">
      <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Kundenbereich</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dieser Bereich ist durch den Auth-Guard geschuetzt.
        </p>

        <div className="mt-6 rounded-lg border border-border bg-muted/20 p-4 text-sm">
          <p className="font-medium text-foreground">Session-Status</p>
          <p className="mt-2 text-muted-foreground">
            Authentifiziert: {isLoading ? "Pruefung..." : authenticated ? "Ja" : "Nein"}
          </p>
          <p className="text-muted-foreground">
            E-Mail: {user?.email ?? "Unbekannt"}
          </p>
          <p className="text-muted-foreground">
            Rollen: {roles.length > 0 ? roles.join(", ") : "Keine"}
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            onClick={() => router.replace(`/${routing.defaultLocale}/dashboard`)}
            variant="default"
          >
            Zum Dashboard
          </Button>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>
      </div>
    </main>
  );
}
