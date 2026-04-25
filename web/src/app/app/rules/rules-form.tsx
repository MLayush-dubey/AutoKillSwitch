"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
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

  const setMaxDailyLoss = useCallback(
    (v: number) => setValues((prev) => ({ ...prev, maxDailyLoss: v })),
    []
  );
  const setMaxDailyProfit = useCallback(
    (v: number) => setValues((prev) => ({ ...prev, maxDailyProfit: v })),
    []
  );
  const setMaxTrades = useCallback(
    (v: number) => setValues((prev) => ({ ...prev, maxTrades: v })),
    []
  );
  const setWarningThresholdPct = useCallback(
    (v: number) => setValues((prev) => ({ ...prev, warningThresholdPct: v })),
    []
  );
  const setTelegramWarnings = useCallback(
    (v: boolean) => setValues((prev) => ({ ...prev, telegramWarnings: v })),
    []
  );
  const setTimeBasedExit = useCallback(
    (v: string | null) => setValues((prev) => ({ ...prev, timeBasedExit: v })),
    []
  );
  const setPerTradeLossLimit = useCallback(
    (v: number | null) => setValues((prev) => ({ ...prev, perTradeLossLimit: v })),
    []
  );
  const setConsecutiveLossLimit = useCallback(
    (v: number | null) => setValues((prev) => ({ ...prev, consecutiveLossLimit: v })),
    []
  );
  const toggleAdvanced = useCallback(() => setShowAdvanced((v) => !v), []);
  const resetDefaults = useCallback(() => setValues(defaultRules), []);

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
            onChange={setMaxDailyLoss}
            min={100}
            max={50_000}
            step={100}
            accent="loss"
          />
          <SliderRow
            label="Max daily profit"
            value={values.maxDailyProfit}
            display={`+${formatINR(values.maxDailyProfit)}`}
            onChange={setMaxDailyProfit}
            min={100}
            max={100_000}
            step={100}
            accent="profit"
          />
          <SliderRow
            label="Max trades per day"
            value={values.maxTrades}
            display={`${values.maxTrades} trades`}
            onChange={setMaxTrades}
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
            onChange={setWarningThresholdPct}
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
              onCheckedChange={setTelegramWarnings}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={toggleAdvanced}
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
                onChange={(e) => setTimeBasedExit(e.target.value || null)}
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
                  setPerTradeLossLimit(
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
                  setConsecutiveLossLimit(
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
          onClick={resetDefaults}
        >
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}

type SliderRowProps = {
  label: string;
  value: number;
  display: string;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  accent?: "profit" | "loss";
};

const SliderRow = memo(function SliderRow({
  label,
  value,
  display,
  onChange,
  min,
  max,
  step,
  accent,
}: SliderRowProps) {
  const color =
    accent === "profit"
      ? "text-[color:var(--profit)]"
      : accent === "loss"
        ? "text-[color:var(--loss)]"
        : "text-foreground";

  const handleValueChange = useCallback(
    ([v]: number[]) => onChange(v),
    [onChange]
  );

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
        onValueChange={handleValueChange}
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
});

const SaveIndicator = memo(function SaveIndicator({
  state,
  savedAt,
}: {
  state: SaveState;
  savedAt: Date | null;
}) {
  let text = "Changes save automatically";
  let tone = "text-muted-foreground";
  let showCheck = false;

  if (state === "saving") {
    text = "Saving…";
  } else if (state === "saved" && savedAt) {
    tone = "text-[color:var(--profit)]";
    showCheck = true;
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border border-border bg-card/40 px-3 py-2 text-xs",
          tone
        )}
      >
        <Check className="h-3.5 w-3.5" />
        <SavedAgo savedAt={savedAt} />
      </div>
    );
  } else if (state === "error") {
    text = "Couldn't save — check your connection";
    tone = "text-destructive";
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-border bg-card/40 px-3 py-2 text-xs",
        tone
      )}
    >
      {showCheck && <Check className="h-3.5 w-3.5" />}
      {text}
    </div>
  );
});

function SavedAgo({ savedAt }: { savedAt: Date }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const secs = Math.max(0, Math.floor((now - savedAt.getTime()) / 1000));
  const text =
    secs < 2 ? "Saved just now" : `Saved ${secs} second${secs === 1 ? "" : "s"} ago`;
  return <span>{text}</span>;
}
