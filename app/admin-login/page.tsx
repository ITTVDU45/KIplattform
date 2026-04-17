import { AdminLoginPanel } from "@/components/auth/admin-login-panel";

export const metadata = {
  title: "Admin-Login – KI-Plattform",
};

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-amber-500/8 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-amber-600/6 blur-[100px]"
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-amber-400">
            Administration
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            KI-Plattform Verwaltungszugang
          </p>
        </div>
        <AdminLoginPanel />
      </div>
    </main>
  );
}
