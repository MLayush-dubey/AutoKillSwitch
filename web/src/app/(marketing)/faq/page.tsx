import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { billingFaq, landingFaq } from "@/lib/faq-data";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Everything traders ask about AutoKillSwitch.",
};

const sections = [
  { title: "Product", items: landingFaq },
  { title: "Billing", items: billingFaq },
];

export default function FaqPage() {
  return (
    <section>
      <div className="mx-auto max-w-3xl px-6 py-20">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Frequently asked
        </span>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
          Answers, not marketing.
        </h1>
        <p className="mt-6 text-muted-foreground">
          If something you need isn&apos;t here, email us. We respond within a
          business day.
        </p>

        {sections.map((s) => (
          <div key={s.title} className="mt-12">
            <h2 className="text-lg font-semibold tracking-tight text-foreground/90">
              {s.title}
            </h2>
            <Accordion type="single" collapsible className="mt-4">
              {s.items.map((item, i) => (
                <AccordionItem key={i} value={`${s.title}-${i}`}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent>{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </section>
  );
}
