import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Legal
      </p>
      <h1>Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">
        Last updated: 19 April 2026 · Template — subject to DPDP Act 2023 review.
      </p>

      <h2>1. What we collect</h2>
      <ul>
        <li>Account: name, email, hashed password (or Google OAuth identifier).</li>
        <li>
          Broker credentials: Dhan Client ID, Access Token, API Key, API Secret
          — stored encrypted at rest.
        </li>
        <li>
          Operational data: your configured rules, trigger history, and audit
          logs of actions the monitor took.
        </li>
        <li>Billing metadata from Razorpay (we never receive card numbers).</li>
      </ul>

      <h2>2. What we don&apos;t collect</h2>
      <ul>
        <li>We do not read chats, emails, or non-trading activity.</li>
        <li>We don&apos;t sell your data to anyone. Ever.</li>
      </ul>

      <h2>3. How we use it</h2>
      <p>
        Solely to run the service you paid for: enforce your rules, send you
        alerts, generate invoices, and support you.
      </p>

      <h2>4. Sharing</h2>
      <ul>
        <li>
          <strong>Dhan</strong> — to place the actions you authorise (cancel,
          square-off, activate kill switch).
        </li>
        <li>
          <strong>Razorpay</strong> — for payment processing.
        </li>
        <li>
          <strong>Resend, infrastructure providers (Vercel, database host)</strong>{" "}
          — as processors, under confidentiality obligations.
        </li>
      </ul>

      <h2>5. Retention</h2>
      <p>
        We delete your broker credentials within 30 days of cancellation. Audit
        logs and invoices are retained for the period required by Indian tax
        and financial record-keeping law.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Under the DPDP Act you may request access, correction, or deletion of
        your personal data. Email <strong>privacy@autokillswitch.in</strong>.
      </p>

      <h2>7. Security</h2>
      <p>
        TLS in transit, AES-256 at rest for credentials, hashed passwords
        (bcrypt), and audit trails for every privileged action.
      </p>

      <h2>8. Changes</h2>
      <p>
        We&apos;ll update this page and email you at least 14 days before
        material changes take effect.
      </p>
    </>
  );
}
