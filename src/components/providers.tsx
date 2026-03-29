"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="curser-theme">
      <AuthProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast:
                "bg-popover/95 backdrop-blur-xl border border-border text-foreground",
              title: "text-foreground",
              description: "text-muted-foreground",
              success: "border-accent-success/30",
              error: "border-destructive/30",
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
