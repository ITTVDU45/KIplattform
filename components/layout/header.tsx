"use client";

import { Bell, Search, User, Globe, BookOpen, Code2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter, Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth/auth-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { Locale } from "@/i18n/routing";
import { APP_NAME } from "@/config/constants";

export function Header() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const { authenticated, isLoading, logout, roles, user } = useAuth();
  const unreadCount = 2;
  const displayName = user?.email?.split("@")[0] ?? "Nicht angemeldet";
  const displayEmail = user?.email ?? "guest@example.com";
  const roleLabel = roles.length > 0 ? roles.join(", ") : "Gast";

  function switchLocale(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale });
  }

  async function handleLogout() {
    await logout();
    window.location.assign("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center gap-2 md:gap-4 border-b border-border bg-card/80 backdrop-blur-xl px-4 md:px-6">
      {/* Mobile Logo */}
      <Link href="/dashboard" className="flex md:hidden items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          {APP_NAME.charAt(0)}
        </div>
        <span className="text-lg font-bold text-foreground">{APP_NAME}</span>
      </Link>

      <div className="flex flex-1 items-center gap-2 md:gap-4">
        {/* Search - Hidden on mobile, shown on desktop */}
        <div className="hidden md:block relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("header.search")}
            className="pl-9 bg-surface-2/50 border-border focus:border-primary/50 focus:bg-surface transition-all"
          />
        </div>
        
        {/* Mobile Search Button */}
        <Button variant="ghost" size="icon" className="md:hidden hover:bg-accent h-10 w-10">
          <Search className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
      
      <div className="flex items-center gap-1 md:gap-3">
        {/* Docs & API Reference - Desktop only */}
        <div className="hidden lg:flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/docs" className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span>{t("header.docs")}</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/docs#api" className="flex items-center gap-1.5">
              <Code2 className="h-4 w-4" />
              <span>{t("header.apiReference")}</span>
            </Link>
          </Button>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-accent h-10 w-10">
              <Globe className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-xl border-border">
            <DropdownMenuLabel className="text-foreground">{t("language.switch")}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem 
              onClick={() => switchLocale("de")}
              className={`focus:bg-accent min-h-[44px] ${locale === "de" ? "text-primary" : "text-muted-foreground"}`}
            >
              🇩🇪 {t("language.de")}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => switchLocale("en")}
              className={`focus:bg-accent min-h-[44px] ${locale === "en" ? "text-primary" : "text-muted-foreground"}`}
            >
              🇬🇧 {t("language.en")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-accent h-10 w-10">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-danger opacity-75" />
                  <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent-danger text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-popover/95 backdrop-blur-xl border-border">
            <DropdownMenuLabel className="text-foreground">{t("header.notifications")}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 focus:bg-accent min-h-[60px]">
              <div className="font-medium text-foreground">API-Key läuft bald ab</div>
              <div className="text-xs text-muted-foreground">
                Ihr API-Key &apos;Analytics Service&apos; läuft in 30 Tagen ab.
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 focus:bg-accent min-h-[60px]">
              <div className="font-medium text-foreground">Neues Feature verfügbar</div>
              <div className="text-xs text-muted-foreground">
                Der Workflow-Builder unterstützt jetzt bedingte Verzweigungen.
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="text-center text-primary justify-center focus:bg-accent min-h-[44px]">
              {t("header.showAll")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu - Hidden on mobile (less space) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-accent h-10 w-10">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-xl border-border">
            <DropdownMenuLabel className="text-foreground">
              <div className="flex flex-col">
                <span>{isLoading ? "Lade..." : displayName}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {displayEmail}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {roleLabel}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild className="text-muted-foreground focus:bg-accent focus:text-foreground min-h-[44px]">
              <Link href="/profile">{t("header.profile")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-muted-foreground focus:bg-accent focus:text-foreground min-h-[44px]">
              <Link href="/settings">{t("header.settings")}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            {authenticated ? (
              <DropdownMenuItem
                className="text-accent-danger focus:bg-destructive/10 focus:text-destructive min-h-[44px]"
                onClick={handleLogout}
              >
                {t("header.logout")}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
