export interface MarketingPlanSpec {
  label: string;
  value: string;
}

export interface MarketingPlan {
  slug: string;
  name: string;
  price: string;
  subtitle: string;
  bestFor: string[];
  popular: boolean;
}

export interface PlanTierLimits {
  slug: string;
  label: string;
  quotaMax: number;
  weeklyQuotaMax: number;
}

export interface PlanWindowLimits {
  quotaWindowMs: number;
  weeklyQuotaWindowMs: number;
}

export interface DisplayMarketingPlan extends MarketingPlan, PlanTierLimits, PlanWindowLimits {
  description: string;
  specs: MarketingPlanSpec[];
}

const DEFAULT_PLAN_WINDOWS: PlanWindowLimits = {
  quotaWindowMs: 18000000,
  weeklyQuotaWindowMs: 604800000
};

const FALLBACK_PLAN_TIERS: PlanTierLimits[] = [
  { slug: "weekly-250", label: "Pro", quotaMax: 250, weeklyQuotaMax: 4000 },
  { slug: "weekly-500", label: "Max", quotaMax: 500, weeklyQuotaMax: 8000 }
];

export const MARKETING_PLAN_METADATA: MarketingPlan[] = [
  {
    slug: "weekly-250",
    name: "Pro",
    price: "$5",
    subtitle: "Best for testing & light usage",
    bestFor: ["Individual developers", "Quick prototypes & experiments", "Low-traffic integrations"],
    popular: false
  },
  {
    slug: "weekly-500",
    name: "Max",
    price: "$10",
    subtitle: "Best for regular development",
    bestFor: ["Production workloads", "Team projects & CI/CD", "Heavy API integrations"],
    popular: true
  }
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDuration(valueMs: number): string {
  const secondMs = 1000;
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;

  if (valueMs % dayMs === 0) {
    const days = valueMs / dayMs;
    return days === 1 ? "1 day" : `${days} days`;
  }

  if (valueMs % hourMs === 0) {
    const hours = valueMs / hourMs;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }

  if (valueMs % secondMs === 0) {
    const seconds = valueMs / secondMs;
    return seconds === 1 ? "1 second" : `${seconds} seconds`;
  }

  return `${formatNumber(valueMs)} ms`;
}

export function formatDurationShort(valueMs: number): string {
  const secondMs = 1000;
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;

  if (valueMs % dayMs === 0) {
    return `${valueMs / dayMs}d`;
  }

  if (valueMs % hourMs === 0) {
    return `${valueMs / hourMs}h`;
  }

  if (valueMs % secondMs === 0) {
    return `${valueMs / secondMs}s`;
  }

  return `${formatNumber(valueMs)}ms`;
}

function getMetadata(slug: string, label: string): MarketingPlan {
  return MARKETING_PLAN_METADATA.find((plan) => plan.slug === slug) || {
    slug,
    name: label,
    price: "$?",
    subtitle: "Weekly access",
    bestFor: ["API access", "Usage dashboard", "Unified billing"],
    popular: false
  };
}

function toDisplayPlan(
  tier: PlanTierLimits,
  windows: PlanWindowLimits
): DisplayMarketingPlan {
  const metadata = getMetadata(tier.slug, tier.label);
  const quotaWindow = formatDuration(windows.quotaWindowMs);
  const weeklyWindow = formatDuration(windows.weeklyQuotaWindowMs);

  return {
    ...metadata,
    label: tier.label,
    quotaMax: tier.quotaMax,
    weeklyQuotaMax: tier.weeklyQuotaMax,
    quotaWindowMs: windows.quotaWindowMs,
    weeklyQuotaWindowMs: windows.weeklyQuotaWindowMs,
    description: `${metadata.price} per week, up to ${formatNumber(tier.quotaMax)} quota points every ${quotaWindow}, with a safety limit of ${formatNumber(tier.weeklyQuotaMax)} points every ${weeklyWindow}.`,
    specs: [
      { label: `Quota per ${formatDurationShort(windows.quotaWindowMs)}`, value: `${formatNumber(tier.quotaMax)} points` },
      { label: "Weekly limit", value: `${formatNumber(tier.weeklyQuotaMax)} points` },
      { label: "Model access", value: "All models" },
      { label: "API key", value: "Included" },
      { label: "Dashboard", value: "Real-time usage" }
    ]
  };
}

export function getDisplayMarketingPlans(
  planTiers: PlanTierLimits[] = FALLBACK_PLAN_TIERS,
  windows: PlanWindowLimits = DEFAULT_PLAN_WINDOWS
): DisplayMarketingPlan[] {
  const tierBySlug = new Map(planTiers.map((tier) => [tier.slug, tier]));
  const orderedTiers = [
    ...MARKETING_PLAN_METADATA.map((plan) => tierBySlug.get(plan.slug)).filter(
      (tier): tier is PlanTierLimits => tier !== undefined
    ),
    ...planTiers.filter((tier) => !MARKETING_PLAN_METADATA.some((plan) => plan.slug === tier.slug))
  ];

  return orderedTiers.map((tier) => toDisplayPlan(tier, windows));
}

export const MARKETING_PLANS: DisplayMarketingPlan[] = getDisplayMarketingPlans();

export function getMarketingPlan(slug: string): DisplayMarketingPlan | null {
  return MARKETING_PLANS.find((plan) => plan.slug === slug) || null;
}
