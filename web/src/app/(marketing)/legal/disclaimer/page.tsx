import type { Metadata } from "next";

export const metadata: Metadata = { title: "Disclaimer" };

export default function DisclaimerPage() {
  return (
    <>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Legal
      </p>
      <h1>Disclaimer</h1>
      <p className="text-sm text-muted-foreground">
        Last updated: 19 April 2026
      </p>

      <h2>Not investment advice</h2>
      <p>
        AutoKillSwitch is a <strong>technology platform</strong>. We do not
        recommend stocks, derivatives, strategies, or timing. Every trading
        decision — including the limits you set — is yours alone.
      </p>

      <h2>Not SEBI-registered</h2>
      <p>
        We are not a SEBI-registered Investment Advisor, Research Analyst,
        Portfolio Manager, or Stock Broker. We are a software tool used at your
        own direction.
      </p>

      <h2>Risk of loss</h2>
      <p>
        Trading in securities, derivatives, and currencies carries substantial
        risk. You can lose part or all of your capital. Past performance is not
        indicative of future results. Do not deposit money you cannot afford to
        lose.
      </p>

      <h2>Execution caveats</h2>
      <ul>
        <li>
          On a trigger, orders execute at market — the fill price may differ
          from the last traded price due to slippage.
        </li>
        <li>
          Broker outages, exchange halts, circuit breakers, and network issues
          may delay or prevent action. We do not guarantee execution.
        </li>
        <li>
          Re-entering positions after a trigger is entirely on you and may cost
          you more than the limit you set.
        </li>
      </ul>

      <h2>No guarantees</h2>
      <p>
        We make no warranty of merchantability, fitness for purpose, or
        profitability. The service is provided &ldquo;as is&rdquo;.
      </p>

      <h2>Your responsibility</h2>
      <p>
        You are responsible for ensuring your trading activity complies with
        SEBI regulations, your employer&apos;s policies (if applicable), and the
        terms of your broker account.
      </p>
    </>
  );
}
