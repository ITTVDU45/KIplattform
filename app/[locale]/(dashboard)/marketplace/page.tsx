"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { FiltersBar } from "@/components/common/filters-bar";
import { LoadingCards } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Store, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/lib/mock/api";
import type { MarketplaceApp } from "@/types/domain";

export default function MarketplacePage() {
  const t = useTranslations("marketplace");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<MarketplaceApp[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [installing, setInstalling] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getMarketplaceApps();
        setApps(res.data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Helper to get translated description
  const getAppDescription = useCallback((app: MarketplaceApp) => {
    if (app.descriptionKey) {
      try {
        return t(`apps.${app.descriptionKey}.description`);
      } catch {
        return app.description;
      }
    }
    return app.description;
  }, [t]);

  // Helper to get translated category
  const getAppCategory = useCallback((app: MarketplaceApp) => {
    if (app.categoryKey) {
      try {
        return t(`categories.${app.categoryKey}`);
      } catch {
        return app.category;
      }
    }
    return app.category;
  }, [t]);

  const categories = useMemo(() => {
    const categoryKeys = new Set(apps.map((a) => a.categoryKey || a.category));
    return Array.from(categoryKeys).map((key) => {
      const label = t.has(`categories.${key}`) ? t(`categories.${key}`) : key;
      return { label, value: key };
    });
  }, [apps, t]);

  const filteredApps = useMemo(() => {
    let result = apps.filter((app) => {
      const appDesc = getAppDescription(app);
      const matchesSearch =
        app.name.toLowerCase().includes(search.toLowerCase()) ||
        appDesc.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !category || category === "all" || app.categoryKey === category || app.category === category;
      return matchesSearch && matchesCategory;
    });

    // Sort
    switch (sortBy) {
      case "popular":
        result = result.sort((a, b) => b.reviews - a.reviews);
        break;
      case "rating":
        result = result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        result = result.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        break;
    }

    return result;
  }, [apps, search, category, sortBy, getAppDescription]);

  const installedApps = apps.filter((a) => a.installed);

  async function handleInstall(appId: string) {
    setInstalling(appId);
    try {
      await api.installApp(appId);
      setApps((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, installed: true } : a))
      );
      toast.success(t("messages.installSuccess"));
    } catch {
      toast.error(t("messages.installError"));
    } finally {
      setInstalling(null);
    }
  }

  async function handleUninstall(appId: string) {
    setInstalling(appId);
    try {
      await api.uninstallApp(appId);
      setApps((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, installed: false } : a))
      );
      toast.success(t("messages.uninstallSuccess"));
    } catch {
      toast.error(t("messages.uninstallError"));
    } finally {
      setInstalling(null);
    }
  }

  function formatPrice(app: MarketplaceApp) {
    if (app.priceType === "free") return t("price.free");
    if (app.priceType === "subscription") return `${app.price} ${t("price.perMonth")}`;
    return `${app.price} ${t("price.perUse")}`;
  }

  if (loading) {
    return (
      <PageShell title={t("title")} description={t("description")}>
        <LoadingCards count={8} />
      </PageShell>
    );
  }

  return (
    <PageShell title={t("title")} description={t("description")}>
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">{t("tabs.all")}</TabsTrigger>
          <TabsTrigger value="installed">
            {t("tabs.installed")} ({installedApps.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-4">
          <FiltersBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("filters.searchPlaceholder")}
            filters={[
              {
                key: "category",
                label: t("filters.category"),
                options: categories,
                value: category,
                onChange: setCategory,
              },
            ]}
            onReset={() => {
              setSearch("");
              setCategory("");
            }}
            actions={
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px] bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card/95 backdrop-blur-xl border-glass-border">
                  <SelectItem value="popular">{t("sort.popular")}</SelectItem>
                  <SelectItem value="rating">{t("sort.rating")}</SelectItem>
                  <SelectItem value="newest">{t("sort.newest")}</SelectItem>
                </SelectContent>
              </Select>
            }
          />

          {filteredApps.length === 0 ? (
            <EmptyState
              icon={Store}
              title={t("empty.title")}
              description={t("empty.description")}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredApps.map((app) => (
                <Card key={app.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{app.icon}</div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate text-foreground">
                          {app.name}
                        </CardTitle>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-foreground">{app.rating}</span>
                          <span className="text-xs text-muted-foreground">
                            ({app.reviews})
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {getAppDescription(app)}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline">{getAppCategory(app)}</Badge>
                      <Badge
                        variant={app.priceType === "free" ? "success" : "secondary"}
                      >
                        {formatPrice(app)}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/marketplace/${app.id}`}>
                        {t("actions.details")}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                    {app.installed ? (
                      <Button
                        variant="secondary"
                        onClick={() => handleUninstall(app.id)}
                        disabled={installing === app.id}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t("actions.installed")}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleInstall(app.id)}
                        disabled={installing === app.id}
                      >
                        {installing === app.id ? "..." : t("actions.install")}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="installed" className="mt-6">
          {installedApps.length === 0 ? (
            <EmptyState
              icon={Store}
              title={t("empty.noInstalled")}
              description={t("empty.noInstalledDesc")}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {installedApps.map((app) => (
                <Card key={app.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{app.icon}</div>
                      <div className="flex-1">
                        <CardTitle className="text-base text-foreground">{app.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          v{app.version} • {app.developer}
                        </p>
                      </div>
                      <Badge variant="success">{tCommon("status.active")}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {getAppDescription(app)}
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/marketplace/${app.id}`}>{t("actions.manage")}</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-accent-danger hover:bg-accent-danger/10"
                      onClick={() => handleUninstall(app.id)}
                      disabled={installing === app.id}
                    >
                      {t("actions.uninstall")}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
