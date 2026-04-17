"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { hasAnyRole } from "@/lib/auth/authorization";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authenticated, isLoading, roles } = useAuth();

  useEffect(() => {
    if (!isLoading && (!authenticated || !hasAnyRole(roles, ["admin", "superadmin"]))) {
      router.replace("/admin-login");
    }
  }, [isLoading, authenticated, roles, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Wird geladen...</p>
      </div>
    );
  }

  if (!authenticated || !hasAnyRole(roles, ["admin", "superadmin"])) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Weiterleitung...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
