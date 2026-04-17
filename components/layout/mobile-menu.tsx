"use client";

import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { navConfig } from "@/config/nav";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-0">
        <SheetHeader className="px-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">
              {t("nav.menu") || "Menu"}
            </SheetTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(85vh-80px)] px-4 py-4">
          <nav className="space-y-6">
            {navConfig.map((section) => (
              <div key={section.titleKey}>
                <h4 className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all active:scale-[0.98]",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted active:bg-muted"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                        <span className="flex-1">{getTranslation(item.titleKey)}</span>
                        {item.badge && (
                          <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
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
      </SheetContent>
    </Sheet>
  );
}
