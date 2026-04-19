import { RotateCw, Clock, Flame } from "lucide-react";

const problems = [
  {
    icon: RotateCw,
    title: "Revenge trading after a loss",
    body: "One bad trade spirals into five, because you're trying to get even.",
  },
  {
    icon: Clock,
    title: "Not booking profits when you should",
    body: "The number in your P&L is real until the second you don't take it.",
  },
  {
    icon: Flame,
    title: "Overtrading on high-emotion days",
    body: "Big news, a red open, a friend's tip — the day turns into noise and you keep clicking.",
  },
];

export function ProblemSection() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <h2 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
          Your biggest enemy in trading isn&apos;t the market. It&apos;s you.
        </h2>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {problems.map((p) => (
            <div key={p.title} className="rounded-lg border border-border bg-card/40 p-6">
              <p.icon className="h-5 w-5 text-muted-foreground" />
              <h3 className="mt-4 text-base font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-lg border border-border bg-card/20 p-8 md:p-12">
          <p className="text-2xl font-medium tracking-tight md:text-3xl">
            <span className="text-[color:var(--loss)]">78% of retail traders lose money.</span>{" "}
            <span className="text-muted-foreground">
              Most blame the market. The evidence says it&apos;s mostly poor self-discipline.
            </span>
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            SEBI study, 2023
          </p>
        </div>
      </div>
    </section>
  );
}
