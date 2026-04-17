"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { PageShell } from "@/components/layout/page-shell";
import { DataTable, type Column } from "@/components/common/data-table";
import { FiltersBar } from "@/components/common/filters-bar";
import { LoadingTable } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { DetailDrawer } from "@/components/common/detail-drawer";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FileText, Server } from "lucide-react";
import * as api from "@/lib/mock/api";
import type { LogEntry } from "@/types/domain";

export default function LogsPage() {
  const t = useTranslations("logs");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [keyFilter, setKeyFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getLogs();
        setLogs(res.data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const uniqueKeys = useMemo(() => {
    const keys = new Map<string, string>();
    logs.forEach((log) => {
      keys.set(log.apiKeyId, log.apiKeyName);
    });
    return Array.from(keys.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    }));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.endpoint.toLowerCase().includes(search.toLowerCase()) ||
        log.apiKeyName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        !statusFilter || statusFilter === "all" || log.statusCode.toString().startsWith(statusFilter.charAt(0));
      const matchesKey = !keyFilter || keyFilter === "all" || log.apiKeyId === keyFilter;
      return matchesSearch && matchesStatus && matchesKey;
    });
  }, [logs, search, statusFilter, keyFilter]);

  function formatTimestamp(timestamp: string) {
    return new Date(timestamp).toLocaleString(locale === "de" ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function getStatusVariant(code: number) {
    if (code >= 200 && code < 300) return "success";
    if (code >= 400 && code < 500) return "warning";
    return "destructive";
  }

  function getMethodVariant(method: string) {
    const variants: Record<string, "default" | "success" | "warning" | "destructive" | "purple"> = {
      GET: "default",
      POST: "success",
      PUT: "warning",
      DELETE: "destructive",
      PATCH: "purple",
    };
    return variants[method] || "default";
  }

  const columns: Column<LogEntry>[] = [
    {
      key: "endpoint",
      header: t("table.endpoint"),
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Badge variant={getMethodVariant(row.method)} className="shrink-0">
            {row.method}
          </Badge>
          <code className="text-sm text-accent-primary truncate">{row.endpoint}</code>
        </div>
      ),
    },
    {
      key: "timestamp",
      header: t("table.timestamp"),
      mobileHidden: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatTimestamp(row.timestamp)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("table.status"),
      cell: (row) => (
        <Badge variant={getStatusVariant(row.statusCode)}>
          {row.statusCode}
        </Badge>
      ),
    },
    {
      key: "duration",
      header: t("table.duration"),
      cell: (row) => <span className="text-muted-foreground tabular-nums">{row.duration}ms</span>,
    },
    {
      key: "apiKey",
      header: t("table.apiKey"),
      mobileHidden: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.apiKeyName}</span>
      ),
    },
  ];

  if (loading) {
    return (
      <PageShell title={t("title")} description={t("description")}>
        <LoadingTable rows={10} cols={6} />
      </PageShell>
    );
  }

  return (
    <PageShell title={t("title")} description={t("description")}>
      <FiltersBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("filters.searchPlaceholder")}
        filters={[
          {
            key: "status",
            label: t("filters.status"),
            options: [
              { label: t("filters.status2xx"), value: "2" },
              { label: t("filters.status4xx"), value: "4" },
              { label: t("filters.status5xx"), value: "5" },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
          {
            key: "apiKey",
            label: t("table.apiKey"),
            options: uniqueKeys,
            value: keyFilter,
            onChange: setKeyFilter,
          },
        ]}
        onReset={() => {
          setSearch("");
          setStatusFilter("");
          setKeyFilter("");
        }}
      />

      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t("empty.title")}
          description={t("empty.description")}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredLogs}
          onRowClick={(row) => {
            setSelectedLog(row);
            setDrawerOpen(true);
          }}
        />
      )}

      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={t("details.title")}
        description={selectedLog ? formatTimestamp(selectedLog.timestamp) : ""}
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant={getMethodVariant(selectedLog.method)}>
                {selectedLog.method}
              </Badge>
              <Badge variant={getStatusVariant(selectedLog.statusCode)}>
                {selectedLog.statusCode}
              </Badge>
              <span className="text-sm text-muted-foreground tabular-nums">
                {selectedLog.duration}ms
              </span>
            </div>

            <div>
              <Label className="text-muted-foreground">{t("table.endpoint")}</Label>
              <code className="block mt-2 p-3 bg-muted/50 rounded-lg text-sm text-accent-primary border border-border">
                {selectedLog.endpoint}
              </code>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">{t("table.apiKey")}</Label>
                <div className="mt-1 font-medium text-foreground">{selectedLog.apiKeyName}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">{t("table.ip")}</Label>
                <div className="mt-1 font-mono text-sm text-muted-foreground">{selectedLog.ip}</div>
              </div>
            </div>

            <Separator className="bg-accent" />

            {selectedLog.requestBody && (
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  {t("table.requestBody")}
                </Label>
                <pre className="mt-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground overflow-auto max-h-48 border border-border">
                  {JSON.stringify(selectedLog.requestBody, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.responseBody && (
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t("table.responseBody")}
                </Label>
                <pre className="mt-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground overflow-auto max-h-48 border border-border">
                  {JSON.stringify(selectedLog.responseBody, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <Label className="text-muted-foreground">{t("table.userAgent")}</Label>
              <div className="mt-1 text-sm text-muted-foreground break-all">
                {selectedLog.userAgent}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </PageShell>
  );
}
