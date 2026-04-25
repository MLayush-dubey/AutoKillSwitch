import { z } from "zod";

export const rulesSchema = z.object({
  maxDailyLoss: z.number().int().min(100).max(50_000),
  maxDailyProfit: z.number().int().min(100).max(100_000),
  maxTrades: z.number().int().min(1).max(100),
  warningThresholdPct: z.number().int().min(50).max(99),
  telegramWarnings: z.boolean(),
  timeBasedExit: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  perTradeLossLimit: z.number().int().min(0).max(50_000).nullable().optional(),
  consecutiveLossLimit: z.number().int().min(0).max(20).nullable().optional(),
});

export type RulesInput = z.infer<typeof rulesSchema>;

export const defaultRules: RulesInput = {
  maxDailyLoss: 5000,
  maxDailyProfit: 10000,
  maxTrades: 20,
  warningThresholdPct: 80,
  telegramWarnings: false,
  timeBasedExit: null,
  perTradeLossLimit: null,
  consecutiveLossLimit: null,
};
