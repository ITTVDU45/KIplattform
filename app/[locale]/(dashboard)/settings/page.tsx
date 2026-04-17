"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { PageShell } from "@/components/layout/page-shell";
import { DataTable, type Column } from "@/components/common/data-table";
import { FiltersBar } from "@/components/common/filters-bar";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { 
  Bell, Webhook, User, Save, Plus, Eye, EyeOff, Copy, CreditCard, 
  ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Check, Lightbulb,
  ThumbsUp, MessageSquare, Clock, CheckCircle, Gauge, ExternalLink,
  Scale, FileText, Shield, Database, Settings2, Users, Building2,
  Crown, UserPlus, MoreHorizontal, Trash2, Mail
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import * as api from "@/lib/mock/api";
import type { Webhook as WebhookType, UserProfile, Transaction, Plan, FeatureRequest } from "@/types/domain";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tLang = useTranslations("language");
  const tWishlist = useTranslations("wishlist");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  
  // Billing state
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Wishlist state
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("votes");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    category: "Features",
  });
  const [submitting, setSubmitting] = useState(false);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    usageWarnings: true,
    billingReminders: true,
    systemUpdates: false,
    marketingEmails: false,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [webhooksRes, profileRes, balanceRes, txRes, plansRes, requestsRes] = await Promise.all([
          api.getWebhooks(),
          api.getUserProfile(),
          api.getBalance(),
          api.getTransactions(),
          api.getPlans(),
          api.getFeatureRequests(),
        ]);
        setWebhooks(webhooksRes.data);
        setProfile(profileRes.data);
        setBalance(balanceRes.data);
        setTransactions(txRes.data);
        setPlans(plansRes.data);
        setRequests(requestsRes.data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleToggleWebhook(id: string) {
    try {
      await api.toggleWebhook(id);
      setWebhooks((prev) =>
        prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w))
      );
      toast.success(tCommon("status.success"));
    } catch {
      toast.error(tCommon("states.error"));
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await api.updateUserProfile(profile!);
      toast.success(tCommon("status.success"));
    } catch {
      toast.error(tCommon("states.error"));
    } finally {
      setSaving(false);
    }
  }

  function toggleSecretVisibility(id: string) {
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success(tCommon("status.success"));
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

  // Wishlist helpers
  const getCategoryLabel = useCallback((category: string) => {
    const keyMap: Record<string, string> = {
      "Features": "features",
      "API": "api",
      "UI/UX": "uiux",
      "Integration": "integration",
      "Sicherheit": "security",
      "Security": "security",
    };
    const key = keyMap[category];
    if (key) {
      try {
        return tWishlist(`categories.${key}`);
      } catch {
        return category;
      }
    }
    return category;
  }, [tWishlist]);

  const getRequestTitle = useCallback((request: FeatureRequest) => {
    if (request.titleKey) {
      try {
        return tWishlist(`requests.${request.titleKey}.title`);
      } catch {
        return request.title;
      }
    }
    return request.title;
  }, [tWishlist]);

  const getRequestDescription = useCallback((request: FeatureRequest) => {
    if (request.descriptionKey) {
      try {
        return tWishlist(`requests.${request.descriptionKey}.description`);
      } catch {
        return request.description;
      }
    }
    return request.description;
  }, [tWishlist]);

  const categories = useMemo(() => {
    const cats = new Set(requests.map((r) => r.category));
    return Array.from(cats).map((c) => ({ 
      label: getCategoryLabel(c), 
      value: c 
    }));
  }, [requests, getCategoryLabel]);

  const filteredRequests = useMemo(() => {
    let result = requests.filter((r) => {
      const title = getRequestTitle(r);
      const description = getRequestDescription(r);
      const matchesSearch =
        title.toLowerCase().includes(search.toLowerCase()) ||
        description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || categoryFilter === "all" || r.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    switch (sortBy) {
      case "votes":
        result = result.sort((a, b) => b.votes - a.votes);
        break;
      case "newest":
        result = result.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "comments":
        result = result.sort((a, b) => b.comments - a.comments);
        break;
    }

    return result;
  }, [requests, search, categoryFilter, sortBy, getRequestTitle, getRequestDescription]);

  const myRequests = requests.filter((r) => r.authorId === "user_1");

  async function handleVote(id: string) {
    try {
      await api.voteFeatureRequest(id);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, voted: !r.voted, votes: r.voted ? r.votes - 1 : r.votes + 1 }
            : r
        )
      );
    } catch {
      toast.error(tWishlist("messages.voteError"));
    }
  }

  async function handleSubmitRequest() {
    if (!newRequest.title || !newRequest.description) {
      toast.error(tWishlist("messages.fillAll"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.createFeatureRequest(newRequest);
      setRequests((prev) => [res.data, ...prev]);
      setSubmitOpen(false);
      setNewRequest({ title: "", description: "", category: "Features" });
      toast.success(tWishlist("messages.success"));
    } catch {
      toast.error(tWishlist("messages.error"));
    } finally {
      setSubmitting(false);
    }
  }

  function formatRequestDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function getStatusVariant(status: FeatureRequest["status"]) {
    switch (status) {
      case "planned":
        return "default";
      case "in_progress":
        return "warning";
      case "completed":
        return "success";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  }

  function getStatusLabel(status: FeatureRequest["status"]) {
    switch (status) {
      case "pending":
        return tWishlist("status.pending");
      case "planned":
        return tWishlist("status.planned");
      case "in_progress":
        return tWishlist("status.inProgress");
      case "completed":
        return tWishlist("status.completed");
      case "rejected":
        return tWishlist("status.rejected");
      default:
        return status;
    }
  }

  function RequestCard({ request }: { request: FeatureRequest }) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1">
              <Button
                variant={request.voted ? "default" : "outline"}
                size="sm"
                className="h-12 w-12 flex-col p-0"
                onClick={() => handleVote(request.id)}
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="text-xs">{request.votes}</span>
              </Button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{getRequestTitle(request)}</h3>
                <Badge variant={getStatusVariant(request.status)}>
                  {getStatusLabel(request.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {getRequestDescription(request)}
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                <Badge variant="outline">{getCategoryLabel(request.category)}</Badge>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {request.comments}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRequestDate(request.createdAt)}
                </span>
                <span>{tWishlist("by")} {request.authorName}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const webhookColumns: Column<WebhookType>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => <span className="font-medium text-foreground">{row.name}</span>,
    },
    {
      key: "url",
      header: "URL",
      cell: (row) => (
        <code className="text-xs bg-muted/50 px-2 py-1 rounded truncate max-w-[200px] block text-muted-foreground border border-border">
          {row.url}
        </code>
      ),
    },
    {
      key: "events",
      header: "Events",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.events.slice(0, 2).map((e) => (
            <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
          ))}
          {row.events.length > 2 && (
            <Badge variant="outline" className="text-xs">+{row.events.length - 2}</Badge>
          )}
        </div>
      ),
    },
    {
      key: "active",
      header: "Status",
      cell: (row) => (
        <Switch checked={row.active} onCheckedChange={() => handleToggleWebhook(row.id)} />
      ),
    },
    {
      key: "lastTriggered",
      header: "Last triggered",
      cell: (row) => <span className="text-muted-foreground text-sm">{formatDate(row.lastTriggeredAt)}</span>,
    },
  ];

  if (loading) {
    return (
      <PageShell title={t("title")} description={t("description")}>
        <LoadingState rows={6} />
      </PageShell>
    );
  }

  return (
    <PageShell title={t("title")} description={t("description")}>
      <Tabs defaultValue="notifications">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">{t("notifications.title")}</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="limits" className="gap-2">
            <Gauge className="h-4 w-4" />
            <span className="hidden sm:inline">{t("limits.title")}</span>
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">{tWishlist("title")}</span>
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="h-4 w-4" />
            <span className="hidden sm:inline">Webhooks</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t("preferences.title")}</span>
          </TabsTrigger>
          <TabsTrigger value="legal" className="gap-2">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">{t("legal.title")}</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t("members.title")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">{t("notifications.email")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "emailAlerts", label: t("notifications.security") },
                { key: "usageWarnings", label: t("notifications.usage") },
                { key: "billingReminders", label: "Billing" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="font-medium text-foreground">{item.label}</div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6 space-y-6">
          {/* Balance Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  Aktuelles Guthaben
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground tabular-nums">
                  {balance.toLocaleString(locale === "de" ? "de-DE" : "en-US", { minimumFractionDigits: 2 })} €
                </div>
                <Progress value={75} className="mt-4 h-1.5" />
                <p className="text-xs text-muted-foreground mt-3">
                  Reicht für ca. 15 Tage
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Monatliche Nutzung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground tabular-nums">
                  {transactions.filter(tx => tx.type === "usage").reduce((sum, tx) => sum + Math.abs(tx.amount), 0).toFixed(2)} €
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  Tagesverbrauch Ø
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground tabular-nums">
                  {(transactions.filter(tx => tx.type === "usage").reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / 22).toFixed(2)} €
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plans */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Tarife</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className={plan.popular ? "border-primary/50" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-foreground">{plan.name}</CardTitle>
                      {plan.popular && <Badge>Aktuell</Badge>}
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-foreground">{plan.price} €</span>
                      <span className="text-muted-foreground">/Monat</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full mt-4"
                      onClick={() => toast.info("Tarifwechsel wird bearbeitet...")}
                    >
                      {plan.popular ? "Aktueller Plan" : "Auswählen"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Letzte Transaktionen</h3>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        {tx.type === "topup" ? (
                          <ArrowUpRight className="h-4 w-4 text-primary" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-medium text-foreground">{tx.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString(locale === "de" ? "de-DE" : "en-US")}
                          </div>
                        </div>
                      </div>
                      <div className={`font-medium tabular-nums ${tx.amount >= 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(2)} €
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="limits" className="mt-6 space-y-6">
          {/* Rate Limits Header */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-foreground">{t("limits.title")}</CardTitle>
                  <Badge variant="outline" className="text-xs">{t("limits.freeTier")}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("limits.description")}
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info(t("limits.monitorInfo"))}>
                <ExternalLink className="h-4 w-4" />
                {t("limits.monitor")}
              </Button>
            </CardHeader>
          </Card>

          {/* Model Limits Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-foreground">{t("limits.modelLimits")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t("limits.model")}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">{t("limits.requestsPerMinute")}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">{t("limits.inputTokensPerMinute")}</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">{t("limits.outputTokensPerMinute")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { model: "GPT-4 Turbo", requests: 5, inputTokens: "10K", inputNote: "< 200k context", outputTokens: "4K", outputNote: "< 200k context" },
                      { model: "GPT-4", requests: 5, inputTokens: "10K", inputNote: "< 200k context", outputTokens: "4K", outputNote: "< 200k context" },
                      { model: "GPT-3.5 Turbo", requests: 10, inputTokens: "25K", inputNote: "< 200k context", outputTokens: "5K", outputNote: "< 200k context" },
                      { model: "Claude 3 Opus", requests: 5, inputTokens: "10K", inputNote: "< 200k context", outputTokens: "4K", outputNote: "< 200k context" },
                      { model: "Claude 3 Sonnet", requests: 5, inputTokens: "10K", inputNote: "< 200k context", outputTokens: "4K", outputNote: "< 200k context" },
                      { model: "Gemini Pro", requests: 10, inputTokens: "15K", inputNote: "< 200k context", outputTokens: "5K", outputNote: "< 200k context" },
                    ].map((limit, idx) => (
                      <tr key={idx} className="border-b border-border/50 last:border-0">
                        <td className="py-4 px-4">
                          <span className="font-medium text-foreground">{limit.model}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-semibold text-foreground">{limit.requests}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div>
                            <span className="font-semibold text-foreground">{limit.inputTokens}</span>
                            <div className="text-xs text-muted-foreground">{limit.inputNote}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div>
                            <span className="font-semibold text-foreground">{limit.outputTokens}</span>
                            <div className="text-xs text-muted-foreground">{limit.outputNote}</div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Additional Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-foreground">{t("limits.additionalLimits")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="flex items-center justify-between py-4 border-b border-border/50">
                <div>
                  <div className="font-medium text-foreground">{t("limits.batchRequests")}</div>
                  <div className="text-sm text-muted-foreground">{t("limits.batchRequestsDesc")}</div>
                </div>
                <span className="font-semibold text-foreground">5</span>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-border/50">
                <div>
                  <div className="font-medium text-foreground">{t("limits.webSearch")}</div>
                  <div className="text-sm text-muted-foreground">{t("limits.webSearchDesc")}</div>
                </div>
                <span className="font-semibold text-foreground">30</span>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-border/50">
                <div>
                  <div className="font-medium text-foreground">{t("limits.fileUploads")}</div>
                  <div className="text-sm text-muted-foreground">{t("limits.fileUploadsDesc")}</div>
                </div>
                <span className="font-semibold text-foreground">100 MB</span>
              </div>
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="font-medium text-foreground">{t("limits.concurrentRequests")}</div>
                  <div className="text-sm text-muted-foreground">{t("limits.concurrentRequestsDesc")}</div>
                </div>
                <span className="font-semibold text-foreground">10</span>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade CTA */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">{t("limits.upgradeTitle")}</h3>
                  <p className="text-sm text-muted-foreground">{t("limits.upgradeDesc")}</p>
                </div>
                <Button onClick={() => toast.info(t("limits.upgradeInfo"))}>
                  {t("limits.upgradeCta")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wishlist" className="mt-6 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{requests.length}</div>
                    <div className="text-sm text-muted-foreground">{tWishlist("stats.total")}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-warning/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-accent-warning" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {requests.filter((r) => r.status === "planned").length}
                    </div>
                    <div className="text-sm text-muted-foreground">{tWishlist("stats.planned")}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-purple/10 rounded-lg">
                    <Clock className="h-5 w-5 text-accent-purple" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {requests.filter((r) => r.status === "in_progress").length}
                    </div>
                    <div className="text-sm text-muted-foreground">{tWishlist("stats.inProgress")}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-success/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-accent-success" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {requests.filter((r) => r.status === "completed").length}
                    </div>
                    <div className="text-sm text-muted-foreground">{tWishlist("stats.completed")}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <FiltersBar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder={tWishlist("filters.searchPlaceholder")}
              filters={[
                {
                  key: "category",
                  label: tWishlist("filters.category"),
                  options: categories,
                  value: categoryFilter,
                  onChange: setCategoryFilter,
                },
              ]}
              onReset={() => {
                setSearch("");
                setCategoryFilter("");
              }}
              actions={
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="votes">{tWishlist("sort.votes")}</SelectItem>
                    <SelectItem value="newest">{tWishlist("sort.newest")}</SelectItem>
                    <SelectItem value="comments">{tWishlist("sort.comments")}</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
            <Button onClick={() => setSubmitOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {tWishlist("addButton")}
            </Button>
          </div>

          {/* Requests */}
          {filteredRequests.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title={tWishlist("empty.title")}
              description={tWishlist("empty.description")}
            />
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}

          {/* My Requests Section */}
          {myRequests.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">{tWishlist("tabs.mine")}</h3>
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="webhooks" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => toast.info("Coming soon...")}>
              <Plus className="h-4 w-4 mr-2" />
              {tCommon("actions.add")} Webhook
            </Button>
          </div>

          <DataTable columns={webhookColumns} data={webhooks} />

          {webhooks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-foreground">Webhook Secrets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {webhooks.map((wh) => (
                    <div key={wh.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                      <div>
                        <div className="font-medium text-sm text-foreground">{wh.name}</div>
                        <code className="text-xs text-muted-foreground">
                          {visibleSecrets.has(wh.id) ? wh.secret : "••••••••••••"}
                        </code>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleSecretVisibility(wh.id)}>
                          {visibleSecrets.has(wh.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(wh.secret)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-6 space-y-6">
          {profile && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Name</Label>
                      <Input
                        value={profile.name}
                        onChange={(e) => setProfile((p) => p && { ...p, name: e.target.value })}
                        className="bg-muted/50 border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">E-Mail</Label>
                      <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile((p) => p && { ...p, email: e.target.value })}
                        className="bg-muted/50 border-border"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">{t("preferences.language")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">{t("preferences.language")}</Label>
                      <Select value={profile.language} onValueChange={(v) => setProfile((p) => p && { ...p, language: v })}>
                        <SelectTrigger className="bg-muted/50 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card/95 backdrop-blur-xl border-glass-border">
                          <SelectItem value="de">{tLang("de")}</SelectItem>
                          <SelectItem value="en">{tLang("en")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">{t("preferences.timezone")}</Label>
                      <Select value={profile.timezone} onValueChange={(v) => setProfile((p) => p && { ...p, timezone: v })}>
                        <SelectTrigger className="bg-muted/50 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card/95 backdrop-blur-xl border-glass-border">
                          <SelectItem value="Europe/Berlin">Berlin (UTC+1)</SelectItem>
                          <SelectItem value="Europe/London">London (UTC+0)</SelectItem>
                          <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? tCommon("states.loading") : tCommon("actions.save")}
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="legal" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">{t("legal.title")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("legal.description")}</p>
            </CardHeader>
            <CardContent className="space-y-0">
              {[
                { 
                  icon: FileText, 
                  title: t("legal.commercialTerms"), 
                  desc: t("legal.commercialTermsDesc"),
                  href: "/legal/terms" 
                },
                { 
                  icon: Shield, 
                  title: t("legal.usagePolicy"), 
                  desc: t("legal.usagePolicyDesc"),
                  href: "/legal/usage" 
                },
                { 
                  icon: Shield, 
                  title: t("legal.privacyPolicy"), 
                  desc: t("legal.privacyPolicyDesc"),
                  href: "/legal/privacy" 
                },
                { 
                  icon: Database, 
                  title: t("legal.dataRetention"), 
                  desc: t("legal.dataRetentionDesc"),
                  href: "/legal/data-retention" 
                },
                { 
                  icon: Settings2, 
                  title: t("legal.privacyChoices"), 
                  desc: t("legal.privacyChoicesDesc"),
                  href: "/legal/privacy-choices" 
                },
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between py-4 border-b border-border/50 last:border-0 group cursor-pointer hover:bg-muted/30 -mx-6 px-6 transition-colors"
                  onClick={() => window.open(item.href, "_blank")}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Data Export & Deletion */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">{t("legal.dataManagement")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("legal.dataManagementDesc")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <div className="font-medium text-foreground">{t("legal.downloadData")}</div>
                  <div className="text-sm text-muted-foreground">{t("legal.downloadDataDesc")}</div>
                </div>
                <Button variant="outline" onClick={() => toast.info(t("legal.downloadStarted"))}>
                  {t("legal.download")}
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <div className="font-medium text-foreground">{t("legal.requestDeletion")}</div>
                  <div className="text-sm text-muted-foreground">{t("legal.requestDeletionDesc")}</div>
                </div>
                <Button variant="outline" onClick={() => toast.info(t("legal.deletionRequested"))}>
                  {t("legal.requestButton")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">{t("legal.contact")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{t("legal.contactDesc")}</p>
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">E-Mail:</span> <span className="text-foreground">legal@curser.ai</span></div>
                <div><span className="text-muted-foreground">{t("legal.address")}:</span> <span className="text-foreground">Curser GmbH, Musterstraße 123, 10115 Berlin</span></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-6 space-y-6">
          {/* Organization Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">{t("members.organization")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("members.orgName")}</Label>
                  <Input
                    value="Tolgahan's Organization"
                    className="bg-muted/50 border-border"
                    onChange={() => {}}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("members.orgId")}</Label>
                  <div className="flex gap-2">
                    <Input
                      value="f20ca876-eb75-43d9-8a32-60b44cc17076"
                      className="bg-muted/50 border-border font-mono text-sm"
                      readOnly
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText("f20ca876-eb75-43d9-8a32-60b44cc17076");
                        toast.success(tCommon("status.success"));
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => toast.success(t("members.saved"))}>
                  <Save className="h-4 w-4 mr-2" />
                  {tCommon("actions.save")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Members List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground">{t("members.title")}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{t("members.description")}</p>
              </div>
              <Button onClick={() => toast.info(t("members.inviteSent"))}>
                <UserPlus className="h-4 w-4 mr-2" />
                {t("members.invite")}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {[
                  { name: "Max Mustermann", email: "max@example.com", role: "owner", status: "active" },
                  { name: "Anna Schmidt", email: "anna@example.com", role: "admin", status: "active" },
                  { name: "Tom Weber", email: "tom@example.com", role: "member", status: "active" },
                  { name: "Lisa Müller", email: "lisa@example.com", role: "member", status: "pending" },
                ].map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{member.name}</span>
                          {member.role === "owner" && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                          {member.status === "pending" && (
                            <Badge variant="outline" className="text-xs">{t("members.pending")}</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select defaultValue={member.role} disabled={member.role === "owner"}>
                        <SelectTrigger className="w-[120px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">{t("members.roles.owner")}</SelectItem>
                          <SelectItem value="admin">{t("members.roles.admin")}</SelectItem>
                          <SelectItem value="member">{t("members.roles.member")}</SelectItem>
                          <SelectItem value="viewer">{t("members.roles.viewer")}</SelectItem>
                        </SelectContent>
                      </Select>
                      {member.role !== "owner" && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          onClick={() => toast.info(t("members.removed"))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">{t("members.pendingInvites")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {[
                  { email: "new.member@example.com", role: "member", sentAt: "2025-01-22T10:00:00Z" },
                  { email: "developer@company.com", role: "admin", sentAt: "2025-01-21T14:30:00Z" },
                ].map((invite, idx) => (
                  <div key={idx} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{invite.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {t("members.sentOn")} {new Date(invite.sentAt).toLocaleDateString(locale === "de" ? "de-DE" : "en-US")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{t(`members.roles.${invite.role}`)}</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toast.info(t("members.inviteResent"))}
                      >
                        {t("members.resend")}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        onClick={() => toast.info(t("members.inviteCancelled"))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Feature Request Dialog */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tWishlist("dialog.title")}</DialogTitle>
            <DialogDescription>
              {tWishlist("dialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">{tWishlist("dialog.titleLabel")}</Label>
              <Input
                id="title"
                placeholder={tWishlist("dialog.titlePlaceholder")}
                value={newRequest.title}
                onChange={(e) =>
                  setNewRequest((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{tWishlist("dialog.category")}</Label>
              <Select
                value={newRequest.category}
                onValueChange={(v) =>
                  setNewRequest((prev) => ({ ...prev, category: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Features">{tWishlist("categories.features")}</SelectItem>
                  <SelectItem value="API">{tWishlist("categories.api")}</SelectItem>
                  <SelectItem value="UI/UX">{tWishlist("categories.uiux")}</SelectItem>
                  <SelectItem value="Integration">{tWishlist("categories.integration")}</SelectItem>
                  <SelectItem value="Sicherheit">{tWishlist("categories.security")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{tWishlist("dialog.descriptionLabel")}</Label>
              <Textarea
                id="description"
                placeholder={tWishlist("dialog.descriptionPlaceholder")}
                value={newRequest.description}
                onChange={(e) =>
                  setNewRequest((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitOpen(false)}>
              {tCommon("actions.cancel")}
            </Button>
            <Button onClick={handleSubmitRequest} disabled={submitting}>
              {submitting ? tWishlist("dialog.submitting") : tWishlist("dialog.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
