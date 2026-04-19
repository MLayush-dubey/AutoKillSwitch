import { DashboardPreview } from "./dashboard-preview";

export function DashboardShowcase() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            The dashboard
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Your trading discipline, visualized.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Today&apos;s P&amp;L, your limit progress, and the monitor&apos;s decisions —
            in one quiet screen.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
