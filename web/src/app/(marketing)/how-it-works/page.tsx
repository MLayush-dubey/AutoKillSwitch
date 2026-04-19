import Link from "next/link";
import type { Metadata } from "next";
import { HowItWorksSteps } from "@/components/marketing/how-it-works-steps";
import { DashboardShowcase } from "@/components/marketing/dashboard-showcase";
import { FinalCta } from "@/components/marketing/final-cta";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Connect Dhan, set your rules, trade normally. AutoKillSwitch does the rest.",
};

const detailedSteps = [
  {
    n: "01",
    title: "Secure connection to Dhan",
    body: "Paste your Dhan Client ID, Access Token, API Key, and API Secret. Credentials are encrypted at rest. Tokens are auto-refreshed — no daily logins.",
    bullets: [
      "Static IP whitelisted on our side (91.108.*)",
      "Read-only polling by default; writes only on trigger",
      "Disconnect in one click, anytime",
    ],
  },
  {
    n: "02",
    title: "Rules tuned to your style",
    body: "Start from defaults that match most intraday traders, then tighten. Limits apply per day; the day resets at 9:00 IST.",
    bullets: [
      "Max daily loss · max daily profit · max trade count",
      "Warning thresholds at 80% of each limit",
      "Optional: time-based exit, per-trade cap, consecutive-loss stop",
    ],
  },
  {
    n: "03",
    title: "What happens on trigger",
    body: "When any limit is breached, the monitor doesn't just alert. It acts.",
    bullets: [
      "Cancel every pending order",
      "Square-off every open position (market order)",
      "Activate Dhan's native kill switch for the rest of the day",
      "Log everything to your audit trail",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            How it works
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            A risk engine you set up once, then forget.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Monitoring runs on our servers during market hours. Your laptop
            being off, your Wi-Fi dying, you falling asleep — none of that
            affects whether the rules fire.
          </p>
        </div>
      </section>

      <HowItWorksSteps />

      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl space-y-16 px-6 py-20 md:py-24">
          {detailedSteps.map((s) => (
            <div
              key={s.n}
              className="grid gap-6 md:grid-cols-[120px_1fr] md:gap-10"
            >
              <div className="font-mono text-sm tabular-nums text-muted-foreground">
                {s.n}
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {s.title}
                </h2>
                <p className="mt-3 text-muted-foreground">{s.body}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {s.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex gap-3 text-foreground/90 before:mt-2 before:block before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-[color:var(--brand-emerald)]"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <DashboardShowcase />

      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to see it in your account?
          </h2>
          <p className="mt-4 text-muted-foreground">
            10-minute setup. 7-day money-back guarantee.
          </p>
          <Button size="lg" asChild className="mt-8">
            <Link href="/signup">Start for ₹666/month</Link>
          </Button>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
