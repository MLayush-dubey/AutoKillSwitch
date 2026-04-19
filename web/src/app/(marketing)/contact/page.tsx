import { Suspense } from "react";
import type { Metadata } from "next";
import { Mail, Clock } from "lucide-react";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions about AutoKillSwitch? Pricing, enterprise, or a bug — reach us here.",
};

export default function ContactPage() {
  return (
    <section>
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-[1fr_420px]">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Contact
            </span>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Talk to a human.
            </h1>
            <p className="mt-6 text-muted-foreground">
              We read every message. Whether you&apos;re evaluating the product,
              running a prop desk, or just hit a bug — write in and we&apos;ll
              reply within a business day.
            </p>

            <div className="mt-10 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <div className="font-medium text-foreground">
                    hello@autokillswitch.in
                  </div>
                  <div className="text-muted-foreground">
                    For general + sales inquiries
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <div className="font-medium text-foreground">
                    Mon–Fri, 10:00–19:00 IST
                  </div>
                  <div className="text-muted-foreground">
                    Response within one business day
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Suspense fallback={<div className="rounded-xl border border-border bg-card/40 p-6 text-sm text-muted-foreground md:p-8">Loading…</div>}>
            <ContactForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
