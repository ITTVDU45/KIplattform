"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PageShell } from "@/components/layout/page-shell";
import { StatCard } from "@/components/common/stat-card";
import { MiniChart } from "@/components/common/mini-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingCards } from "@/components/common/loading-state";
import {
  Activity,
  Key,
  CreditCard,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import * as api from "@/lib/mock/api";
import type { UsageStats, LogEntry, ApiKey } from "@/types/domain";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [usageRes, logsRes, keysRes, balanceRes] = await Promise.all([
          api.getUsageStats(),
          api.getLogs(),
          api.getApiKeys(),
          api.getBalance(),
        ]);
        setUsageStats(usageRes.data);
        setRecentLogs(logsRes.data.slice(0, 5));
        setApiKeys(keysRes.data);
        setBalance(balanceRes.data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <PageShell title={t("title")} description={t("description")}>
        <LoadingCards count={4} />
      </PageShell>
    );
  }

  const totalRequests = usageStats.reduce((sum, s) => sum + s.requests, 0);
  const totalSuccess = usageStats.reduce((sum, s) => sum + s.successCount, 0);
  const successRate = totalRequests > 0 ? (totalSuccess / totalRequests) * 100 : 0;
  const activeKeys = apiKeys.filter((k) => k.status === "active").length;
  const avgDuration = usageStats.length > 0
    ? Math.round(usageStats.reduce((sum, s) => sum + s.avgDuration, 0) / usageStats.length)
    : 0;

  const chartData = usageStats.slice(-14).map((s) => s.requests);

  return (
    <PageShell
      title={t("title")}
      description={t("description")}
      actions={
        <Button asChild>
          <Link href="/api-keys">
            <Key className="h-4 w-4 mr-2" />
            {t("newApiKey")}
          </Link>
        </Button>
      }
    >
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("kpis.requests")}
          value={totalRequests.toLocaleString("de-DE")}
          trend={{ value: 12.5, label: "vs. Vormonat" }}
          icon={Activity}
        />
        <StatCard
          title={t("kpis.successRate")}
          value={`${successRate.toFixed(1)}%`}
          trend={{ value: 2.1, label: "vs. Vormonat" }}
          icon={Zap}
        />
        <StatCard
          title={t("kpis.activeKeys")}
          value={activeKeys}
          description={`${apiKeys.length} ${t("kpis.total")}`}
          icon={Key}
        />
        <StatCard
          title={t("kpis.balance")}
          value={`${balance.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`}
          description={t("kpis.available")}
          icon={CreditCard}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Request Chart */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">
              {t("charts.requestsOverTime")}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/usage">
                {t("charts.details")}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <MiniChart data={chartData} height={200} showArea color="primary" />
            <div className="flex justify-between mt-4 text-sm text-muted-foreground">
              <span>Ø {avgDuration}ms</span>
              <span>{totalRequests.toLocaleString("de-DE")} Requests</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">
              {t("charts.recentActivity")}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/logs">
                {t("charts.allLogs")}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLogs.map((log, index) => (
                <div 
                  key={log.id} 
                  className="flex items-start gap-3 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="mt-0.5">
                    {log.statusCode < 400 ? (
                      <CheckCircle className="h-4 w-4 text-accent-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-accent-danger" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {log.method}
                      </Badge>
                      <span className="text-sm font-medium truncate text-foreground">
                        {log.endpoint}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{log.duration}ms</span>
                      <span>•</span>
                      <span>{log.apiKeyName}</span>
                    </div>
                  </div>
                  <Badge
                    variant={log.statusCode < 400 ? "success" : "destructive"}
                    className="text-xs"
                  >
                    {log.statusCode}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t("quickActions.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 justify-start group" asChild>
              <Link href="/api-keys">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/10 mr-3 transition-all group-hover:bg-accent-primary/20">
                  <Key className="h-5 w-5 text-accent-primary" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-foreground">{t("quickActions.manageKeys")}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("quickActions.manageKeysDesc")}
                  </div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 justify-start group" asChild>
              <Link href="/docs">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-purple/10 mr-3 transition-all group-hover:bg-accent-purple/20">
                  <Activity className="h-5 w-5 text-accent-purple" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-foreground">{t("quickActions.documentation")}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("quickActions.documentationDesc")}
                  </div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 justify-start group" asChild>
              <Link href="/billing">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-success/10 mr-3 transition-all group-hover:bg-accent-success/20">
                  <CreditCard className="h-5 w-5 text-accent-success" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-foreground">{t("quickActions.topUp")}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("quickActions.topUpDesc")}
                  </div>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 justify-start group" asChild>
              <Link href="/support">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-warning/10 mr-3 transition-all group-hover:bg-accent-warning/20">
                  <Zap className="h-5 w-5 text-accent-warning" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-foreground">{t("quickActions.support")}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("quickActions.supportDesc")}
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
