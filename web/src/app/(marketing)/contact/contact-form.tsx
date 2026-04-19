"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContactForm() {
  const search = useSearchParams();
  const initialTopic = search.get("topic") ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(initialTopic);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setStatus("idle");
    setErrorMsg(null);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, topic: topic || undefined, message }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: "Send failed." }));
      setStatus("err");
      setErrorMsg(data.message ?? "Send failed.");
      return;
    }

    setStatus("ok");
    setName("");
    setEmail("");
    setTopic("");
    setMessage("");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-card/40 p-6 md:p-8"
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="c-name">Name</Label>
            <Input
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-email">Email</Label>
            <Input
              id="c-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-topic">Topic (optional)</Label>
          <Input
            id="c-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Sales, enterprise, bug, feedback…"
            maxLength={50}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-message">Message</Label>
          <textarea
            id="c-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={5}
            rows={6}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {status === "err" && (
          <p className="text-sm text-destructive">{errorMsg}</p>
        )}
        {status === "ok" && (
          <p className="text-sm text-[color:var(--profit)]">
            Thanks — we&apos;ll reply within one business day.
          </p>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
