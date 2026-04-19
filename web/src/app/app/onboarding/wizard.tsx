"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn, formatINR } from "@/lib/utils";
import type { RulesInput } from "@/lib/rules";

type Step = 0 | 1 | 2 | 3 | 4;
const titles = [
  "Welcome",
  "Connect Dhan",
  "Set your rules",
  "Notifications",
  "All set",
];

export function OnboardingWizard({
  initialRules,
  brokerConnected,
  alreadyOnboarded,
}: {
  initialRules: RulesInput;
  brokerConnected: boolean;
  alreadyOnboarded: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(alreadyOnboarded ? 4 : brokerConnected ? 2 : 0);

  // Step 1 — Dhan creds
  const [clientId, setClientId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connected, setConnected] = useState(brokerConnected);

  // Step 2 — Rules
  const [rules, setRules] = useState<RulesInput>(initialRules);
  const [rulesSaving, setRulesSaving] = useState(false);

  // Step 3 — Notifications
  const [enableTelegram, setEnableTelegram] = useState(false);
  const [tgBot, setTgBot] = useState("");
  const [tgChat, setTgChat] = useState("");
  const [savingNotifs, setSavingNotifs] = useState(false);

  const [finishing, setFinishing] = useState(false);

  async function connectBroker() {
    setConnecting(true);
    setConnectError(null);
    const res = await fetch("/api/broker/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, accessToken, apiKey, apiSecret }),
    });
    setConnecting(false);
    if (!res.ok) {
      setConnectError("Please fill in all broker fields.");
      return;
    }
    setConnected(true);
    setStep(2);
  }

  async function saveRulesAndNext() {
    setRulesSaving(true);
    await fetch("/api/rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rules),
    });
    setRulesSaving(false);
    setStep(3);
  }

  async function saveNotifsAndNext() {
    setSavingNotifs(true);
    if (enableTelegram && (tgBot || tgChat)) {
      await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramEnabled: true,
          telegramBotToken: tgBot,
          telegramChatId: tgChat,
        }),
      });
    }
    setSavingNotifs(false);
    setStep(4);
  }

  async function finish() {
    setFinishing(true);
    await fetch("/api/onboarding/complete", { method: "POST" });
    router.push("/app");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Let&apos;s get you set up in 3 minutes.</CardTitle>
            <CardDescription>
              You&apos;ll connect your Dhan account, set your daily limits, and
              (optionally) wire up Telegram alerts. You can always change all of
              this later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setStep(1)}>
              Start <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Connect your Dhan account</CardTitle>
            <CardDescription>
              Find these in your Dhan developer console. We store them
              encrypted. Credentials never leave our server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="cid">Client ID</Label>
              <Input
                id="cid"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="1102XXXXXXX"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="at">Access Token</Label>
              <Input
                id="at"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                type="password"
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ak">API Key</Label>
                <Input
                  id="ak"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="as">API Secret</Label>
                <Input
                  id="as"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  type="password"
                />
              </div>
            </div>
            {connectError && (
              <p className="text-sm text-destructive">{connectError}</p>
            )}
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={connectBroker} disabled={connecting}>
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
                  </>
                ) : (
                  <>
                    Connect <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Need help?{" "}
              <a
                href="https://dhanhq.co/docs/"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-foreground"
              >
                Dhan API docs →
              </a>
            </p>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Set your rules</CardTitle>
            <CardDescription>
              Start from these defaults. Most traders tighten these further in
              the first week.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <MiniSlider
              label="Max daily loss"
              display={`-${formatINR(rules.maxDailyLoss)}`}
              min={100}
              max={50000}
              step={100}
              value={rules.maxDailyLoss}
              onChange={(v) => setRules((p) => ({ ...p, maxDailyLoss: v }))}
              tone="loss"
            />
            <MiniSlider
              label="Max daily profit"
              display={`+${formatINR(rules.maxDailyProfit)}`}
              min={100}
              max={100000}
              step={100}
              value={rules.maxDailyProfit}
              onChange={(v) => setRules((p) => ({ ...p, maxDailyProfit: v }))}
              tone="profit"
            />
            <MiniSlider
              label="Max trades per day"
              display={`${rules.maxTrades}`}
              min={1}
              max={100}
              step={1}
              value={rules.maxTrades}
              onChange={(v) => setRules((p) => ({ ...p, maxTrades: v }))}
            />
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={saveRulesAndNext} disabled={rulesSaving}>
                {rulesSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Get a Telegram ping when we&apos;re about to intervene. Skip if you
              want to set this up later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Enable Telegram alerts</div>
                <div className="text-xs text-muted-foreground">
                  Create a bot via @BotFather and paste credentials below.
                </div>
              </div>
              <Switch
                checked={enableTelegram}
                onCheckedChange={setEnableTelegram}
              />
            </div>
            {enableTelegram && (
              <div className="space-y-3 rounded-md border border-border bg-background/50 p-4">
                <div className="grid gap-2">
                  <Label htmlFor="tgbot">Bot token</Label>
                  <Input
                    id="tgbot"
                    value={tgBot}
                    onChange={(e) => setTgBot(e.target.value)}
                    type="password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tgchat">Chat ID</Label>
                  <Input
                    id="tgchat"
                    value={tgChat}
                    onChange={(e) => setTgChat(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(2)}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(4)}>
                  Skip
                </Button>
                <Button onClick={saveNotifsAndNext} disabled={savingNotifs}>
                  {savingNotifs ? "Saving…" : "Continue"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>You&apos;re all set.</CardTitle>
            <CardDescription>
              Monitoring activates at market open tomorrow (09:15 IST). You can
              change any rule at any time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <Completed label="Dhan account connected" ok={connected} />
              <Completed label="Rules configured" ok />
              <Completed
                label={enableTelegram ? "Telegram alerts ready" : "Notifications (skipped)"}
                ok
              />
            </ul>
            <div className="flex gap-2">
              <Button onClick={finish} disabled={finishing}>
                {finishing ? "Finishing…" : "Go to dashboard"}
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/app/rules">Review rules</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  return (
    <ol className="flex items-center gap-2 text-xs">
      {titles.map((title, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <li key={i} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium tabular-nums",
                active
                  ? "border-[color:var(--brand-emerald)] bg-[color:var(--brand-emerald)] text-primary-foreground"
                  : done
                    ? "border-[color:var(--brand-emerald)] bg-[color:var(--brand-emerald)]/10 text-[color:var(--brand-emerald)]"
                    : "border-border text-muted-foreground"
              )}
            >
              {done ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden md:inline",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {title}
            </span>
            {i < titles.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1",
                  done ? "bg-[color:var(--brand-emerald)]" : "bg-border"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Completed({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <Check
        className={cn(
          "h-4 w-4",
          ok ? "text-[color:var(--profit)]" : "text-muted-foreground"
        )}
      />
      {label}
    </li>
  );
}

function MiniSlider({
  label,
  display,
  value,
  onChange,
  min,
  max,
  step,
  tone,
}: {
  label: string;
  display: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  tone?: "profit" | "loss";
}) {
  const color =
    tone === "profit"
      ? "text-[color:var(--profit)]"
      : tone === "loss"
        ? "text-[color:var(--loss)]"
        : "text-foreground";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className={`${color} font-mono text-sm tabular-nums`}>{display}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}
