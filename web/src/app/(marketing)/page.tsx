import Link from "next/link";
import { Button } from "@/components/ui/button";

// Week 1 foundation placeholder. The full 8-section landing page is Week 2.
export default function LandingPage() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col px-6 py-24">
      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Built for disciplined traders
      </span>
      <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl">
        Stop yourself from blowing up your account.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        AutoKillSwitch enforces your daily loss, profit, and trade limits on
        your Dhan account — automatically. No willpower required.
      </p>
      <div className="mt-8 flex items-center gap-3">
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

      <div className="mt-24 rounded-lg border border-dashed border-border p-8 text-sm text-muted-foreground">
        Week 1 foundation — full landing page sections ship in Week 2.
      </div>
    </section>
  );
}
