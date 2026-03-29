"use client";

import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { navConfig } from "@/config/nav";
import { APP_NAME } from "@/config/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();

  // Helper to get translation by dot-separated key
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
    <aside className="hidden md:block fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-glow transition-all duration-200 group-hover:scale-105">
            {APP_NAME.charAt(0)}
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">{APP_NAME}</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="h-[calc(100vh-4rem)] px-3 py-4">
        <nav className="space-y-6">
          {navConfig.map((section) => (
            <div key={section.titleKey}>
              <h4 className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {getTranslation(section.titleKey)}
              </h4>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const localizedHref = `/${locale}${item.href}`;
                  const isActive = pathname === localizedHref || pathname.startsWith(`${localizedHref}/`);
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary/12 text-primary active-indicator"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4 transition-colors",
                        isActive ? "text-primary" : ""
                      )} />
                      <span className="flex-1">{getTranslation(item.titleKey)}</span>
                      {item.badge && (
                        <Badge 
                          variant={isActive ? "default" : "secondary"} 
                          className="text-[10px] px-1.5"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
