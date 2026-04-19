import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Legal
      </p>
      <h1>Terms of Service</h1>
      <p className="text-sm text-muted-foreground">
        Last updated: 19 April 2026 · Template — to be reviewed by counsel
        before commercial launch.
      </p>

      <h2>1. Who we are</h2>
      <p>
        &ldquo;AutoKillSwitch&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; refers
        to the operator of autokillswitch.in. We provide a technology platform
        that enforces user-configured trading limits on connected broker
        accounts. We are <strong>not</strong> a SEBI-registered investment
        advisor and do not provide financial advice.
      </p>

      <h2>2. Your account</h2>
      <p>
        You must be at least 18, legally competent to enter contracts in India,
        and the owner of the broker account you connect. You are responsible
        for keeping your login credentials secure.
      </p>

      <h2>3. What the service does — and doesn&apos;t</h2>
      <ul>
        <li>
          It monitors your connected Dhan account during market hours, polling
          at an interval we determine.
        </li>
        <li>
          On a limit breach it may cancel pending orders, square-off open
          positions, and activate the broker&apos;s native kill switch.
        </li>
        <li>
          It will never place new opening trades on your behalf.
        </li>
        <li>
          It does not guarantee execution speed, slippage outcomes, connectivity
          to the broker, or profitability.
        </li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>
        You agree not to reverse-engineer the service, resell access, or use it
        to interfere with other users or with the broker&apos;s systems.
      </p>

      <h2>5. Fees and refunds</h2>
      <p>
        Fees are shown in INR, exclusive of GST, and billed via Razorpay. A
        seven-day money-back guarantee applies to your first payment on any
        plan. Subsequent cycles are non-refundable once the period begins.
      </p>

      <h2>6. Limitation of liability</h2>
      <p>
        To the fullest extent allowed by law, our aggregate liability for any
        claim is limited to the fees you paid us in the three months preceding
        the claim. We are not liable for indirect, consequential, or lost-profit
        damages.
      </p>

      <h2>7. Termination</h2>
      <p>
        You may cancel at any time from the Billing page. We may suspend or
        terminate accounts that breach these terms or applicable law.
      </p>

      <h2>8. Governing law</h2>
      <p>
        These terms are governed by the laws of India. Courts in Bengaluru have
        exclusive jurisdiction.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions? Email <strong>legal@autokillswitch.in</strong>.
      </p>
    </>
  );
}
