"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatINR } from "@/lib/utils";
import { formatDuration, getMarketStatus } from "@/lib/market";

type Props = {
  maxDailyLoss: number;
  maxDailyProfit: number;
  maxTrades: number;
  /** Pnl + trade seed from server to keep SSR/CSR markup consistent. */
  seedPnl: number;
  seedTrades: number;
};

export function LiveStatusCards({
  maxDailyLoss,
  maxDailyProfit,
  maxTrades,
  seedPnl,
  seedTrades,
}: Props) {
  const [pnl, setPnl] = useState(seedPnl);
  const [trades, setTrades] = useState(seedTrades);
  const [market, setMarket] = useState(getMarketStatus());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => {
      setMarket(getMarketStatus());
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (market.state !== "open") return;
    const i = setInterval(() => {
      // Deterministic-feeling drift: bias slightly positive, occasional trade
      setPnl((p) => {
        const drift = Math.round((Math.random() - 0.48) * 75);
        const next = p + drift;
        // clamp so we don't visually trip the limits
        return Math.max(-maxDailyLoss + 500, Math.min(maxDailyProfit - 500, next));
      });
      if (Math.random() < 0.12) setTrades((t) => Math.min(maxTrades - 2, t + 1));
    }, 2500);
    return () => clearInterval(i);
  }, [market.state, maxDailyLoss, maxDailyProfit, maxTrades]);

  const pnlColor =
    pnl > 0
      ? "text-[color:var(--profit)]"
      : pnl < 0
        ? "text-[color:var(--loss)]"
        : "text-foreground";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Today&apos;s P&amp;L</CardDescription>
          <CardTitle
            className={cn(
              "font-mono text-3xl tabular-nums transition-colors",
              pnlColor
            )}
          >
            {pnl >= 0 ? "+" : ""}
            {formatINR(pnl)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          from {trades} trade{trades === 1 ? "" : "s"}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Killswitch</CardDescription>
          <CardTitle className="flex items-center gap-2">
            {market.state === "open" ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--profit)] opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[color:var(--profit)]" />
                </span>
                <span className="text-xl">Armed</span>
              </>
            ) : (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-muted" />
                <span className="text-xl">
                  {market.state === "pre_open" ? "Pre-open" : "Idle"}
                </span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {market.state === "open"
            ? `Monitoring · market closes in ${formatDuration(market.minutesToClose)}`
            : `Market opens in ${formatDuration(market.minutesToOpen)}`}
          {/* tick keeps "X minutes ago" live even without state change */}
          <span className="hidden">{tick}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Today&apos;s limits</CardDescription>
          <CardTitle className="text-xl">Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <LimitRow
            label="Loss"
            value={Math.max(0, -pnl)}
            max={maxDailyLoss}
            tone="loss"
            format={formatINR}
          />
          <LimitRow
            label="Profit"
            value={Math.max(0, pnl)}
            max={maxDailyProfit}
            tone="profit"
            format={formatINR}
          />
          <LimitRow
            label="Trades"
            value={trades}
            max={maxTrades}
            tone="neutral"
            format={(v) => `${v}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function LimitRow({
  label,
  value,
  max,
  tone,
  format,
}: {
  label: string;
  value: number;
  max: number;
  tone: "loss" | "profit" | "neutral";
  format: (v: number) => string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  let bar = "bg-[color:var(--brand-emerald)]";
  if (pct >= 100) bar = "bg-[color:var(--loss)]";
  else if (pct >= 80) bar = "bg-[color:var(--brand-gold)]";
  else if (tone === "loss") bar = "bg-[color:var(--loss)]/60";

  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">
          {format(value)} <span className="text-muted-foreground">/ {format(max)}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(bar, "h-full rounded-full transition-[width] duration-500")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
