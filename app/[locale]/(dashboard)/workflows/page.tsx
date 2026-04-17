"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { PageShell } from "@/components/layout/page-shell";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Settings,
  Zap,
  Box,
  GitBranch,
  Bot,
  Save,
  TestTube,
} from "lucide-react";
import { toast } from "sonner";
import * as api from "@/lib/mock/api";
import type { Workflow as WorkflowType, WorkflowNode } from "@/types/domain";

function getNodeIcon(type: WorkflowNode["type"]) {
  switch (type) {
    case "trigger": return Zap;
    case "action": return Box;
    case "condition": return GitBranch;
    case "ai": return Bot;
    default: return Box;
  }
}

export default function WorkflowsPage() {
  const t = useTranslations("workflows");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);

  const nodeTypes = [
    { type: "trigger", name: t("nodeTypes.trigger"), icon: Zap, desc: t("nodeTypes.triggerDesc") },
    { type: "action", name: t("nodeTypes.action"), icon: Box, desc: t("nodeTypes.actionDesc") },
    { type: "condition", name: t("nodeTypes.condition"), icon: GitBranch, desc: t("nodeTypes.conditionDesc") },
    { type: "ai", name: t("nodeTypes.ai"), icon: Bot, desc: t("nodeTypes.aiDesc") },
  ];

  // Helper to get translated workflow name
  const getWorkflowName = useCallback((workflow: WorkflowType) => {
    if (workflow.nameKey) {
      try {
        return t(`workflowNames.${workflow.nameKey}`);
      } catch {
        return workflow.name;
      }
    }
    return workflow.name;
  }, [t]);

  // Helper to get translated node name
  const getNodeName = useCallback((node: WorkflowNode) => {
    if (node.nameKey) {
      try {
        return t(`nodeNames.${node.nameKey}`);
      } catch {
        return node.name;
      }
    }
    return node.name;
  }, [t]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getWorkflows();
        setWorkflows(res.data);
        if (res.data.length > 0) {
          setSelectedWorkflow(res.data[0]);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleToggleWorkflow(id: string) {
    try {
      await api.toggleWorkflow(id);
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, status: w.status === "active" ? "inactive" : "active" }
            : w
        )
      );
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow((prev) =>
          prev
            ? { ...prev, status: prev.status === "active" ? "inactive" : "active" }
            : null
        );
      }
      toast.success(tCommon("status.success"));
    } catch {
      toast.error(tCommon("states.error"));
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <Button onClick={() => toast.info("Coming soon...")}>
          <Plus className="h-4 w-4 mr-2" />
          {t("createButton")}
        </Button>
      }
    >
      {workflows.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title={t("empty.title")}
          description={t("empty.description")}
          action={{ label: t("createButton"), onClick: () => {} }}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {/* Workflow List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">{t("title")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-1 p-2">
                  {workflows.map((workflow) => (
                    <button
                      key={workflow.id}
                      onClick={() => {
                        setSelectedWorkflow(workflow);
                        setSelectedNode(null);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedWorkflow?.id === workflow.id
                          ? "bg-primary/20 text-primary"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="font-medium truncate">{getWorkflowName(workflow)}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            workflow.status === "active"
                              ? "success"
                              : workflow.status === "draft"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {workflow.status === "active"
                            ? tCommon("status.active")
                            : workflow.status === "draft"
                            ? tCommon("status.pending")
                            : tCommon("status.inactive")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {workflow.runCount} {t("table.runs")}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Canvas */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-foreground">
                  {selectedWorkflow ? getWorkflowName(selectedWorkflow) : t("canvas.title")}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toast.info("Test...")}>
                    <TestTube className="h-4 w-4 mr-1" />
                    {t("canvas.test")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast.success(tCommon("status.success"))}>
                    <Save className="h-4 w-4 mr-1" />
                    {tCommon("actions.save")}
                  </Button>
                  {selectedWorkflow && selectedWorkflow.status !== "draft" && (
                    <Button
                      variant={selectedWorkflow.status === "active" ? "secondary" : "default"}
                      size="sm"
                      onClick={() => handleToggleWorkflow(selectedWorkflow.id)}
                    >
                      {selectedWorkflow.status === "active" ? (
                        <><Pause className="h-4 w-4 mr-1" />{t("canvas.pause")}</>
                      ) : (
                        <><Play className="h-4 w-4 mr-1" />{tCommon("status.active")}</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedWorkflow ? (
                <div className="relative bg-muted/50 rounded-xl p-4 min-h-[400px] border border-border">
                  {selectedWorkflow.nodes.map((node) => {
                    const Icon = getNodeIcon(node.type);
                    return (
                      <button
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`absolute p-3 bg-card border border-border rounded-lg shadow-sm transition-all hover:shadow-md ${
                          selectedNode?.id === node.id ? "ring-2 ring-primary" : ""
                        }`}
                        style={{ left: node.position.x, top: node.position.y - 150 }}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded ${
                            node.type === "trigger" ? "bg-accent-warning/20 text-accent-warning" :
                            node.type === "ai" ? "bg-accent-purple/20 text-accent-purple" :
                            node.type === "condition" ? "bg-primary/20 text-primary" :
                            "bg-accent-success/20 text-accent-success"
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{getNodeName(node)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  {t("empty.title")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inspector */}
          <Card className="lg:col-span-1">
            <Tabs defaultValue="library">
              <CardHeader className="pb-0">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="library">{t("inspector.nodes")}</TabsTrigger>
                  <TabsTrigger value="inspector">{t("inspector.inspector")}</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-4">
                <TabsContent value="library" className="m-0">
                  <div className="space-y-2">
                    {nodeTypes.map((nodeType) => (
                      <div key={nodeType.type} className="p-3 border border-border rounded-lg cursor-grab hover:bg-muted transition-colors">
                        <div className="flex items-center gap-2">
                          <nodeType.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm text-foreground">{nodeType.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="inspector" className="m-0">
                  {selectedNode ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">{t("inspector.name")}</Label>
                        <Input defaultValue={getNodeName(selectedNode)} className="bg-muted/50 border-border" />
                      </div>
                      <Separator className="bg-border" />
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">{t("inspector.config")}</Label>
                        <pre className="text-xs bg-muted/50 p-2 rounded-lg overflow-auto max-h-32 text-muted-foreground border border-border">
                          {JSON.stringify(selectedNode.config, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t("inspector.selectNode")}</p>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>

            {selectedWorkflow && (
              <CardContent className="border-t border-border pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("table.lastRun")}</span>
                    <span className="text-muted-foreground">{formatDate(selectedWorkflow.lastRunAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("table.runs")}</span>
                    <span className="text-muted-foreground">{selectedWorkflow.runCount}</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </PageShell>
  );
}
