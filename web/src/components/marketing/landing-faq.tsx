import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { landingFaq } from "@/lib/faq-data";

export function LandingFaq() {
  return (
    <section id="faq" className="border-b border-border">
      <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Questions
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            What traders ask us.
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-12">
          {landingFaq.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent>{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
