import { Resend } from "resend";
import type { Plan } from "@/lib/pricing";

const FROM =
  process.env.CONTACT_FROM_EMAIL ??
  "AutoKillSwitch <hello@autokillswitch.in>";

function getClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

type SendResult = { id: string; mocked: boolean };

async function deliver(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const client = getClient();
  if (!client) {
    console.log(`[email:mock] -> ${args.to} · ${args.subject}`);
    return { id: `mock-${Date.now()}`, mocked: true };
  }
  const res = await client.emails.send({
    from: FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
  if (res.error) throw new Error(res.error.message);
  return { id: res.data?.id ?? "unknown", mocked: false };
}

function shell(title: string, body: string) {
  return `<!doctype html>
<html>
<body style="margin:0;background:#0A0A0A;color:#FAFAFA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="font-size:13px;letter-spacing:0.2em;color:#A3A3A3;text-transform:uppercase;margin-bottom:8px;">AutoKillSwitch</div>
    <h1 style="font-size:22px;font-weight:600;margin:0 0 16px;">${title}</h1>
    ${body}
    <hr style="border:none;border-top:1px solid #2A2A2A;margin:32px 0;" />
    <p style="font-size:12px;color:#A3A3A3;margin:0;">
      AutoKillSwitch is a technology platform, not a SEBI-registered advisor.
      All trading decisions remain yours.
    </p>
  </div>
</body>
</html>`;
}

// ───── Welcome ──────────────────────────────────────────────────

export function sendWelcome(args: { to: string; name: string }) {
  const subject = "Welcome to AutoKillSwitch";
  const html = shell(
    `Welcome, ${escape(args.name)}.`,
    `
    <p style="color:#E5E5E5;line-height:1.6;">
      Your account is live. Next step: connect your Dhan credentials so the
      kill switch can start protecting your account at the next market open.
    </p>
    <p style="margin:24px 0;">
      <a href="${baseUrl()}/app/onboarding"
         style="display:inline-block;background:#0F9D58;color:#0A0A0A;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">
        Complete setup →
      </a>
    </p>
    <p style="color:#A3A3A3;font-size:13px;line-height:1.6;">
      Takes about three minutes. We only request the Dhan permissions we need
      and nothing more.
    </p>`
  );
  const text = `Welcome, ${args.name}.\n\nComplete setup: ${baseUrl()}/app/onboarding`;
  return deliver({ to: args.to, subject, html, text });
}

// ───── Password reset ──────────────────────────────────────────

export function sendPasswordReset(args: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const subject = "Reset your AutoKillSwitch password";
  const html = shell(
    "Password reset requested",
    `
    <p style="color:#E5E5E5;line-height:1.6;">
      Hi ${escape(args.name)} — we got a request to reset the password on your
      AutoKillSwitch account. If that wasn't you, you can ignore this.
    </p>
    <p style="margin:24px 0;">
      <a href="${escape(args.resetUrl)}"
         style="display:inline-block;background:#0F9D58;color:#0A0A0A;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">
        Set a new password →
      </a>
    </p>
    <p style="color:#A3A3A3;font-size:13px;">This link expires in 1 hour.</p>`
  );
  const text = `Reset your password: ${args.resetUrl}\n(expires in 1 hour)`;
  return deliver({ to: args.to, subject, html, text });
}

// ───── Trigger alert ───────────────────────────────────────────

export function sendTriggerAlert(args: {
  to: string;
  name: string;
  reason: "MAX_LOSS" | "MAX_PROFIT" | "MAX_TRADES" | "TIME_BASED";
  pnl: number;
  tradeCount: number;
  ordersCancelled: number;
  positionsFlattened: number;
  triggeredAt: Date;
}) {
  const reasonText = {
    MAX_LOSS: "Daily loss limit hit",
    MAX_PROFIT: "Daily profit target hit",
    MAX_TRADES: "Max trades per day reached",
    TIME_BASED: "Time-based exit triggered",
  }[args.reason];

  const subject = `Kill switch activated — ${reasonText}`;
  const pnlFormatted = `${args.pnl >= 0 ? "+" : "-"}₹${Math.abs(args.pnl).toLocaleString("en-IN")}`;
  const when = args.triggeredAt.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = shell(
    `Kill switch activated`,
    `
    <p style="color:#E5E5E5;line-height:1.6;">
      Hi ${escape(args.name)} — your kill switch fired at <strong>${escape(when)}</strong>.
      Trading is blocked for the rest of the session.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
      <tr><td style="padding:8px 0;color:#A3A3A3;">Reason</td><td style="text-align:right;">${escape(reasonText)}</td></tr>
      <tr><td style="padding:8px 0;color:#A3A3A3;">P&amp;L at trigger</td><td style="text-align:right;font-family:monospace;">${pnlFormatted}</td></tr>
      <tr><td style="padding:8px 0;color:#A3A3A3;">Trades</td><td style="text-align:right;font-family:monospace;">${args.tradeCount}</td></tr>
      <tr><td style="padding:8px 0;color:#A3A3A3;">Orders cancelled</td><td style="text-align:right;font-family:monospace;">${args.ordersCancelled}</td></tr>
      <tr><td style="padding:8px 0;color:#A3A3A3;">Positions flattened</td><td style="text-align:right;font-family:monospace;">${args.positionsFlattened}</td></tr>
    </table>
    <p style="margin:24px 0;">
      <a href="${baseUrl()}/app/history"
         style="display:inline-block;background:#0F9D58;color:#0A0A0A;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">
        View full timeline →
      </a>
    </p>`
  );
  const text = `Kill switch activated.\n${reasonText} · ${pnlFormatted} · ${args.tradeCount} trades\n${baseUrl()}/app/history`;
  return deliver({ to: args.to, subject, html, text });
}

// ───── Weekly summary ──────────────────────────────────────────

export function sendWeeklySummary(args: {
  to: string;
  name: string;
  weekOf: Date;
  totalPnl: number;
  triggers: number;
  tradingDays: number;
}) {
  const subject = `Your trading week · ${args.weekOf.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
  const pnl = `${args.totalPnl >= 0 ? "+" : "-"}₹${Math.abs(args.totalPnl).toLocaleString("en-IN")}`;
  const pnlColor = args.totalPnl >= 0 ? "#0F9D58" : "#DC2626";

  const html = shell(
    "Your week in review",
    `
    <p style="color:#E5E5E5;line-height:1.6;">Hi ${escape(args.name)} — here's your trading summary.</p>
    <div style="display:flex;gap:12px;margin:20px 0;">
      <div style="flex:1;padding:16px;background:#1A1A1A;border-radius:8px;">
        <div style="font-size:12px;color:#A3A3A3;">Net P&amp;L</div>
        <div style="font-family:monospace;font-size:22px;color:${pnlColor};margin-top:4px;">${pnl}</div>
      </div>
      <div style="flex:1;padding:16px;background:#1A1A1A;border-radius:8px;">
        <div style="font-size:12px;color:#A3A3A3;">Triggers</div>
        <div style="font-family:monospace;font-size:22px;margin-top:4px;">${args.triggers}</div>
      </div>
      <div style="flex:1;padding:16px;background:#1A1A1A;border-radius:8px;">
        <div style="font-size:12px;color:#A3A3A3;">Active days</div>
        <div style="font-family:monospace;font-size:22px;margin-top:4px;">${args.tradingDays}</div>
      </div>
    </div>
    <p style="margin:24px 0;">
      <a href="${baseUrl()}/app/history"
         style="display:inline-block;background:#0F9D58;color:#0A0A0A;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">
        Open dashboard →
      </a>
    </p>`
  );
  const text = `Weekly summary · P&L ${pnl} · ${args.triggers} triggers · ${args.tradingDays} active days`;
  return deliver({ to: args.to, subject, html, text });
}

// ───── Plan changed confirmation ───────────────────────────────

export function sendPlanChanged(args: {
  to: string;
  name: string;
  plan: Plan;
  nextCharge: Date;
}) {
  const subject = `Plan changed to ${args.plan.name}`;
  const nextDate = args.nextCharge.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const html = shell(
    "Plan updated",
    `
    <p style="color:#E5E5E5;line-height:1.6;">
      Hi ${escape(args.name)} — you're now on the <strong>${escape(args.plan.name)}</strong>
      plan (₹${args.plan.monthly}/month, billed ${escape(args.plan.cadence)}).
    </p>
    <p style="color:#E5E5E5;line-height:1.6;">
      Next charge: <strong>${escape(nextDate)}</strong> for ₹${args.plan.total.toLocaleString("en-IN")}.
    </p>
    <p style="margin:24px 0;">
      <a href="${baseUrl()}/app/billing"
         style="display:inline-block;background:#0F9D58;color:#0A0A0A;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600;">
        View billing →
      </a>
    </p>`
  );
  const text = `Plan changed to ${args.plan.name}. Next charge ${nextDate}.`;
  return deliver({ to: args.to, subject, html, text });
}

// ───── helpers ─────────────────────────────────────────────────

function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  );
}

function escape(v: string) {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
