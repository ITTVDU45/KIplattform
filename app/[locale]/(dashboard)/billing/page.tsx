"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { PageShell } from "@/components/layout/page-shell";
import { StatCard } from "@/components/common/stat-card";
import { DataTable, type Column } from "@/components/common/data-table";
import { LoadingCards, LoadingTable } from "@/components/common/loading-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreditCard, Plus, Check, TrendingUp, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { toast } from "sonner";
import * as api from "@/lib/mock/api";
import type { Transaction, Plan } from "@/types/domain";

export default function BillingPage() {
  const t = useTranslations("billing");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [balanceRes, txRes, plansRes] = await Promise.all([
          api.getBalance(),
          api.getTransactions(),
          api.getPlans(),
        ]);
        setBalance(balanceRes.data);
        setTransactions(txRes.data);
        setPlans(plansRes.data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleTopup() {
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(tCommon("validation.invalidAmount"));
      return;
    }
    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setBalance((prev) => prev + amount);
    setTransactions((prev) => [
      {
        id: `tx_${Date.now()}`,
        type: "topup",
        amount,
        description: t("topUp.creditAdded"),
        createdAt: new Date().toISOString(),
        balance: balance + amount,
      },
      ...prev,
    ]);
    setProcessing(false);
    setTopupOpen(false);
    setTopupAmount("");
    toast.success(t("topUp.success", { amount: amount.toFixed(2) }));
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function getTransactionIcon(type: Transaction["type"]) {
    switch (type) {
      case "topup":
        return <ArrowUpRight className="h-4 w-4 text-accent-success" />;
      case "usage":
        return <ArrowDownRight className="h-4 w-4 text-accent-danger" />;
      case "refund":
        return <ArrowUpRight className="h-4 w-4 text-accent-primary" />;
      case "bonus":
        return <Plus className="h-4 w-4 text-accent-purple" />;
      default:
        return null;
    }
  }

  function getTransactionTypeLabel(type: Transaction["type"]) {
    return t(`transactions.types.${type}`);
  }

  const columns: Column<Transaction>[] = [
    {
      key: "type",
      header: t("transactions.type"),
      cell: (row) => (
        <div className="flex items-center gap-2">
          {getTransactionIcon(row.type)}
          <span className="text-foreground">
            {getTransactionTypeLabel(row.type)}
          </span>
        </div>
      ),
    },
    {
      key: "description",
      header: t("transactions.description"),
      mobileHidden: true,
      cell: (row) => <span className="text-muted-foreground">{row.description}</span>,
    },
    {
      key: "amount",
      header: t("transactions.amount"),
      cell: (row) => (
        <span className={`font-medium tabular-nums ${row.amount >= 0 ? "text-accent-success" : "text-accent-danger"}`}>
          {row.amount >= 0 ? "+" : ""}
          {row.amount.toFixed(2)} €
        </span>
      ),
    },
    {
      key: "balance",
      header: t("transactions.balance"),
      mobileHidden: true,
      cell: (row) => <span className="text-muted-foreground tabular-nums">{row.balance.toFixed(2)} €</span>,
    },
    {
      key: "date",
      header: t("transactions.date"),
      cell: (row) => <span className="text-muted-foreground">{formatDate(row.createdAt)}</span>,
    },
  ];

  // Calculate monthly spend
  const thisMonth = transactions
    .filter((tx) => tx.type === "usage")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  if (loading) {
    return (
      <PageShell title={t("title")} description={t("description")}>
        <LoadingCards count={3} />
        <LoadingTable rows={5} cols={5} />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={t("title")}
      description={t("description")}
      actions={
        <Button onClick={() => setTopupOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("topUp.button")}
        </Button>
      }
    >
      {/* Balance Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              {t("balance.current")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground tabular-nums">
              {balance.toLocaleString(locale === "de" ? "de-DE" : "en-US", { minimumFractionDigits: 2 })} €
            </div>
            <Progress value={75} className="mt-4 h-1.5" />
            <p className="text-xs text-muted-foreground mt-3">
              {t("balance.estimate", { days: "15" })}
            </p>
          </CardContent>
        </Card>

        <StatCard
          title={t("usage.monthly")}
          value={`${thisMonth.toFixed(2)} €`}
          trend={{ value: 8.2, label: "vs. Vormonat" }}
          icon={TrendingUp}
        />

        <StatCard
          title={t("usage.daily")}
          value={`${(thisMonth / 22).toFixed(2)} €`}
          description={t("usage.basedOnMonth")}
          icon={CreditCard}
        />
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("plans.title")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.popular ? "border-accent-primary/50 shadow-glow" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">{plan.name}</CardTitle>
                  {plan.popular && <Badge variant="default">{t("plans.popular")}</Badge>}
                </div>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">{plan.price} €</span>
                  <span className="text-muted-foreground">{t("plans.perMonth")}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-accent-success shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full"
                  onClick={() => toast.info(t("plans.changePending"))}
                >
                  {plan.popular ? t("plans.currentPlan") : t("plans.selectPlan")}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("transactions.title")}</h2>
        <DataTable columns={columns} data={transactions} />
      </div>

      {/* Topup Dialog */}
      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("topUp.title")}</DialogTitle>
            <DialogDescription>
              {t("topUp.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              {[50, 100, 250].map((amount) => (
                <Button
                  key={amount}
                  variant={topupAmount === String(amount) ? "default" : "outline"}
                  onClick={() => setTopupAmount(String(amount))}
                >
                  {amount} €
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-muted-foreground">{t("topUp.customAmount")}</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="pr-8 bg-muted/50 border-border"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  €
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopupOpen(false)}>
              {tCommon("actions.cancel")}
            </Button>
            <Button onClick={handleTopup} disabled={processing}>
              {processing ? t("topUp.processing") : t("topUp.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
