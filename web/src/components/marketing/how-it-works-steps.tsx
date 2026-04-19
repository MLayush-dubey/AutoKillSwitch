import { Plug, SlidersHorizontal, ShieldCheck } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Plug,
    time: "1 minute",
    title: "Connect your Dhan account",
    body: "Link via secure token. We only request the permissions we need — read positions, cancel orders, square-off, activate Dhan's kill switch.",
  },
  {
    n: "02",
    icon: SlidersHorizontal,
    time: "2 minutes",
    title: "Set your rules",
    body: "Daily loss limit, profit target, max trades. You decide what counts as \u201Cstop\u201D, we handle the rest.",
  },
  {
    n: "03",
    icon: ShieldCheck,
    time: "Rest of your life",
    title: "Trade normally",
    body: "We monitor silently. When you hit a limit, we cancel pending orders, exit positions, and block trading for the day.",
  },
];

export function HowItWorksSteps() {
  return (
    <section id="how-it-works" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Three steps. Then you go back to your actual job — trading.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="flex flex-col rounded-lg border border-border bg-card/40 p-6"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {s.n}
                </span>
                <span className="text-xs text-muted-foreground">{s.time}</span>
              </div>
              <s.icon className="mt-6 h-6 w-6 text-[color:var(--brand-emerald)]" />
              <h3 className="mt-6 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
