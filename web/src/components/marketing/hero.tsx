import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardPreview } from "./dashboard-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,157,88,0.08),transparent_60%)]"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Built for disciplined traders
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
            Stop yourself from blowing up your account.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
            AutoKillSwitch enforces your daily loss, profit, and trade limits on
            your Dhan account — automatically. No willpower required.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">Start for ₹666/month</Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href="/how-it-works">See how it works →</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Integrates with Dhan. 10-minute setup. Cancel anytime.
          </p>
        </div>

        <div className="md:pl-6">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
