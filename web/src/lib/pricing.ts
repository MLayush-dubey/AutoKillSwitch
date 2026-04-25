export type Plan = {
  id: "monthly" | "quarterly" | "half_yearly" | "annual";
  name: string;
  monthly: number;         // per-month effective price (INR)
  total: number;           // total billed at cycle (INR)
  cadence: string;         // "billed monthly"
  cycleMonths: number;
  badge?: string;
};

export const plans: Plan[] = [
  {
    id: "monthly",
    name: "Monthly",
    monthly: 999,
    total: 999,
    cadence: "billed monthly",
    cycleMonths: 1,
  },
  {
    id: "quarterly",
    name: "Quarterly",
    monthly: 900,
    total: 2700,
    cadence: "billed quarterly",
    cycleMonths: 3,
  },
  {
    id: "half_yearly",
    name: "Half-yearly",
    monthly: 750,
    total: 4500,
    cadence: "billed every 6 months",
    cycleMonths: 6,
  },
  {
    id: "annual",
    name: "Annual",
    monthly: 666,
    total: 8000,
    cadence: "billed yearly",
    cycleMonths: 12,
    badge: "Save 33%",
  },
];

export const includedFeatures = [
  "Real-time monitoring during market hours",
  "Automatic order cancellation + position flatten",
  "Daily loss, profit, and trade-count limits",
  "Warning alerts at 80% of your limits",
  "Telegram + email notifications",
  "Full audit trail and history",
  "Dhan static-IP whitelist handled for you",
  "Cancel anytime — data deleted within 30 days",
];
