import {
  type PlanTierLimits,
  type PlanWindowLimits,
  getDisplayMarketingPlans
} from "@/lib/plan-display";
import { getBackendBaseUrl } from "@/lib/server/backend-url";

type JsonObject = Record<string, unknown>;

export interface PublicPlansSnapshot extends PlanWindowLimits {
  burstWindowMs: number;
  burstMax: number;
  defaultRequestCost: number;
  planTiers: PlanTierLimits[];
}

const FALLBACK_PUBLIC_PLANS: PublicPlansSnapshot = {
  quotaWindowMs: 18000000,
  weeklyQuotaWindowMs: 604800000,
  burstWindowMs: 20000,
  burstMax: 5,
  defaultRequestCost: 1,
  planTiers: [
    { slug: "weekly-250", label: "Pro", quotaMax: 250, weeklyQuotaMax: 4000 },
    { slug: "weekly-500", label: "Max", quotaMax: 500, weeklyQuotaMax: 8000 }
  ]
};

function asObject(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return {};
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return fallback;
}

function normalizePublicPlans(payload: unknown): PublicPlansSnapshot {
  const root = asObject(payload);
  const rawTiers = Array.isArray(root.planTiers) ? root.planTiers : [];
  const planTiers = rawTiers
    .map((entry): PlanTierLimits | null => {
      const tier = asObject(entry);
      const slug = typeof tier.slug === "string" ? tier.slug.trim() : "";
      if (!slug) return null;

      return {
        slug,
        label: typeof tier.label === "string" && tier.label.trim() ? tier.label : slug,
        quotaMax: Math.max(0, asNumber(tier.quotaMax, 0)),
        weeklyQuotaMax: Math.max(0, asNumber(tier.weeklyQuotaMax, 0))
      };
    })
    .filter((tier): tier is PlanTierLimits => tier !== null && tier.quotaMax > 0 && tier.weeklyQuotaMax > 0);

  return {
    quotaWindowMs: Math.max(1, asNumber(root.quotaWindowMs, FALLBACK_PUBLIC_PLANS.quotaWindowMs)),
    weeklyQuotaWindowMs: Math.max(
      1,
      asNumber(root.weeklyQuotaWindowMs, FALLBACK_PUBLIC_PLANS.weeklyQuotaWindowMs)
    ),
    burstWindowMs: Math.max(1, asNumber(root.burstWindowMs, FALLBACK_PUBLIC_PLANS.burstWindowMs)),
    burstMax: Math.max(1, asNumber(root.burstMax, FALLBACK_PUBLIC_PLANS.burstMax)),
    defaultRequestCost: Math.max(1, asNumber(root.defaultRequestCost, FALLBACK_PUBLIC_PLANS.defaultRequestCost)),
    planTiers: planTiers.length ? planTiers : FALLBACK_PUBLIC_PLANS.planTiers
  };
}

export async function getPublicPlans(): Promise<PublicPlansSnapshot> {
  try {
    const response = await fetch(new URL("/account/plans", getBackendBaseUrl()), {
      cache: "no-store"
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return FALLBACK_PUBLIC_PLANS;
    }

    return normalizePublicPlans(payload);
  } catch {
    return FALLBACK_PUBLIC_PLANS;
  }
}

export async function getPublicDisplayPlans() {
  const plans = await getPublicPlans();
  return getDisplayMarketingPlans(plans.planTiers, {
    quotaWindowMs: plans.quotaWindowMs,
    weeklyQuotaWindowMs: plans.weeklyQuotaWindowMs
  });
}
