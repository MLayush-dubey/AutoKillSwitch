"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatINR } from "@/lib/utils";
import { formatDuration, getMarketStatus, type MarketStatus } from "@/lib/market";

type Props = {
  maxDailyLoss: number;
  maxDailyProfit: number;
  maxTrades: number;
  /** Pnl + trade seed from server to keep SSR/CSR markup consistent. */
  seedPnl: number;
  seedTrades: number;
};

function sameMarket(a: MarketStatus, b: MarketStatus): boolean {
  if (a.state !== b.state) return false;
  if (a.state === "open" && b.state === "open")
    return a.minutesToClose === b.minutesToClose;
  if (a.state !== "open" && b.state !== "open")
    return a.minutesToOpen === b.minutesToOpen;
  return false;
}

export function LiveStatusCards({
  maxDailyLoss,
  maxDailyProfit,
  maxTrades,
  seedPnl,
  seedTrades,
}: Props) {
  const [pnl, setPnl] = useState(seedPnl);
  const [trades, setTrades] = useState(seedTrades);
  const [market, setMarket] = useState<MarketStatus>(getMarketStatus());
  const marketRef = useRef(market);
  marketRef.current = market;

  useEffect(() => {
    let counter = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      // Pause everything when the tab is hidden — saves CPU and avoids
      // throttled-timer jank when the user comes back.
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      counter += 1;

      // Market clock only ticks at minute resolution; only push a new state
      // when the value would visibly change.
      const next = getMarketStatus();
      if (!sameMarket(marketRef.current, next)) {
        setMarket(next);
      }

      // Drift the simulated P&L every ~2.5s, only while market is open.
      if (counter % 3 === 0 && marketRef.current.state === "open") {
        setPnl((p) => {
          const drift = Math.round((Math.random() - 0.48) * 75);
          const np = p + drift;
          return Math.max(-maxDailyLoss + 500, Math.min(maxDailyProfit - 500, np));
        });
        if (Math.random() < 0.12) {
          setTrades((t) => Math.min(maxTrades - 2, t + 1));
        }
      }
    };

    const i = setInterval(tick, 1000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        const next = getMarketStatus();
        if (!sameMarket(marketRef.current, next)) setMarket(next);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(i);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [maxDailyLoss, maxDailyProfit, maxTrades]);

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
