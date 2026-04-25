export type FaqItem = { q: string; a: string };

/** Short set used inline on the landing page. */
export const landingFaq: FaqItem[] = [
  {
    q: "Is my trading data safe?",
    a: "Your Dhan API credentials are encrypted at rest and never shared. We poll your account read-only most of the time and only send write requests (cancel / exit / kill-switch) when your configured limits are breached.",
  },
  {
    q: "Can I override the kill switch once triggered?",
    a: "Yes — from the dashboard you can manually disarm the day's block. We log every override so you have an honest audit trail of your own behaviour.",
  },
  {
    q: "What happens if my internet goes down?",
    a: "Monitoring runs on our servers, not your machine. Your rules keep enforcing even if your laptop is off. If our servers can't reach Dhan for any reason, we alert you instantly over Telegram and email.",
  },
  {
    q: "Do you have access to place new trades on my account?",
    a: "No. The only write actions we ever perform are (a) cancel open orders, (b) square-off existing positions, and (c) activate Dhan's native kill switch. We cannot and will not open new positions.",
  },
  {
    q: "How do I cancel?",
    a: "One click in Billing. Your protection remains active until the end of the current cycle. After cancellation we delete your credentials within 30 days.",
  },
  {
    q: "What brokers do you support?",
    a: "Dhan only, today. Zerodha and Upstox are on the roadmap — based on customer demand.",
  },
  {
    q: "Does this work for F&O and equity?",
    a: "Both. We monitor realised + unrealised P&L across the full account, not per-segment.",
  },
  {
    q: "Is AutoKillSwitch SEBI-approved?",
    a: "AutoKillSwitch is a technology platform, not a SEBI-registered investment advisor. We don't advise on trades; we enforce limits that you choose.",
  },
];

export const billingFaq: FaqItem[] = [
  {
    q: "Do prices include GST?",
    a: "Prices shown are exclusive of GST. 18% GST is added at checkout. You'll receive a GST-compliant invoice with every payment.",
  },
  {
    q: "Can I switch plans mid-cycle?",
    a: "Yes. Upgrades are prorated immediately. Downgrades take effect at the end of your current billing cycle.",
  },
  {
    q: "Do you offer refunds?",
    a: "We offer a 7-day money-back guarantee on any plan. After that, cancel anytime and you keep the product until the end of the paid period.",
  },
  {
    q: "Which payment methods are supported?",
    a: "All major Indian cards, UPI, net-banking, and wallets via Razorpay. International cards also work.",
  },
];
