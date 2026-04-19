"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function PreferencesForm({
  initial,
}: {
  initial: { themePreference: string };
}) {
  const [theme, setTheme] = useState(initial.themePreference);

  function changeTheme(v: string) {
    setTheme(v);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (v === "light") root.classList.remove("dark");
      else if (v === "dark") root.classList.add("dark");
      else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", prefersDark);
      }
    }
    // Persist server-side silently; failure is non-fatal for a preference.
    fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themePreference: v }),
    }).catch(() => null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Theme, timezone, and language.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-sm">Theme</Label>
          <div className="mt-2 flex gap-2">
            {["dark", "light", "system"].map((v) => (
              <button
                key={v}
                onClick={() => changeTheme(v)}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                  theme === v
                    ? "border-[color:var(--brand-emerald)] bg-[color:var(--brand-emerald)]/10 text-[color:var(--brand-emerald)]"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-sm">Timezone</Label>
          <div className="mt-2 text-sm text-muted-foreground">
            Asia/Kolkata (locked — NSE only trades in IST)
          </div>
        </div>
        <div>
          <Label className="text-sm">Language</Label>
          <div className="mt-2 text-sm text-muted-foreground">
            English (only option for now)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
