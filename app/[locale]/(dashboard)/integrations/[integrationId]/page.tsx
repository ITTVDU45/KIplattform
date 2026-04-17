"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Settings,
  Activity,
  FileText,
  Save,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import * as api from "@/lib/mock/api";
import type { Integration } from "@/types/domain";

export default function IntegrationDetailPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getIntegration(params.integrationId as string);
        setIntegration(res.data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.integrationId]);

  async function handleToggle() {
    if (!integration) return;
    try {
      await api.toggleIntegration(integration.id);
      setIntegration({
        ...integration,
        status: integration.status === "active" ? "inactive" : "active",
      });
      toast.success("Status aktualisiert");
    } catch {
      toast.error("Fehler beim Aktualisieren");
    }
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    toast.success("Einstellungen gespeichert");
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "Nie";
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <PageShell title="Integration" description="">
        <LoadingState rows={6} />
      </PageShell>
    );
  }

  if (!integration) {
    return (
      <PageShell title="Integration nicht gefunden" description="">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Die angeforderte Integration wurde nicht gefunden
          </p>
          <Button asChild>
            <Link href="/integrations">Zurück zu Integrationen</Link>
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
          <Link href="/integrations">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Link>
        </Button>
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{integration.icon}</span>
          <div>
            <h1 className="text-2xl font-bold">{integration.name}</h1>
            <p className="text-muted-foreground capitalize">{integration.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="active">Aktiv</Label>
            <Switch
              id="active"
              checked={integration.status === "active"}
              onCheckedChange={handleToggle}
            />
          </div>
          <Badge
            variant={
              integration.status === "active"
                ? "success"
                : integration.status === "error"
                ? "destructive"
                : "secondary"
            }
          >
            {integration.status === "active"
              ? "Aktiv"
              : integration.status === "error"
              ? "Fehler"
              : "Inaktiv"}
          </Badge>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Einstellungen
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-2">
            <Activity className="h-4 w-4" />
            Nutzung
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Allgemeine Einstellungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue={integration.name} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Erstellt am</Label>
                  <div className="mt-1">{formatDate(integration.createdAt)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Letzte Sync</Label>
                  <div className="mt-1">{formatDate(integration.lastSyncAt)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verbindungseinstellungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook">Webhook URL</Label>
                <Input
                  id="webhook"
                  placeholder="https://example.com/webhook"
                  defaultValue="https://hooks.example.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apikey">Verknüpfter API-Key</Label>
                <Input id="apikey" defaultValue={integration.apiKeyId || "Keiner"} disabled />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="destructive" onClick={() => toast.info("Löschen wird implementiert")}>
              <Trash2 className="h-4 w-4 mr-2" />
              Integration löschen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Wird gespeichert..." : "Speichern"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Nutzungsstatistiken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-3xl font-bold">1,234</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Requests (30 Tage)
                  </div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-3xl font-bold">98.5%</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Erfolgsrate
                  </div>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <div className="text-3xl font-bold">145ms</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Ø Latenz
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Letzte Aktivitäten</CardTitle>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { time: "Vor 5 Min.", event: "Webhook erfolgreich ausgelöst", status: "success" },
                  { time: "Vor 1 Std.", event: "Daten synchronisiert", status: "success" },
                  { time: "Vor 3 Std.", event: "Webhook erfolgreich ausgelöst", status: "success" },
                  { time: "Vor 6 Std.", event: "Verbindung timeout", status: "error" },
                  { time: "Gestern", event: "Integration aktiviert", status: "info" },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{log.event}</div>
                      <div className="text-sm text-muted-foreground">{log.time}</div>
                    </div>
                    <Badge
                      variant={
                        log.status === "success"
                          ? "success"
                          : log.status === "error"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {log.status === "success" ? "Erfolg" : log.status === "error" ? "Fehler" : "Info"}
                    </Badge>
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
