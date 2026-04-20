"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Download, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { plans, type Plan } from "@/lib/pricing";
import { dbIdByPlan, prorateUpgrade } from "@/lib/billing";
import { formatINR } from "@/lib/utils";

type Props = {
  subscription: {
    plan: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  };
  currentPlanId: Plan["id"];
  invoices: {
    id: string;
    date: string;
    planLabel: string;
    amount: number;
    status: "paid" | "pending" | "refunded";
  }[];
};

export function BillingClient({
  subscription,
  currentPlanId,
  invoices,
}: Props) {
  const router = useRouter();
  const [changeOpen, setChangeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<Plan["id"]>(currentPlanId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPlan = plans.find((p) => p.id === currentPlanId) ?? plans[0];
  const nextCharge = new Date(subscription.currentPeriodEnd);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? currentPlan;
  const proration = useMemo(() => {
    if (selectedPlan.id === currentPlan.id) return null;
    return prorateUpgrade({
      currentPlan,
      newPlan: selectedPlan,
      periodStart: new Date(subscription.currentPeriodStart),
      periodEnd: new Date(subscription.currentPeriodEnd),
    });
  }, [selectedPlan, currentPlan, subscription]);

  async function confirmChange() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: dbIdByPlan[selectedPlan.id] }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to change plan.");
      }
      setChangeOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCancel() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      if (!res.ok) throw new Error("Failed to cancel.");
      setCancelOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  const statusLabel =
    subscription.status === "canceled"
      ? "Cancelled"
      : subscription.status === "trialing"
        ? "Trial"
        : subscription.status === "past_due"
          ? "Past due"
          : "Active";

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Plan, invoices, and payment method.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            You&apos;re on: <span className="text-[color:var(--brand-emerald)]">{currentPlan.name}</span>
            <span className="rounded-full border border-border bg-card px-2 py-0.5 text-xs font-normal text-muted-foreground">
              {statusLabel}
            </span>
          </CardTitle>
          <CardDescription>
            {subscription.status === "canceled"
              ? `Access ends on ${nextCharge.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
              : `Next billing: ${nextCharge.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ${formatINR(currentPlan.total)}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button onClick={() => { setSelectedPlanId(currentPlanId); setChangeOpen(true); }}>
            Change plan
          </Button>
          {subscription.status !== "canceled" && (
            <Button variant="outline" onClick={() => setCancelOpen(true)}>
              Cancel subscription
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Past billing cycles.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <div className="col-span-3">Date</div>
              <div className="col-span-3">Plan</div>
              <div className="col-span-2">Invoice</div>
              <div className="col-span-2 text-right font-mono">Amount</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            {invoices.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No invoices yet. Your first charge happens at the end of your trial.
              </div>
            ) : (
              invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="grid grid-cols-12 items-center gap-4 px-6 py-3 text-sm"
                >
                  <div className="col-span-3 text-muted-foreground">
                    {new Date(inv.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <div className="col-span-3">{inv.planLabel}</div>
                  <div className="col-span-2 font-mono text-xs text-muted-foreground">
                    {inv.id}
                  </div>
                  <div className="col-span-2 text-right font-mono tabular-nums">
                    {formatINR(inv.amount)}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <span className="flex items-center gap-1 text-xs text-[color:var(--brand-emerald)]">
                      <CheckCircle2 className="h-3 w-3" /> {inv.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => alert("Invoice PDF download is available in production.")}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Download invoice"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment method</CardTitle>
          <CardDescription>
            Charged automatically at the end of each cycle.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-14 items-center justify-center rounded border border-border bg-card">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <div className="font-mono text-sm">•••• •••• •••• 4242</div>
              <div className="text-xs text-muted-foreground">HDFC · expires 08/27</div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => alert("Razorpay card update flow opens here in production.")}
          >
            Update
          </Button>
        </CardContent>
      </Card>

      {/* Change plan modal */}
      <Dialog open={changeOpen} onOpenChange={setChangeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Change plan</DialogTitle>
            <DialogDescription>
              Same product — just a different billing cycle. Commitment saves you money.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            {plans.map((p) => {
              const isCurrent = p.id === currentPlan.id;
              const isSelected = p.id === selectedPlanId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    isSelected
                      ? "border-[color:var(--brand-emerald)] bg-[color:var(--brand-emerald)]/5"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.name}</span>
                    {isCurrent && (
                      <span className="text-xs text-muted-foreground">Current</span>
                    )}
                    {p.badge && !isCurrent && (
                      <span className="rounded-full bg-[color:var(--brand-gold)]/10 px-2 py-0.5 text-xs text-[color:var(--brand-gold)]">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 font-mono text-xl tabular-nums">
                    ₹{p.monthly}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      /mo
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatINR(p.total)} {p.cadence}
                  </div>
                </button>
              );
            })}
          </div>

          {proration && (
            <div className="rounded-md border border-border bg-card/50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">New plan total</span>
                <span className="font-mono tabular-nums">{formatINR(selectedPlan.total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Credit for unused time</span>
                <span className="font-mono tabular-nums">−{formatINR(proration.credit)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2 font-medium">
                <span>Due today</span>
                <span className="font-mono tabular-nums">{formatINR(proration.due)}</span>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-[color:var(--loss)]">{error}</p>}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangeOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmChange}
              disabled={busy || selectedPlan.id === currentPlan.id}
            >
              {busy
                ? "Processing…"
                : selectedPlan.id === currentPlan.id
                  ? "No change"
                  : "Confirm change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel modal */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel subscription</DialogTitle>
            <DialogDescription>
              You&apos;ll keep access until{" "}
              {nextCharge.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              . Your data is deleted within 30 days after that.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-xs text-[color:var(--loss)]">{error}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={busy}
            >
              Keep subscription
            </Button>
            <Button
              onClick={confirmCancel}
              disabled={busy}
              className="bg-[color:var(--loss)] hover:bg-[color:var(--loss)]/90"
            >
              {busy ? "Cancelling…" : "Cancel anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
