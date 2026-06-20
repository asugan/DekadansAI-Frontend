export interface MarketingPlanSpec {
  label: string;
  value: string;
}

export interface MarketingPlan {
  slug: string;
  name: string;
  price: string;
  subtitle: string;
  description: string;
  bestFor: string[];
  specs: MarketingPlanSpec[];
  popular: boolean;
}

export const MARKETING_PLANS: MarketingPlan[] = [
  {
    slug: "weekly-250",
    name: "250 Request",
    price: "$5",
    subtitle: "Best for testing & light usage",
    description: "$5 per week — up to 250 quota points every 5 hours, with a safety limit of 4,000 requests per week.",
    bestFor: ["Individual developers", "Quick prototypes & experiments", "Low-traffic integrations"],
    specs: [
      { label: "Quota per 5h", value: "250 points" },
      { label: "Weekly limit", value: "4,000 points" },
      { label: "Model access", value: "All models" },
      { label: "API key", value: "Included" },
      { label: "Dashboard", value: "Real-time usage" }
    ],
    popular: false
  },
  {
    slug: "weekly-500",
    name: "500 Request",
    price: "$10",
    subtitle: "Best for regular development",
    description: "$10 per week — up to 500 quota points every 5 hours, with a safety limit of 8,000 requests per week.",
    bestFor: ["Production workloads", "Team projects & CI/CD", "Heavy API integrations"],
    specs: [
      { label: "Quota per 5h", value: "500 points" },
      { label: "Weekly limit", value: "8,000 points" },
      { label: "Model access", value: "All models" },
      { label: "API key", value: "Included" },
      { label: "Dashboard", value: "Real-time usage" }
    ],
    popular: true
  }
];

export function getMarketingPlan(slug: string): MarketingPlan | null {
  return MARKETING_PLANS.find((plan) => plan.slug === slug) || null;
}
