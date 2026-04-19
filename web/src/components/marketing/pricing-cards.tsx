import Link from "next/link";
import { Button } from "@/components/ui/button";
import { plans } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function PricingCards({ eyebrow = true }: { eyebrow?: boolean }) {
  return (
    <section id="pricing" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        {eyebrow && (
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Pricing
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Same product. Cheaper the longer you commit.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every plan includes every feature. The only variable is price.
            </p>
          </div>
        )}

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => {
            const featured = p.id === "annual";
            return (
              <div
                key={p.id}
                className={cn(
                  "flex flex-col rounded-xl border p-6",
                  featured
                    ? "border-[color:var(--brand-emerald)]/60 bg-[color:var(--brand-emerald)]/5"
                    : "border-border bg-card/40"
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide">
                    {p.name}
                  </h3>
                  {p.badge && (
                    <span className="rounded-full border border-[color:var(--brand-gold)]/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[color:var(--brand-gold)]">
                      {p.badge}
                    </span>
                  )}
                </div>
                <div className="mt-6">
                  <div className="flex items-baseline gap-1 font-mono tabular-nums">
                    <span className="text-3xl font-semibold">₹{p.monthly}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  <p className="mt-2 font-mono text-xs tabular-nums text-muted-foreground">
                    ₹{p.total.toLocaleString("en-IN")} {p.cadence}
                  </p>
                </div>
                <Button
                  asChild
                  className="mt-8"
                  variant={featured ? "default" : "outline"}
                >
                  <Link href={`/signup?plan=${p.id}`}>Start</Link>
                </Button>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Prices exclusive of GST · 7-day money-back guarantee · Cancel anytime
        </p>
      </div>
    </section>
  );
}
