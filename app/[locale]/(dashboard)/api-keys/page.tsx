"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageShell } from "@/components/layout/page-shell";
import { DataTable, type Column } from "@/components/common/data-table";
import { FiltersBar } from "@/components/common/filters-bar";
import { LoadingTable } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DetailDrawer } from "@/components/common/detail-drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Key, Copy, Eye, EyeOff, MoreHorizontal, Ban } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import * as api from "@/lib/mock/api";
import type { ApiKey } from "@/types/domain";

export default function ApiKeysPage() {
  const t = useTranslations("apiKeys");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Create form
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(["read"]);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  
  // Key visibility
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadApiKeys();
  }, []);

  async function loadApiKeys() {
    try {
      const res = await api.getApiKeys();
      setApiKeys(res.data);
    } finally {
      setLoading(false);
    }
  }

  const filteredKeys = useMemo(() => {
    return apiKeys.filter((key) => {
      const matchesSearch = key.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || statusFilter === "all" || key.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [apiKeys, search, statusFilter]);

  async function handleCreateKey() {
    if (!newKeyName.trim()) {
      toast.error("Bitte geben Sie einen Namen ein");
      return;
    }
    setCreating(true);
    try {
      const res = await api.createApiKey({
        name: newKeyName,
        permissions: newKeyPermissions,
      });
      setApiKeys((prev) => [...prev, res.data]);
      setCreateOpen(false);
      setNewKeyName("");
      setNewKeyPermissions(["read"]);
      toast.success(t("messages.created"));
    } catch {
      toast.error(t("messages.createError"));
    } finally {
      setCreating(false);
    }
  }

  async function handleRevokeKey() {
    if (!selectedKey) return;
    setRevoking(true);
    try {
      await api.revokeApiKey(selectedKey.id);
      setApiKeys((prev) =>
        prev.map((k) => (k.id === selectedKey.id ? { ...k, status: "revoked" as const } : k))
      );
      setRevokeOpen(false);
      setSelectedKey(null);
      toast.success(t("messages.revoked"));
    } catch {
      toast.error(t("messages.revokeError"));
    } finally {
      setRevoking(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success(t("messages.copied"));
  }

  function toggleKeyVisibility(keyId: string) {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) {
        next.delete(keyId);
      } else {
        next.add(keyId);
      }
      return next;
    });
  }

  function maskKey(key: string) {
    return key.substring(0, 10) + "..." + key.substring(key.length - 4);
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "active": return tCommon("status.active");
      case "inactive": return tCommon("status.inactive");
      case "revoked": return tCommon("status.revoked");
      default: return status;
    }
  }

  const columns: Column<ApiKey>[] = [
    {
      key: "name",
      header: t("table.name"),
      cell: (row) => (
        <div className="font-medium text-foreground">{row.name}</div>
      ),
    },
    {
      key: "key",
      header: t("table.key"),
      mobileHidden: true,
      cell: (row) => (
        <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
          <span>{visibleKeys.has(row.id) ? row.key : maskKey(row.key)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              toggleKeyVisibility(row.id);
            }}
          >
            {visibleKeys.has(row.id) ? (
              <EyeOff className="h-3 w-3" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(row.key);
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      key: "status",
      header: t("table.status"),
      cell: (row) => (
        <Badge
          variant={
            row.status === "active"
              ? "success"
              : row.status === "inactive"
              ? "secondary"
              : "destructive"
          }
        >
          {getStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: "requests",
      header: t("table.requests"),
      mobileLabel: "Requests",
      cell: (row) => (
        <span className="text-muted-foreground tabular-nums">
          {row.requestCount.toLocaleString("de-DE")}
        </span>
      ),
    },
    {
      key: "lastUsed",
      header: t("table.lastUsed"),
      mobileHidden: true,
      cell: (row) => (
        <span className="text-muted-foreground">{formatDate(row.lastUsedAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      mobileHidden: true,
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-glass-border">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setSelectedKey(row);
                setDrawerOpen(true);
              }}
              className="focus:bg-accent"
            >
              <Eye className="h-4 w-4 mr-2" />
              {t("actions.showDetails")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(row.key);
              }}
              className="focus:bg-accent"
            >
              <Copy className="h-4 w-4 mr-2" />
              {t("actions.copyKey")}
            </DropdownMenuItem>
            {row.status === "active" && (
              <DropdownMenuItem
                className="text-accent-danger focus:bg-accent-danger/10 focus:text-accent-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedKey(row);
                  setRevokeOpen(true);
                }}
              >
                <Ban className="h-4 w-4 mr-2" />
                {t("actions.revoke")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-12",
    },
  ];

  if (loading) {
    return (
      <PageShell title={t("title")} description={t("description")}>
        <LoadingTable rows={5} cols={5} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={t("title")}
      description={t("description")}
      actions={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("newKey")}
        </Button>
      }
    >
      <FiltersBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={tCommon("actions.search") + "..."}
        filters={[
          {
            key: "status",
            label: t("table.status"),
            options: [
              { label: tCommon("status.active"), value: "active" },
              { label: tCommon("status.inactive"), value: "inactive" },
              { label: tCommon("status.revoked"), value: "revoked" },
            ],
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
        onReset={() => {
          setSearch("");
          setStatusFilter("");
        }}
      />

      {filteredKeys.length === 0 ? (
        <EmptyState
          icon={Key}
          title={t("empty.title")}
          description={
            search || statusFilter
              ? t("empty.descriptionFiltered")
              : t("empty.description")
          }
          action={
            !search && !statusFilter
              ? { label: t("empty.action"), onClick: () => setCreateOpen(true) }
              : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredKeys}
          onRowClick={(row) => {
            setSelectedKey(row);
            setDrawerOpen(true);
          }}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createTitle")}</DialogTitle>
            <DialogDescription>
              {t("createDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-muted-foreground">{t("form.name")}</Label>
              <Input
                id="name"
                placeholder={t("form.namePlaceholder")}
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="bg-card-2/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t("form.permissions")}</Label>
              <div className="flex flex-wrap gap-2">
                {["read", "write", "delete"].map((perm) => (
                  <Button
                    key={perm}
                    type="button"
                    variant={newKeyPermissions.includes(perm) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setNewKeyPermissions((prev) =>
                        prev.includes(perm)
                          ? prev.filter((p) => p !== perm)
                          : [...prev, perm]
                      );
                    }}
                  >
                    {perm}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {tCommon("actions.cancel")}
            </Button>
            <Button onClick={handleCreateKey} disabled={creating}>
              {creating ? tCommon("states.loading") : tCommon("actions.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirm Dialog */}
      <ConfirmDialog
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        title={t("actions.revokeTitle")}
        description={t("actions.revokeDescription", { name: selectedKey?.name || "" })}
        confirmLabel={t("actions.revoke")}
        onConfirm={handleRevokeKey}
        variant="destructive"
        loading={revoking}
      />

      {/* Detail Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selectedKey?.name || t("details.title")}
        description={t("details.description")}
      >
        {selectedKey && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t("table.key")}</Label>
              <div className="flex items-center gap-2 p-3 bg-card-2/50 rounded-lg font-mono text-sm border border-border">
                <span className="flex-1 break-all text-muted-foreground">
                  {visibleKeys.has(selectedKey.id) ? selectedKey.key : maskKey(selectedKey.key)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => toggleKeyVisibility(selectedKey.id)}
                >
                  {visibleKeys.has(selectedKey.id) ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => copyToClipboard(selectedKey.key)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">{t("table.status")}</Label>
                <div className="mt-2">
                  <Badge
                    variant={
                      selectedKey.status === "active"
                        ? "success"
                        : selectedKey.status === "inactive"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {getStatusLabel(selectedKey.status)}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">{t("table.requests")}</Label>
                <div className="mt-2 font-semibold text-foreground tabular-nums">
                  {selectedKey.requestCount.toLocaleString("de-DE")}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">{t("table.permissions")}</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedKey.permissions.map((perm) => (
                  <Badge key={perm} variant="outline">
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">{t("table.createdAt")}</Label>
                <div className="mt-1 text-muted-foreground">{formatDate(selectedKey.createdAt)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">{t("table.lastUsed")}</Label>
                <div className="mt-1 text-muted-foreground">{formatDate(selectedKey.lastUsedAt)}</div>
              </div>
            </div>

            {selectedKey.expiresAt && (
              <div>
                <Label className="text-muted-foreground">{t("table.expiresAt")}</Label>
                <div className="mt-1 text-muted-foreground">{formatDate(selectedKey.expiresAt)}</div>
              </div>
            )}

            {selectedKey.status === "active" && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  setDrawerOpen(false);
                  setRevokeOpen(true);
                }}
              >
                <Ban className="h-4 w-4 mr-2" />
                {t("actions.revoke")}
              </Button>
            )}
          </div>
        )}
      </DetailDrawer>
    </PageShell>
  );
}
