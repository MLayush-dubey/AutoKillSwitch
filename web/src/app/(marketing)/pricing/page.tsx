import Link from "next/link";
import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PricingCards } from "@/components/marketing/pricing-cards";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { includedFeatures } from "@/lib/pricing";
import { billingFaq } from "@/lib/faq-data";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "AutoKillSwitch pricing — starts at ₹666/month on the annual plan. Every plan includes every feature.",
};

export default function PricingPage() {
  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center md:py-24">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Pricing
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Same product. Cheaper the longer you commit.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            No tiered feature gates. Pick a cycle that matches your confidence.
          </p>
        </div>
      </section>

      <PricingCards eyebrow={false} />

      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Every plan includes
          </h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {includedFeatures.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-emerald)]" />
                <span className="text-foreground/90">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Billing questions
          </h2>
          <Accordion type="single" collapsible className="mt-8">
            {billingFaq.map((item, i) => (
              <AccordionItem key={i} value={`bill-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-border bg-card/40 p-8 md:flex-row md:items-center md:p-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Enterprise / prop desk
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Managing a trading firm or prop desk? We offer team seats,
                per-trader rules, and dedicated support. Let&apos;s talk.
              </p>
            </div>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact?topic=enterprise">Contact sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
