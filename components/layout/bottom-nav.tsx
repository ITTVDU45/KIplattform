"use client";

import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Key, Store, HeadphonesIcon, Menu } from "lucide-react";
import { useState } from "react";
import { MobileMenu } from "./mobile-menu";

const bottomNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, titleKey: "nav.items.dashboard" },
  { href: "/api-keys", icon: Key, titleKey: "nav.items.apiKeys" },
  { href: "/marketplace", icon: Store, titleKey: "nav.items.marketplace" },
  { href: "/support", icon: HeadphonesIcon, titleKey: "nav.items.support" },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

  function getTranslation(key: string): string {
    const parts = key.split(".");
    let result: unknown = t.raw(parts[0]);
    for (let i = 1; i < parts.length; i++) {
      if (result && typeof result === "object") {
        result = (result as Record<string, unknown>)[parts[i]];
      }
    }
    return typeof result === "string" ? result : key;
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-card/95 backdrop-blur-xl border-t border-border">
          <div className="flex items-center justify-around h-16 px-2">
            {bottomNavItems.map((item) => {
              const localizedHref = `/${locale}${item.href}`;
              const isActive = pathname === localizedHref || pathname.startsWith(`${localizedHref}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground active:text-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                  <span className="text-[10px] font-medium truncate">
                    {getTranslation(item.titleKey)}
                  </span>
                </Link>
              );
            })}
            
            {/* More Menu Button */}
            <button
              onClick={() => setMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-muted-foreground active:text-foreground min-w-[64px]"
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t("nav.more") || "Mehr"}</span>
            </button>
          </div>
        </div>
        
        {/* Safe area padding for iOS */}
        <div className="h-[env(safe-area-inset-bottom)] bg-card/95 backdrop-blur-xl" />
      </nav>

      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}
