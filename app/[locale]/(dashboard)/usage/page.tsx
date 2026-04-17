"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { PageShell } from "@/components/layout/page-shell";
import { StatCard } from "@/components/common/stat-card";
import { MiniChart, MiniBarChart } from "@/components/common/mini-chart";
import { DataTable, type Column } from "@/components/common/data-table";
import { LoadingCards, LoadingTable } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Activity, TrendingUp, Clock } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/lib/mock/api";
import type { UsageStats, UsageByKey, UsageByEndpoint } from "@/types/domain";

export default function UsagePage() {
  const t = useTranslations("usage");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [usageByKey, setUsageByKey] = useState<UsageByKey[]>([]);
  const [usageByEndpoint, setUsageByEndpoint] = useState<UsageByEndpoint[]>([]);
  const [timeRange, setTimeRange] = useState("30d");

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, byKeyRes, byEndpointRes] = await Promise.all([
          api.getUsageStats(),
          api.getUsageByKey(),
          api.getUsageByEndpoint(),
        ]);
        setUsageStats(statsRes.data);
        setUsageByKey(byKeyRes.data);
        setUsageByEndpoint(byEndpointRes.data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function handleExport() {
    toast.success(t("messages.exportPreparing"));
    setTimeout(() => {
      toast.success(t("messages.exportSuccess"));
    }, 1500);
  }

  const totalRequests = usageStats.reduce((sum, s) => sum + s.requests, 0);
  const totalSuccess = usageStats.reduce((sum, s) => sum + s.successCount, 0);
  const totalErrors = usageStats.reduce((sum, s) => sum + s.errorCount, 0);
  const successRate = totalRequests > 0 ? (totalSuccess / totalRequests) * 100 : 0;
  const avgDuration = usageStats.length > 0
    ? Math.round(usageStats.reduce((sum, s) => sum + s.avgDuration, 0) / usageStats.length)
    : 0;

  const chartData = usageStats.map((s) => s.requests);
  const barChartData = usageStats.slice(-7).map((s) => ({
    label: new Date(s.date).toLocaleDateString(locale === "de" ? "de-DE" : "en-US", { weekday: "short" }),
    value: s.requests,
  }));

  const byKeyColumns: Column<UsageByKey>[] = [
    {
      key: "name",
      header: t("table.apiKey"),
      cell: (row) => <span className="font-medium text-foreground">{row.apiKeyName}</span>,
    },
    {
      key: "requests",
      header: t("table.requests"),
      cell: (row) => <span className="tabular-nums text-muted-foreground">{row.requests.toLocaleString(locale === "de" ? "de-DE" : "en-US")}</span>,
    },
    {
      key: "successRate",
      header: t("table.successRate"),
      cell: (row) => <span className="text-muted-foreground">{row.successRate.toFixed(1)}%</span>,
    },
  ];

  const byEndpointColumns: Column<UsageByEndpoint & { id: string }>[] = [
    {
      key: "endpoint",
      header: t("table.endpoint"),
      cell: (row) => <code className="text-sm text-accent-primary">{row.endpoint}</code>,
    },
    {
      key: "requests",
      header: t("table.requests"),
      cell: (row) => <span className="tabular-nums text-muted-foreground">{row.requests.toLocaleString(locale === "de" ? "de-DE" : "en-US")}</span>,
    },
    {
      key: "avgDuration",
      header: t("table.avgLatency"),
      cell: (row) => <span className="text-muted-foreground">{row.avgDuration}ms</span>,
    },
  ];

  if (loading) {
    return (
      <PageShell title={t("title")} description={t("description")}>
        <LoadingCards count={4} />
        <LoadingTable rows={5} cols={3} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={t("title")}
      description={t("description")}
      actions={
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px] bg-muted/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-xl border-glass-border">
              <SelectItem value="7d">{tCommon("time.last7Days")}</SelectItem>
              <SelectItem value="30d">{tCommon("time.last30Days")}</SelectItem>
              <SelectItem value="90d">{tCommon("time.last90Days")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {tCommon("actions.export")}
          </Button>
        </div>
      }
    >
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("kpis.totalRequests")}
          value={totalRequests.toLocaleString(locale === "de" ? "de-DE" : "en-US")}
          trend={{ value: 15.3, label: t("vsLastMonth") }}
          icon={Activity}
        />
        <StatCard
          title={t("kpis.successRate")}
          value={`${successRate.toFixed(1)}%`}
          trend={{ value: 2.1, label: t("vsLastMonth") }}
          icon={TrendingUp}
        />
        <StatCard
          title={t("kpis.errors")}
          value={totalErrors.toLocaleString(locale === "de" ? "de-DE" : "en-US")}
          trend={{ value: -5.2, label: t("vsLastMonth") }}
          icon={Activity}
        />
        <StatCard
          title={t("kpis.avgLatency")}
          value={`${avgDuration}ms`}
          trend={{ value: -8.4, label: t("vsLastMonth") }}
          icon={Clock}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">{t("charts.requestsOverTime")}</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniChart data={chartData} height={200} showArea color="primary" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">{t("charts.last7Days")}</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={barChartData} height={200} color="primary" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="by-key">
        <TabsList>
          <TabsTrigger value="by-key">{t("tabs.byKey")}</TabsTrigger>
          <TabsTrigger value="by-endpoint">{t("tabs.byEndpoint")}</TabsTrigger>
          <TabsTrigger value="by-status">{t("tabs.byStatus")}</TabsTrigger>
        </TabsList>

        <TabsContent value="by-key">
          <DataTable
            columns={byKeyColumns}
            data={usageByKey.map((u) => ({ ...u, id: u.apiKeyId }))}
          />
        </TabsContent>

        <TabsContent value="by-endpoint">
          <DataTable
            columns={byEndpointColumns}
            data={usageByEndpoint.map((u, i) => ({ ...u, id: `endpoint-${i}` }))}
          />
        </TabsContent>

        <TabsContent value="by-status">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-6 rounded-xl bg-accent-success/10 border border-accent-success/20">
                  <div className="text-3xl font-bold text-accent-success tabular-nums">
                    {totalSuccess.toLocaleString(locale === "de" ? "de-DE" : "en-US")}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {t("status.success")}
                  </div>
                </div>
                <div className="text-center p-6 rounded-xl bg-accent-warning/10 border border-accent-warning/20">
                  <div className="text-3xl font-bold text-accent-warning tabular-nums">
                    {Math.round(totalErrors * 0.3).toLocaleString(locale === "de" ? "de-DE" : "en-US")}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {t("status.clientErrors")}
                  </div>
                </div>
                <div className="text-center p-6 rounded-xl bg-accent-danger/10 border border-accent-danger/20">
                  <div className="text-3xl font-bold text-accent-danger tabular-nums">
                    {Math.round(totalErrors * 0.7).toLocaleString(locale === "de" ? "de-DE" : "en-US")}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {t("status.serverErrors")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
