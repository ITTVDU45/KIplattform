"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { PageShell } from "@/components/layout/page-shell";
import { DataTable, type Column } from "@/components/common/data-table";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MessageCircle,
  Ticket,
  BookOpen,
  Plus,
  Send,
  Bot,
  User,
  Search,
  Eye,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";
import * as api from "@/lib/mock/api";
import type { Ticket as TicketType, KnowledgeArticle } from "@/types/domain";

export default function SupportPage() {
  const t = useTranslations("support");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", content: t("chat.greeting") },
  ]);
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [newTicket, setNewTicket] = useState<{
    subject: string;
    description: string;
    priority: "low" | "medium" | "high" | "urgent";
    category: string;
  }>({
    subject: "",
    description: "",
    priority: "medium",
    category: "Technisch",
  });
  const [creating, setCreating] = useState(false);
  const [articleSearch, setArticleSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [ticketsRes, articlesRes] = await Promise.all([
          api.getTickets(),
          api.getKnowledgeArticles(),
        ]);
        setTickets(ticketsRes.data);
        setArticles(articlesRes.data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function handleSendMessage() {
    if (!chatInput.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: chatInput }]);
    setChatInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: t("chat.botReply") },
      ]);
    }, 1000);
  }

  async function handleCreateTicket() {
    if (!newTicket.subject || !newTicket.description) {
      toast.error(t("tickets.fillAll"));
      return;
    }
    setCreating(true);
    try {
      const res = await api.createTicket(newTicket);
      setTickets((prev) => [res.data, ...prev]);
      setCreateTicketOpen(false);
      setNewTicket({ subject: "", description: "", priority: "medium", category: "Technisch" });
      toast.success(t("tickets.success"));
    } catch {
      toast.error(t("tickets.error"));
    } finally {
      setCreating(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function getStatusVariant(status: TicketType["status"]) {
    switch (status) {
      case "open":
        return "default";
      case "in_progress":
        return "warning";
      case "resolved":
        return "success";
      case "closed":
        return "secondary";
      default:
        return "outline";
    }
  }

  function getPriorityVariant(priority: TicketType["priority"]) {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "warning";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  }

  const ticketColumns: Column<TicketType>[] = [
    {
      key: "subject",
      header: t("table.subject"),
      cell: (row) => <span className="font-medium">{row.subject}</span>,
    },
    {
      key: "status",
      header: t("table.status"),
      cell: (row) => (
        <Badge variant={getStatusVariant(row.status)}>
          {row.status === "open"
            ? t("status.open")
            : row.status === "in_progress"
            ? t("status.inProgress")
            : row.status === "resolved"
            ? t("status.resolved")
            : t("status.closed")}
        </Badge>
      ),
    },
    {
      key: "priority",
      header: t("table.priority"),
      cell: (row) => (
        <Badge variant={getPriorityVariant(row.priority)}>
          {row.priority === "urgent"
            ? t("priority.urgent")
            : row.priority === "high"
            ? t("priority.high")
            : row.priority === "medium"
            ? t("priority.medium")
            : t("priority.low")}
        </Badge>
      ),
    },
    {
      key: "category",
      header: t("table.category"),
      cell: (row) => {
        const categoryMap: Record<string, string> = {
          "Technisch": t("categories.technical"),
          "Billing": t("categories.billing"),
          "Feature Request": t("categories.featureRequest"),
          "Allgemein": t("categories.general"),
        };
        return categoryMap[row.category] || row.category;
      },
    },
    {
      key: "date",
      header: t("table.created"),
      cell: (row) => formatDate(row.createdAt),
    },
  ];

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(articleSearch.toLowerCase()) ||
      a.content.toLowerCase().includes(articleSearch.toLowerCase())
  );

  if (loading) {
    return (
      <PageShell title={t("title")} description={t("description")}>
        <LoadingState rows={4} />
      </PageShell>
    );
  }

  return (
    <PageShell title={t("title")} description={t("description")}>
      <Tabs defaultValue="chat">
        <TabsList>
          <TabsTrigger value="chat" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            {t("tabs.chat")}
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-2">
            <Ticket className="h-4 w-4" />
            {t("tabs.tickets")} ({tickets.length})
          </TabsTrigger>
          <TabsTrigger value="kb" className="gap-2">
            <BookOpen className="h-4 w-4" />
            {t("tabs.kb")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                {t("chat.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] border rounded-lg p-4 mb-4">
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${
                        msg.role === "user" ? "justify-end" : ""
                      }`}
                    >
                      {msg.role === "bot" && (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.role === "user" && (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  placeholder={t("chat.placeholder")}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreateTicketOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("tickets.newTicket")}
            </Button>
          </div>

          {tickets.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title={t("empty.title")}
              description={t("empty.description")}
              action={{ label: t("empty.action"), onClick: () => setCreateTicketOpen(true) }}
            />
          ) : (
            <DataTable
              columns={ticketColumns}
              data={tickets}
              onRowClick={() => toast.info(t("tickets.detailsInfo"))}
            />
          )}
        </TabsContent>

        <TabsContent value="kb" className="mt-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("kb.searchPlaceholder")}
              value={articleSearch}
              onChange={(e) => setArticleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Accordion type="single" collapsible className="w-full">
            {filteredArticles.map((article) => (
              <AccordionItem key={article.id} value={article.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <div>
                      <div className="font-medium">{article.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {article.category}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-7 space-y-3">
                    <p className="text-muted-foreground">{article.content}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {article.views} {t("kb.views")}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {article.helpful} {t("kb.helpful")}
                      </span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>
      </Tabs>

      {/* Create Ticket Dialog */}
      <Dialog open={createTicketOpen} onOpenChange={setCreateTicketOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("tickets.createTitle")}</DialogTitle>
            <DialogDescription>
              {t("tickets.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">{t("tickets.subject")}</Label>
              <Input
                id="subject"
                placeholder={t("tickets.subjectPlaceholder")}
                value={newTicket.subject}
                onChange={(e) =>
                  setNewTicket((prev) => ({ ...prev, subject: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("tickets.category")}</Label>
                <Select
                  value={newTicket.category}
                  onValueChange={(v) =>
                    setNewTicket((prev) => ({ ...prev, category: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technisch">{t("categories.technical")}</SelectItem>
                    <SelectItem value="Billing">{t("categories.billing")}</SelectItem>
                    <SelectItem value="Feature Request">{t("categories.featureRequest")}</SelectItem>
                    <SelectItem value="Allgemein">{t("categories.general")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("tickets.priority")}</Label>
                <Select
                  value={newTicket.priority}
                  onValueChange={(v: "low" | "medium" | "high" | "urgent") =>
                    setNewTicket((prev) => ({ ...prev, priority: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("priority.low")}</SelectItem>
                    <SelectItem value="medium">{t("priority.medium")}</SelectItem>
                    <SelectItem value="high">{t("priority.high")}</SelectItem>
                    <SelectItem value="urgent">{t("priority.urgent")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("tickets.description")}</Label>
              <Textarea
                id="description"
                placeholder={t("tickets.descriptionPlaceholder")}
                value={newTicket.description}
                onChange={(e) =>
                  setNewTicket((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTicketOpen(false)}>
              {tCommon("actions.cancel")}
            </Button>
            <Button onClick={handleCreateTicket} disabled={creating}>
              {creating ? t("tickets.creating") : t("tickets.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
