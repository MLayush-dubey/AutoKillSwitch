import { formatINR } from "@/lib/utils";

/**
 * Faux dashboard screenshot rendered in plain HTML/CSS so it looks crisp at
 * any resolution and doesn't depend on an image asset. Matches the real
 * dashboard layout closely enough to feel like a product shot.
 */
export function DashboardPreview() {
  const pnl = 2450;
  const trades = 14;
  const maxLoss = 5000;
  const loss = 1230;
  const maxProfit = 10000;
  const maxTrades = 20;

  return (
    <div className="rounded-xl border border-border bg-card shadow-2xl shadow-black/40 ring-1 ring-white/5">
      {/* browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-muted" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted" />
        <span className="ml-3 text-xs text-muted-foreground">
          app.autokillswitch.in/app
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Today&apos;s P&amp;L</div>
            <div className="mt-1 font-mono text-3xl tabular-nums text-[color:var(--profit)]">
              +{formatINR(pnl).replace("+", "")}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              from {trades} trades
            </div>
          </div>
          <div className="rounded-md bg-[color:var(--profit)]/10 px-2.5 py-1 text-xs font-medium text-[color:var(--profit)]">
            ● Armed
          </div>
        </div>

        <div className="space-y-2.5 rounded-md border border-border bg-background/40 p-3 text-xs">
          <LimitBar label="Loss" value={loss} max={maxLoss} tone="loss" />
          <LimitBar label="Profit" value={pnl} max={maxProfit} tone="profit" />
          <LimitBar label="Trades" value={trades} max={maxTrades} tone="neutral" />
        </div>

        <div className="rounded-md border border-border bg-background/40 p-3">
          <div className="text-xs font-medium">Activity</div>
          <ul className="mt-2 space-y-1.5 font-mono text-[11px] text-muted-foreground">
            <li>09:15:00 · Monitor started</li>
            <li>10:47:23 · 14 trades executed</li>
            <li className="text-[color:var(--brand-gold)]">
              11:02:15 · Warning — trade count at 80%
            </li>
            <li className="text-foreground">11:15:12 · Monitoring continues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function LimitBar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "loss" | "profit" | "neutral";
}) {
  const pct = Math.min(100, Math.round((Math.abs(value) / max) * 100));
  const barColor =
    tone === "loss"
      ? "bg-[color:var(--loss)]"
      : tone === "profit"
        ? "bg-[color:var(--profit)]"
        : "bg-[color:var(--brand-gold)]";

  return (
    <div>
      <div className="flex justify-between text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-foreground">
          {pct}%
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`${barColor} h-full rounded-full transition-[width]`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
