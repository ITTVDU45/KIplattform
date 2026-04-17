"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { PageShell } from "@/components/layout/page-shell";
import { DataTable, type Column } from "@/components/common/data-table";
import { FiltersBar } from "@/components/common/filters-bar";
import { LoadingTable } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DetailDrawer } from "@/components/common/detail-drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HardDrive,
  Upload,
  Download,
  Trash2,
  Eye,
  MoreHorizontal,
  File,
  FileText,
  FileImage,
  FileAudio,
  FileJson,
} from "lucide-react";
import { toast } from "sonner";
import * as api from "@/lib/mock/api";
import type { StorageFile } from "@/types/domain";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return FileImage;
  if (type.startsWith("audio/")) return FileAudio;
  if (type.includes("json")) return FileJson;
  if (type.includes("text") || type.includes("csv")) return FileText;
  return File;
}

export default function StoragePage() {
  const t = useTranslations("storage");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getStorageFiles();
        setFiles(res.data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredFiles = useMemo(() => {
    return files.filter((file) =>
      file.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [files, search]);

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const maxSize = 100 * 1024 * 1024; // 100 MB
  const usagePercent = (totalSize / maxSize) * 100;

  async function handleUpload() {
    setUploading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setUploading(false);
    setUploadOpen(false);
    toast.success(t("upload.success"));
  }

  async function handleDelete() {
    if (!selectedFile) return;
    setDeleting(true);
    try {
      await api.deleteStorageFile(selectedFile.id);
      setFiles((prev) => prev.filter((f) => f.id !== selectedFile.id));
      setDeleteOpen(false);
      setSelectedFile(null);
      toast.success(t("delete.success"));
    } catch {
      toast.error(t("delete.error"));
    } finally {
      setDeleting(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const columns: Column<StorageFile>[] = [
    {
      key: "name",
      header: t("table.name"),
      cell: (row) => {
        const Icon = getFileIcon(row.type);
        return (
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-foreground">{row.name}</span>
          </div>
        );
      },
    },
    {
      key: "size",
      header: t("table.size"),
      cell: (row) => <span className="text-muted-foreground tabular-nums">{formatFileSize(row.size)}</span>,
    },
    {
      key: "type",
      header: t("table.type"),
      cell: (row) => (
        <Badge variant="outline">{row.type.split("/")[1] || row.type}</Badge>
      ),
    },
    {
      key: "uploadedAt",
      header: t("table.uploadedAt"),
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.uploadedAt)}</span>,
    },
    {
      key: "uploadedBy",
      header: t("table.uploadedBy"),
      cell: (row) => <span className="text-muted-foreground">{row.uploadedBy}</span>,
    },
    {
      key: "actions",
      header: "",
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
                setSelectedFile(row);
                setDrawerOpen(true);
              }}
              className="focus:bg-accent"
            >
              <Eye className="h-4 w-4 mr-2" />
              {tCommon("actions.preview")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                toast.success(t("preview.downloadStarted"));
              }}
              className="focus:bg-accent"
            >
              <Download className="h-4 w-4 mr-2" />
              {tCommon("actions.download")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-accent-danger focus:bg-accent-danger/10 focus:text-accent-danger"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(row);
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {tCommon("actions.delete")}
            </DropdownMenuItem>
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
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          {t("uploadButton")}
        </Button>
      }
    >
      {/* Storage Usage */}
      <div className="p-4 border border-border rounded-xl bg-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">{t("usage.title")}</span>
          <span className="text-sm text-muted-foreground">
            {formatFileSize(totalSize)} / {formatFileSize(maxSize)}
          </span>
        </div>
        <Progress value={usagePercent} className="h-2" />
      </div>

      <FiltersBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchPlaceholder")}
        onReset={() => setSearch("")}
      />

      {filteredFiles.length === 0 ? (
        <EmptyState
          icon={HardDrive}
          title={t("empty.title")}
          description={
            search
              ? t("empty.descriptionFiltered")
              : t("empty.description")
          }
          action={
            !search
              ? { label: t("uploadButton"), onClick: () => setUploadOpen(true) }
              : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredFiles}
          onRowClick={(row) => {
            setSelectedFile(row);
            setDrawerOpen(true);
          }}
        />
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("upload.title")}</DialogTitle>
            <DialogDescription>
              {t("upload.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border-2 border-dashed border-white/[0.12] rounded-xl p-8 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                {t("upload.dragDrop")}
              </p>
              <Input type="file" className="max-w-xs mx-auto" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              {tCommon("actions.cancel")}
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? t("upload.uploading") : tCommon("actions.upload")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("delete.title")}
        description={t("delete.description", { name: selectedFile?.name || "" })}
        confirmLabel={tCommon("actions.delete")}
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleting}
      />

      {/* Preview Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selectedFile?.name || t("preview.title")}
        description={t("preview.description")}
      >
        {selectedFile && (
          <div className="space-y-6">
            <div className="flex items-center justify-center p-8 bg-muted/50 rounded-xl border border-border">
              {(() => {
                const Icon = getFileIcon(selectedFile.type);
                return <Icon className="h-16 w-16 text-muted-foreground" />;
              })()}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">{t("preview.size")}</Label>
                <div className="mt-1 font-medium text-foreground">
                  {formatFileSize(selectedFile.size)}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">{t("preview.type")}</Label>
                <div className="mt-1">
                  <Badge variant="outline">{selectedFile.type}</Badge>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">{t("preview.uploadedBy")}</Label>
              <div className="mt-1 text-foreground">{selectedFile.uploadedBy}</div>
            </div>

            <div>
              <Label className="text-muted-foreground">{t("preview.uploadedAt")}</Label>
              <div className="mt-1 text-foreground">{formatDate(selectedFile.uploadedAt)}</div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => toast.success(t("preview.downloadStarted"))}
              >
                <Download className="h-4 w-4 mr-2" />
                {tCommon("actions.download")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setDrawerOpen(false);
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DetailDrawer>
    </PageShell>
  );
}
