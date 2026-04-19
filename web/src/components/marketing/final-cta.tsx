import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
        <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Trade with discipline. Starting today.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
          Set your rules once. Let the monitor do the hard part — the part
          where it matters most.
        </p>
        <Button size="lg" asChild className="mt-8">
          <Link href="/signup">Start for ₹666/month</Link>
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          7-day money-back guarantee · Cancel anytime
        </p>
      </div>
    </section>
  );
}
