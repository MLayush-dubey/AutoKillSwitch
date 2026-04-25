"use client";

import { memo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR } from "@/lib/utils";

export type DailyPnl = {
  date: string; // "Mon 14"
  iso: string;  // YYYY-MM-DD
  pnl: number;
  triggered: boolean;
};

function PnlChartImpl({ data }: { data: DailyPnl[] }) {
  const hasNegative = data.some((d) => d.pnl < 0);

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="pnlPositive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--profit)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--profit)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            stroke="var(--muted-foreground)"
            fontSize={11}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            stroke="var(--muted-foreground)"
            fontSize={11}
            width={56}
            tickFormatter={(v: number) => formatINR(v)}
          />
          {hasNegative && (
            <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
          )}
          {data
            .filter((d) => d.triggered)
            .map((d) => (
              <ReferenceLine
                key={d.iso}
                x={d.date}
                stroke="var(--brand-gold)"
                strokeDasharray="2 4"
              />
            ))}
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as DailyPnl;
              return (
                <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
                  <div className="text-muted-foreground">{p.date}</div>
                  <div className="mt-1 font-mono tabular-nums">
                    {p.pnl >= 0 ? "+" : ""}
                    {formatINR(p.pnl)}
                  </div>
                  {p.triggered && (
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-[color:var(--brand-gold)]">
                      Killswitch triggered
                    </div>
                  )}
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="pnl"
            stroke="var(--profit)"
            strokeWidth={2}
            fill="url(#pnlPositive)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Parent (server component) hands us a fresh `data` array on every navigation.
// Cheap structural compare — length + last point + any trigger flag changes —
// keeps the chart from re-rendering when the data is logically the same.
export const PnlChart = memo(PnlChartImpl, (prev, next) => {
  if (prev.data === next.data) return true;
  if (prev.data.length !== next.data.length) return false;
  const a = prev.data[prev.data.length - 1];
  const b = next.data[next.data.length - 1];
  if (!a || !b) return false;
  if (a.iso !== b.iso || a.pnl !== b.pnl || a.triggered !== b.triggered) return false;
  // Spot-check the first point too — protects against a full shift while
  // length stays equal.
  const a0 = prev.data[0];
  const b0 = next.data[0];
  if (a0.iso !== b0.iso || a0.pnl !== b0.pnl) return false;
  return true;
});
