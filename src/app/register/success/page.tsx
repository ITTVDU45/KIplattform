import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RegisterSuccessPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-36 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-accent-success/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-accent-primary/10 blur-3xl" />

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
        <section className="glass-card border-gradient p-6 md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-success/15">
              <CheckCircle2 className="h-5 w-5 text-accent-success" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Danke fuer deine Registrierung</h1>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Request Received
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Deine Registrierung wurde erfolgreich uebermittelt.
            Nach der Freischaltung kannst du dich einloggen.
          </p>

          <div className="mt-6 space-y-3">
            <Button asChild className="w-full">
              <Link href="/login">Zum Login</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/register">Weitere Registrierung</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
