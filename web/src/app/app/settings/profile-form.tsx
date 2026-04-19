"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  initial,
}: {
  initial: { name: string; email: string; phone: string };
}) {
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "err">("idle");

  async function save() {
    setStatus("saving");
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone: phone || null }),
    });
    setStatus(res.ok ? "saved" : "err");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          This is how you appear inside the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="p-name">Name</Label>
          <Input
            id="p-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="p-email">Email</Label>
          <Input id="p-email" value={initial.email} disabled />
          <p className="text-xs text-muted-foreground">
            Changing email isn&apos;t supported yet — contact support.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="p-phone">Phone (optional)</Label>
          <Input
            id="p-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 …"
          />
        </div>
        <div className="flex items-center gap-3 pt-2">
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
      </CardContent>
    </Card>
  );
}
