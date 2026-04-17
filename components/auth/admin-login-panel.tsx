"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDeviceContext } from "@/lib/auth/device";

function mapAdminLoginError(status: number, message: string): string {
  if (status === 403) {
    return "Kein Admin-Zugang. Dein Account hat keine Berechtigung für diesen Bereich.";
  }
  if (status === 401) {
    return "E-Mail oder Passwort ist nicht korrekt.";
  }
  if (status === 429) {
    return "Zu viele Anmeldeversuche. Bitte später erneut versuchen.";
  }
  if (status === 503) {
    return "Auth-Service nicht erreichbar. Bitte später erneut versuchen.";
  }
  return message || "Anmeldung fehlgeschlagen.";
}

export function AdminLoginPanel() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const deviceContext = await getDeviceContext();

      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          deviceFingerprint: deviceContext.deviceFingerprint,
          deviceName: deviceContext.deviceName,
        }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        const msg = mapAdminLoginError(response.status, data.message ?? "");
        setError(msg);
        toast.error(msg);
        return;
      }

      await refreshSession();
      toast.success("Admin-Login erfolgreich");
      router.replace("/admin/dashboard");
    } catch {
      const msg = "Verbindungsfehler. Bitte erneut versuchen.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card border-gradient p-6 md:p-8">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15">
          <ShieldAlert className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Admin-Login</h1>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Geschützter Bereich
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Nur Accounts mit Admin- oder Superadmin-Berechtigung können sich hier anmelden.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="admin-email">
            E-Mail
          </label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="admin-password">
            Passwort
          </label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button
          className="w-full bg-amber-500 text-black hover:bg-amber-400"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Anmeldung..." : "Als Admin einloggen"}
        </Button>
      </form>

      <p className="mt-5 text-xs text-muted-foreground">
        Normaler Kundenzugang?{" "}
        <a className="font-medium text-primary hover:underline" href="/login">
          Zum Kunden-Login
        </a>
      </p>
    </div>
  );
}
