"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Init = {
  emailOnTrigger: boolean;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  dailySummaryEnabled: boolean;
};

export function NotificationsForm({ initial }: { initial: Init }) {
  const [v, setV] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "err">("idle");

  function patch<K extends keyof Init>(k: K, val: Init[K]) {
    setV((p) => ({ ...p, [k]: val }));
  }

  async function save() {
    setStatus("saving");
    const res = await fetch("/api/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailOnTrigger: v.emailOnTrigger,
        telegramEnabled: v.telegramEnabled,
        telegramBotToken: v.telegramBotToken || null,
        telegramChatId: v.telegramChatId || null,
        dailySummaryEnabled: v.dailySummaryEnabled,
      }),
    });
    setStatus(res.ok ? "saved" : "err");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>
            We&apos;ll email you when the killswitch fires.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ToggleRow
            label="Email on trigger"
            desc="An itemised summary delivered within 30 seconds."
            checked={v.emailOnTrigger}
            onChange={(c) => patch("emailOnTrigger", c)}
          />
          <div className="pt-3">
            <ToggleRow
              label="Daily summary (morning)"
              desc="Yesterday's P&L, trigger count, and next-day limits."
              checked={v.dailySummaryEnabled}
              onChange={(c) => patch("dailySummaryEnabled", c)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telegram</CardTitle>
          <CardDescription>
            Live warnings at 80% of your limit and instant trigger pings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            label="Enable Telegram alerts"
            desc="Requires a bot token + chat ID from @BotFather."
            checked={v.telegramEnabled}
            onChange={(c) => patch("telegramEnabled", c)}
          />
          {v.telegramEnabled && (
            <div className="space-y-3 rounded-md border border-border bg-background/50 p-4">
              <div className="grid gap-2">
                <Label htmlFor="tg-bot">Bot token</Label>
                <Input
                  id="tg-bot"
                  type="password"
                  value={v.telegramBotToken}
                  onChange={(e) => patch("telegramBotToken", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tg-chat">Chat ID</Label>
                <Input
                  id="tg-chat"
                  value={v.telegramChatId}
                  onChange={(e) => patch("telegramChatId", e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save changes"}
        </Button>
        {status === "saved" && (
          <span className="text-xs text-[color:var(--profit)]">Saved.</span>
        )}
        {status === "err" && (
          <span className="text-xs text-destructive">Couldn&apos;t save.</span>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
