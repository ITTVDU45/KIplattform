"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Puzzle, ArrowRight, Settings, Clock } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/lib/mock/api";
import type { Integration } from "@/types/domain";

const availableIntegrations = [
  { id: "slack", name: "Slack", icon: "💬", type: "communication" },
  { id: "zapier", name: "Zapier", icon: "⚡", type: "automation" },
  { id: "sheets", name: "Google Sheets", icon: "📊", type: "data" },
  { id: "notion", name: "Notion", icon: "📝", type: "documentation" },
  { id: "s3", name: "AWS S3", icon: "☁️", type: "storage" },
  { id: "webhook", name: "Custom Webhook", icon: "🔗", type: "custom" },
];

export default function IntegrationsPage() {
  const t = useTranslations("integrations");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [configName, setConfigName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getIntegrations();
        setIntegrations(res.data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleToggle(id: string) {
    try {
      await api.toggleIntegration(id);
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, status: i.status === "active" ? "inactive" : "active" }
            : i
        )
      );
      toast.success(t("messages.updated"));
    } catch {
      toast.error(t("messages.updateError"));
    }
  }

  async function handleCreateIntegration() {
    if (!selectedType || !configName) {
      toast.error(tCommon("validation.required"));
      return;
    }
    setCreating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const template = availableIntegrations.find((i) => i.id === selectedType);
    const newIntegration: Integration = {
      id: `int_${Date.now()}`,
      name: configName,
      type: template?.type || "custom",
      status: "active",
      apiKeyId: null,
      config: {},
      createdAt: new Date().toISOString(),
      lastSyncAt: null,
      icon: template?.icon || "🔗",
    };
    setIntegrations((prev) => [...prev, newIntegration]);
    setCreating(false);
    setWizardOpen(false);
    setWizardStep(1);
    setSelectedType("");
    setConfigName("");
    toast.success(t("messages.created"));
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return tCommon("time.never");
    return new Date(dateStr).toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "active": return tCommon("status.active");
      case "inactive": return tCommon("status.inactive");
      case "error": return tCommon("status.error");
      default: return status;
    }
  }

  if (loading) {
    return (
      <PageShell title={t("title")} description={t("description")}>
        <LoadingState rows={4} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={t("title")}
      description={t("description")}
      actions={
        <Button onClick={() => setWizardOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("addButton")}
        </Button>
      }
    >
      {integrations.length === 0 ? (
        <EmptyState
          icon={Puzzle}
          title={t("empty.title")}
          description={t("empty.description")}
          action={{ label: t("addButton"), onClick: () => setWizardOpen(true) }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <CardTitle className="text-base text-foreground">{integration.name}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">
                        {integration.type}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={integration.status === "active"}
                    onCheckedChange={() => handleToggle(integration.id)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {t("lastSync")}: {formatDate(integration.lastSyncAt)}
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
                    {getStatusLabel(integration.status)}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/integrations/${integration.id}`}>
                      <Settings className="h-4 w-4 mr-2" />
                      {tCommon("actions.configure")}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Integration Wizard */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {wizardStep === 1 ? t("wizard.selectTitle") : t("wizard.configureTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("wizard.step", { current: wizardStep, total: 2 })}
            </DialogDescription>
          </DialogHeader>

          {wizardStep === 1 ? (
            <div className="grid grid-cols-2 gap-2 py-4">
              {availableIntegrations.map((int) => (
                <Button
                  key={int.id}
                  variant={selectedType === int.id ? "default" : "outline"}
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setSelectedType(int.id)}
                >
                  <span className="text-2xl">{int.icon}</span>
                  <span>{int.name}</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-muted-foreground">{t("wizard.name")}</Label>
                <Input
                  id="name"
                  placeholder={t("wizard.namePlaceholder")}
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  className="bg-muted/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">{t("wizard.assignKey")}</Label>
                <Select>
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue placeholder={t("wizard.noKey")} />
                  </SelectTrigger>
                  <SelectContent className="bg-card/95 backdrop-blur-xl border-glass-border">
                    <SelectItem value="none">{t("wizard.noKey")}</SelectItem>
                    <SelectItem value="key_1">Production API</SelectItem>
                    <SelectItem value="key_2">Development API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            {wizardStep === 1 ? (
              <>
                <Button variant="outline" onClick={() => setWizardOpen(false)}>
                  {tCommon("actions.cancel")}
                </Button>
                <Button
                  onClick={() => setWizardStep(2)}
                  disabled={!selectedType}
                >
                  {tCommon("actions.next")}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setWizardStep(1)}>
                  {tCommon("actions.back")}
                </Button>
                <Button onClick={handleCreateIntegration} disabled={creating}>
                  {creating ? t("wizard.creating") : t("wizard.createButton")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
