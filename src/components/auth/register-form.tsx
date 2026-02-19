"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { authService, AuthServiceError } from "@/lib/auth/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SUCCESS_MESSAGE = "Registrierung eingegangen, Freischaltung folgt";

function mapRegisterError(error: unknown): string {
  if (error instanceof AuthServiceError) {
    return error.message;
  }

  return "Registrierung fehlgeschlagen. Bitte erneut versuchen.";
}

export function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authService.register({
        firstName,
        lastName,
        phone,
        email,
        password,
      });
      toast.success(SUCCESS_MESSAGE);
      router.push("/register/success");
    } catch (submitError) {
      const message = mapRegisterError(submitError);
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card border-gradient p-6 md:p-7">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-success/15">
          <UserPlus className="h-5 w-5 text-accent-success" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Registrierung</h1>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            New Customer
          </p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Nach der Registrierung wird dein Konto im Adminpanel geprueft.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="firstName">
              Vorname
            </label>
            <Input
              id="firstName"
              type="text"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="lastName">
              Nachname
            </label>
            <Input
              id="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="phone">
            Telefonnummer
          </label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>

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
            autoComplete="new-password"
            required
            minLength={8}
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
          {isLoading ? "Sende..." : "Registrieren"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Bereits registriert?{" "}
        <Link className="font-medium text-primary hover:underline" href="/login">
          Zum Login
        </Link>
      </p>
    </div>
  );
}
