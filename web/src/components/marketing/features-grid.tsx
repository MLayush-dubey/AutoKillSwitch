import {
  Activity,
  Zap,
  Bell,
  ScrollText,
  Wrench,
  XCircle,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Real-time monitoring",
    body: "Polls your account every 10 seconds during market hours. Zero delay when limits are breached.",
  },
  {
    icon: Zap,
    title: "Automatic square-off",
    body: "When triggered, we don't just alert. We cancel pending orders, exit positions, and lock the account.",
  },
  {
    icon: Bell,
    title: "Smart warnings",
    body: "Telegram alerts at 80% of your limit so you have a chance to course-correct before we intervene.",
  },
  {
    icon: ScrollText,
    title: "Full audit trail",
    body: "Every decision logged. See exactly why, when, and how each action happened.",
  },
  {
    icon: Wrench,
    title: "Zero setup complexity",
    body: "One-time connection. We handle the static-IP whitelist, token renewal, and proxy infrastructure.",
  },
  {
    icon: XCircle,
    title: "Cancel anytime",
    body: "No lock-in. Stop your subscription and your data is deleted within 30 days.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            What&apos;s inside
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Features that do their job and get out of the way.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-border bg-card/40 p-6"
            >
              <f.icon className="h-5 w-5 text-[color:var(--brand-emerald)]" />
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
