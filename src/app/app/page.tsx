"use client";

import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth/auth.service";
import { tokenStorage } from "@/lib/auth/token.storage";
import { Button } from "@/components/ui/button";

export default function CustomerAppPage() {
  const router = useRouter();
  const tokens = tokenStorage.getTokens();

  const handleLogout = () => {
    authService.logout();
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
          <p className="font-medium text-foreground">Token-Status</p>
          <p className="mt-2 text-muted-foreground">
            Access-Token vorhanden: {tokens?.accessToken ? "Ja" : "Nein"}
          </p>
          <p className="text-muted-foreground">
            Refresh-Token vorhanden: {tokens?.refreshToken ? "Ja" : "Nein"}
          </p>
        </div>

        <Button className="mt-6" onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>
    </main>
  );
}
