import Link from "next/link";

const cols: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/disclaimer", label: "Disclaimer" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-3">
            <div className="text-base font-semibold">AutoKillSwitch</div>
            <p className="text-sm text-muted-foreground">
              Automated risk-control for Dhan traders.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title} className="space-y-3">
              <div className="text-sm font-semibold">{c.title}</div>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          <p>
            AutoKillSwitch is a technology platform. We are not a SEBI-registered
            investment advisor. All trading decisions are yours.{" "}
            <Link href="/legal/disclaimer" className="underline hover:text-foreground">
              Read full disclaimer →
            </Link>
          </p>
          <p className="mt-2">© {new Date().getFullYear()} AutoKillSwitch.</p>
        </div>
      </div>
    </footer>
  );
}
