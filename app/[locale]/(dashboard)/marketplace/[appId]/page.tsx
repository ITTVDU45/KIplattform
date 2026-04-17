"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Star,
  Download,
  Check,
  ExternalLink,
  Clock,
  User,
  Package,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import * as api from "@/lib/mock/api";
import type { MarketplaceApp } from "@/types/domain";

export default function AppDetailPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<MarketplaceApp | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    async function loadApp() {
      try {
        const res = await api.getMarketplaceApp(params.appId as string);
        setApp(res.data);
      } finally {
        setLoading(false);
      }
    }
    loadApp();
  }, [params.appId]);

  async function handleInstall() {
    if (!app) return;
    setInstalling(true);
    try {
      await api.installApp(app.id);
      setApp({ ...app, installed: true });
      toast.success("App erfolgreich installiert");
    } catch {
      toast.error("Fehler bei der Installation");
    } finally {
      setInstalling(false);
    }
  }

  async function handleUninstall() {
    if (!app) return;
    setInstalling(true);
    try {
      await api.uninstallApp(app.id);
      setApp({ ...app, installed: false });
      toast.success("App deinstalliert");
    } catch {
      toast.error("Fehler beim Deinstallieren");
    } finally {
      setInstalling(false);
    }
  }

  function formatPrice(app: MarketplaceApp) {
    if (app.priceType === "free") return "Kostenlos";
    if (app.priceType === "subscription") return `${app.price} €/Monat`;
    return `${app.price} € pro Nutzung`;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <PageShell title="App Details" description="">
        <LoadingState rows={6} />
      </PageShell>
    );
  }

  if (!app) {
    return (
      <PageShell title="App nicht gefunden" description="">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Die angeforderte App wurde nicht gefunden
          </p>
          <Button asChild>
            <Link href="/marketplace">Zurück zum Marketplace</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title=""
      actions={
        <Button variant="ghost" asChild>
          <Link href="/marketplace">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Link>
        </Button>
      }
    >
      {/* Header */}
      <div className="flex items-start gap-6">
        <div className="text-6xl">{app.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{app.name}</h1>
            {app.installed && <Badge variant="success">Installiert</Badge>}
          </div>
          <p className="text-muted-foreground mt-1">{app.developer}</p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{app.rating}</span>
              <span className="text-muted-foreground">({app.reviews} Bewertungen)</span>
            </div>
            <Badge variant="outline">{app.category}</Badge>
            <Badge variant={app.priceType === "free" ? "success" : "secondary"}>
              {formatPrice(app)}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {app.installed ? (
            <>
              <Button variant="secondary" disabled>
                <Check className="h-4 w-4 mr-2" />
                Installiert
              </Button>
              <Button
                variant="outline"
                className="text-destructive"
                onClick={handleUninstall}
                disabled={installing}
              >
                Deinstallieren
              </Button>
            </>
          ) : (
            <Button onClick={handleInstall} disabled={installing}>
              <Download className="h-4 w-4 mr-2" />
              {installing ? "Wird installiert..." : "Installieren"}
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Content */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
          <TabsTrigger value="reviews">Bewertungen</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Beschreibung</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{app.longDescription}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Funktionen</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Einfache Integration über API
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Automatische Skalierung
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Detaillierte Nutzungsstatistiken
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Webhook-Unterstützung
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informationen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Entwickler:</span>
                    <span>{app.developer}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Version:</span>
                    <span>{app.version}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Aktualisiert:</span>
                    <span>{formatDate(app.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="#">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Dokumentation
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="#">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Support
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="screenshots" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-video bg-muted rounded-lg flex items-center justify-center"
                  >
                    <span className="text-muted-foreground">
                      Screenshot {i}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[
                  { rating: 5, user: "Anna M.", comment: "Hervorragende Integration, sehr einfach zu nutzen!", date: "15.01.2025" },
                  { rating: 4, user: "Thomas K.", comment: "Funktioniert gut, aber könnte schneller sein.", date: "10.01.2025" },
                  { rating: 5, user: "Lisa S.", comment: "Genau das, was ich gesucht habe. Top!", date: "05.01.2025" },
                ].map((review, i) => (
                  <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star
                              key={j}
                              className={`h-4 w-4 ${
                                j < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium">{review.user}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{review.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
