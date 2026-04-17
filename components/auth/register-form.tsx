"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { authService, AuthServiceError } from "@/lib/auth/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RegisterSalutation } from "@/lib/auth/auth.types";

function mapRegisterError(error: unknown): string {
  if (error instanceof AuthServiceError) {
    return error.message;
  }

  return "Registrierung fehlgeschlagen. Bitte erneut versuchen.";
}

export function RegisterForm() {
  const router = useRouter();
  const [salutation, setSalutation] = useState<RegisterSalutation | "">("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!salutation) {
      const message = "Bitte waehle eine Anrede aus.";
      setError(message);
      toast.error(message);
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.register({
        salutation,
        firstName,
        lastName,
        email,
        password,
      });
      toast.success(result.message);
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
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground" htmlFor="salutation">
            Anrede
          </Label>
          <Select
            value={salutation}
            onValueChange={(value) => setSalutation(value as RegisterSalutation)}
          >
            <SelectTrigger id="salutation" aria-label="Anrede">
              <SelectValue placeholder="Anrede waehlen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Herr">Herr</SelectItem>
              <SelectItem value="Frau">Frau</SelectItem>
              <SelectItem value="Divers">Divers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground" htmlFor="firstName">
              Vorname
            </Label>
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
            <Label className="text-sm font-medium text-foreground" htmlFor="lastName">
              Nachname
            </Label>
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
          <Label className="text-sm font-medium text-foreground" htmlFor="email">
            E-Mail
          </Label>
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
          <Label className="text-sm font-medium text-foreground" htmlFor="password">
            Passwort
          </Label>
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
