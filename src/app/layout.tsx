import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "C - KI-Services Dashboard",
  description: "Verwalten Sie Ihre KI-Services, API-Keys und Integrationen",
  applicationName: "Curser",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Curser",
  },
  icons: {
    apple: "/icons/apple-touch-icon.svg",
  },
};

export const viewport = {
  themeColor: "#3B82F6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
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
      </body>
    </html>
  );
}
