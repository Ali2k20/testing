import type { PlanTier } from "@/lib/supabase/database.types";

export const PLAN_LIMITS: Record<PlanTier, { bots: number }> = {
  starter: { bots: 1 },
  growth: { bots: 5 },
  enterprise: { bots: Number.POSITIVE_INFINITY },
};
