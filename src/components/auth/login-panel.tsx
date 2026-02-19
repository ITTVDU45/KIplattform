"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { authService, AuthServiceError } from "@/lib/auth/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function mapLoginError(error: unknown): string {
  if (error instanceof AuthServiceError) {
    const message = error.message.toLowerCase();

    if (error.status === 401) {
      return "Der Account ist noch nicht freigeschaltet oder die Zugangsdaten sind nicht korrekt.";
    }

    if (
      error.status === 403 ||
      message.includes("pending") ||
      message.includes("inactive") ||
      message.includes("freigeschaltet") ||
      message.includes("freischaltung") ||
      message.includes("not active") ||
      message.includes("not approved")
    ) {
      return "Dein Account ist noch nicht freigeschaltet.";
    }

    if (message.includes("invalid")) {
      return "Falsche E-Mail oder falsches Passwort.";
    }

    return error.message;
  }

  return "Login fehlgeschlagen. Bitte erneut versuchen.";
}

export function LoginPanel() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authService.login({ email, password });
      toast.success("Login erfolgreich");
      router.replace("/app");
    } catch (submitError) {
      const message = mapLoginError(submitError);
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card border-gradient p-6 md:p-7">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/15">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Login</h1>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Customer Access
          </p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Bitte mit deinem freigeschalteten Kundenkonto anmelden.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            E-Mail
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="password">
            Passwort
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? "Anmeldung..." : "Einloggen"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Noch kein Konto?{" "}
        <Link className="font-medium text-primary hover:underline" href="/register">
          Jetzt registrieren
        </Link>
      </p>
    </div>
  );
}
