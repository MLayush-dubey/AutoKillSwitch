"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatINR } from "@/lib/utils";

export type TriggerRow = {
  id: string;
  triggeredAt: string;
  reason: "MAX_LOSS" | "MAX_PROFIT" | "MAX_TRADES" | "TIME_BASED";
  pnl: number;
  trades: number;
  cancelled: number;
  flattened: number;
  events: { t: string; kind: string; msg: string }[];
};

const reasonLabel: Record<TriggerRow["reason"], string> = {
  MAX_LOSS: "Max loss",
  MAX_PROFIT: "Max profit",
  MAX_TRADES: "Max trades",
  TIME_BASED: "Time-based exit",
};

type Filter = "all" | TriggerRow["reason"];
type Sort = "recent" | "pnl_desc" | "pnl_asc";

export function HistoryView({ rows }: { rows: TriggerRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = useMemo(() => {
    const filtered = filter === "all" ? rows : rows.filter((r) => r.reason === filter);
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "recent")
        return new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime();
      if (sort === "pnl_desc") return b.pnl - a.pnl;
      return a.pnl - b.pnl;
    });
    return sorted;
  }, [rows, filter, sort]);

  const stats = useMemo(() => buildStats(rows), [rows]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card/40 p-3">
          <FilterPills
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "MAX_LOSS", label: "Loss" },
              { value: "MAX_PROFIT", label: "Profit" },
              { value: "MAX_TRADES", label: "Trades" },
              { value: "TIME_BASED", label: "Time" },
            ]}
          />
          <div className="ml-auto flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs"
            >
              <option value="recent">Most recent</option>
              <option value="pnl_desc">P&amp;L (high → low)</option>
              <option value="pnl_asc">P&amp;L (low → high)</option>
            </select>
          </div>
        </div>

        {visible.length === 0 && <EmptyHistory />}

        <div className="overflow-hidden rounded-lg border border-border bg-card/20">
          {visible.map((r) => {
            const open = expanded === r.id;
            return (
              <div key={r.id} className="border-b border-border last:border-0">
                <button
                  onClick={() => setExpanded(open ? null : r.id)}
                  className="grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-4 p-4 text-left transition-colors hover:bg-accent/40"
                >
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-6">
                    <div className="min-w-[150px] font-mono text-xs tabular-nums text-muted-foreground">
                      {formatDateTime(r.triggeredAt)}
                    </div>
                    <div className="min-w-[120px] text-sm">{reasonLabel[r.reason]}</div>
                    <div
                      className={cn(
                        "min-w-[110px] font-mono text-sm tabular-nums",
                        r.pnl >= 0
                          ? "text-[color:var(--profit)]"
                          : "text-[color:var(--loss)]"
                      )}
                    >
                      {r.pnl >= 0 ? "+" : ""}
                      {formatINR(r.pnl)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.trades} trades · cancelled {r.cancelled} · flattened{" "}
                      {r.flattened}
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      open && "rotate-90"
                    )}
                  />
                </button>
                {open && (
                  <div className="border-t border-border bg-background/50 px-6 py-4">
                    <ol className="relative space-y-2 border-l border-border pl-5">
                      {r.events.map((ev, i) => (
                        <li key={i} className="relative">
                          <span
                            className={cn(
                              "absolute -left-[22px] top-1.5 h-1.5 w-1.5 rounded-full",
                              ev.kind === "trigger"
                                ? "bg-[color:var(--loss)]"
                                : ev.kind === "action"
                                  ? "bg-[color:var(--brand-emerald)]"
                                  : ev.kind === "warning"
                                    ? "bg-[color:var(--brand-gold)]"
                                    : "bg-muted-foreground"
                            )}
                          />
                          <div className="flex items-baseline gap-3 text-xs">
                            <span className="font-mono tabular-nums text-muted-foreground">
                              {ev.t}
                            </span>
                            <span>{ev.msg}</span>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" variant="outline" disabled>
                        Export PDF (coming soon)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <StatsSidebar stats={stats} />
    </div>
  );
}

function FilterPills({
  value,
  onChange,
  options,
}: {
  value: Filter;
  onChange: (v: Filter) => void;
  options: { value: Filter; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full px-3 py-1 text-xs transition-colors",
            value === o.value
              ? "bg-[color:var(--brand-emerald)]/20 text-[color:var(--brand-emerald)]"
              : "border border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StatsSidebar({
  stats,
}: {
  stats: { total: number; avgPnl: number; mostCommon: string; avoided: number };
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stats</CardTitle>
          <CardDescription>All-time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Stat label="Total triggers" value={stats.total.toString()} />
          <Stat
            label="Avg P&L at trigger"
            value={`${stats.avgPnl >= 0 ? "+" : ""}${formatINR(stats.avgPnl)}`}
          />
          <Stat label="Most common" value={stats.mostCommon} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estimated loss avoided</CardTitle>
          <CardDescription>
            Rough estimate, assuming drawdown continued after each trigger.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-2xl tabular-nums text-[color:var(--profit)]">
            +{formatINR(stats.avoided)}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            The monitor stepped in before it got worse.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}

function EmptyHistory() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/20 p-12 text-center">
      <div className="text-2xl">🎯</div>
      <h3 className="mt-3 text-base font-semibold">No triggers yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        That&apos;s good — it means your trading has been disciplined.
      </p>
    </div>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function buildStats(rows: TriggerRow[]) {
  if (rows.length === 0) {
    return { total: 0, avgPnl: 0, mostCommon: "—", avoided: 0 };
  }
  const sum = rows.reduce((s, r) => s + r.pnl, 0);
  const avg = Math.round(sum / rows.length);

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.reason] = (acc[r.reason] ?? 0) + 1;
    return acc;
  }, {});
  const topReason = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

  // Rough "avoided" model: for losing triggers, assume another 30% drawdown
  // would have occurred had we not intervened.
  const avoided = rows
    .filter((r) => r.pnl < 0)
    .reduce((s, r) => s + Math.round(Math.abs(r.pnl) * 0.3), 0);

  return {
    total: rows.length,
    avgPnl: avg,
    mostCommon: reasonLabel[topReason as TriggerRow["reason"]] ?? topReason,
    avoided,
  };
}
