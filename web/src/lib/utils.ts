import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Indian number formatting: ₹1,23,456.78 (lakhs/crores grouping).
 * Using en-IN locale gives correct Indian digit grouping.
 */
export function formatINR(value: number, opts: { showSign?: boolean } = {}) {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = value < 0 ? "-" : opts.showSign ? "+" : "";
  return `${sign}₹${formatted}`;
}
