"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn, formatINR } from "@/lib/utils";
import { defaultRules, type RulesInput } from "@/lib/rules";

type SaveState = "idle" | "saving" | "saved" | "error";

export function RulesForm({ initial }: { initial: RulesInput }) {
  const [values, setValues] = useState<RulesInput>(initial);
  const [state, setState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(
    !!(initial.timeBasedExit || initial.perTradeLossLimit || initial.consecutiveLossLimit)
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setState("saving");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/rules", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error("save failed");
        setState("saved");
        setSavedAt(new Date());
      } catch {
        setState("error");
      }
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [values]);

  function update<K extends keyof RulesInput>(key: K, v: RulesInput[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  return (
    <div className="space-y-6">
      <SaveIndicator state={state} savedAt={savedAt} />

      <Card>
        <CardHeader>
          <CardTitle>Hard limits</CardTitle>
          <CardDescription>
            When any of these is breached, we cancel pending orders, exit open
            positions, and activate Dhan&apos;s kill switch.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <SliderRow
            label="Max daily loss"
            value={values.maxDailyLoss}
            display={`-${formatINR(values.maxDailyLoss)}`}
            onChange={(v) => update("maxDailyLoss", v)}
            min={100}
            max={50_000}
            step={100}
            accent="loss"
          />
          <SliderRow
            label="Max daily profit"
            value={values.maxDailyProfit}
            display={`+${formatINR(values.maxDailyProfit)}`}
            onChange={(v) => update("maxDailyProfit", v)}
            min={100}
            max={100_000}
            step={100}
            accent="profit"
          />
          <SliderRow
            label="Max trades per day"
            value={values.maxTrades}
            display={`${values.maxTrades} trades`}
            onChange={(v) => update("maxTrades", v)}
            min={1}
            max={100}
            step={1}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Warning thresholds</CardTitle>
          <CardDescription>
            Nudge before we intervene. Best set around 75–85%.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <SliderRow
            label="Warn at % of each limit"
            value={values.warningThresholdPct}
            display={`${values.warningThresholdPct}%`}
            onChange={(v) => update("warningThresholdPct", v)}
            min={50}
            max={99}
            step={1}
          />
          <div className="flex items-center justify-between border-t border-border pt-6">
            <div>
              <div className="text-sm font-medium">Send warning to Telegram</div>
              <div className="text-xs text-muted-foreground">
                Requires Telegram setup in Settings → Notifications.
              </div>
            </div>
            <Switch
              checked={values.telegramWarnings}
              onCheckedChange={(v) => update("telegramWarnings", v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Advanced</CardTitle>
              <CardDescription>Extra guardrails. All optional.</CardDescription>
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-muted-foreground transition-transform",
                showAdvanced && "rotate-180"
              )}
            />
          </div>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="tbe">Time-based exit (HH:MM, IST)</Label>
              <Input
                id="tbe"
                type="time"
                value={values.timeBasedExit ?? ""}
                onChange={(e) =>
                  update("timeBasedExit", e.target.value || null)
                }
                className="max-w-[160px]"
              />
              <p className="text-xs text-muted-foreground">
                Force-exit all positions at this time, regardless of P&amp;L.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ptll">Max loss per single trade (₹)</Label>
              <Input
                id="ptll"
                type="number"
                min={0}
                max={50000}
                value={values.perTradeLossLimit ?? ""}
                onChange={(e) =>
                  update(
                    "perTradeLossLimit",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="max-w-[200px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cll">Stop after N consecutive losing trades</Label>
              <Input
                id="cll"
                type="number"
                min={0}
                max={20}
                value={values.consecutiveLossLimit ?? ""}
                onChange={(e) =>
                  update(
                    "consecutiveLossLimit",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="max-w-[200px]"
              />
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setValues(defaultRules)}
        >
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  display,
  onChange,
  min,
  max,
  step,
  accent,
}: {
  label: string;
  value: number;
  display: string;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  accent?: "profit" | "loss";
}) {
  const color =
    accent === "profit"
      ? "text-[color:var(--profit)]"
      : accent === "loss"
        ? "text-[color:var(--loss)]"
        : "text-foreground";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className={cn("font-mono text-sm tabular-nums", color)}>
          {display}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      />
      <div className="flex justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function SaveIndicator({
  state,
  savedAt,
}: {
  state: SaveState;
  savedAt: Date | null;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  let text = "Changes save automatically";
  let tone = "text-muted-foreground";

  if (state === "saving") {
    text = "Saving…";
  } else if (state === "saved" && savedAt) {
    const secs = Math.max(0, Math.floor((Date.now() - savedAt.getTime()) / 1000));
    text =
      secs < 2 ? "Saved just now" : `Saved ${secs} second${secs === 1 ? "" : "s"} ago`;
    tone = "text-[color:var(--profit)]";
  } else if (state === "error") {
    text = "Couldn't save — check your connection";
    tone = "text-destructive";
  }

  return (
    <div
      key={tick}
      className={cn(
        "flex items-center gap-2 rounded-md border border-border bg-card/40 px-3 py-2 text-xs",
        tone
      )}
    >
      {state === "saved" && <Check className="h-3.5 w-3.5" />}
      {text}
    </div>
  );
}
