import Image from "next/image";
import Link from "next/link";

import { getBackendBaseUrl } from "@/lib/server/backend-url";

type JsonObject = Record<string, unknown>;

interface HomepageModel {
  id: string;
  name: string;
  provider: string | null;
  requestCost: number;
}

const FALLBACK_MODELS: HomepageModel[] = [
  { id: "minimax-m3", name: "Minimax M3", provider: "minimax", requestCost: 1 },
  { id: "glm-5.1", name: "GLM 5.1", provider: "zai", requestCost: 1 },
  { id: "kimi-k2.6", name: "Kimi K2.6", provider: "kimi", requestCost: 1 },
  { id: "gpt-5.5", name: "ChatGPT 5.5", provider: "openai", requestCost: 3 }
];

const FEATURED_MODELS = [
  { name: "Minimax M3", version: "minimax-m3", logo: "/minimax.png" },
  { name: "GLM 5.1", version: "glm-5.1", logo: "/zai.jpg" },
  { name: "Kimi K2.6", version: "kimi-k2.6", logo: "/kimilogo.webp" },
  { name: "ChatGPT 5.5", version: "gpt-5.5", logo: "/chatgptlogo.png" }
];

function asObject(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return {};
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function normalizeHomepageModels(payload: unknown): HomepageModel[] {
  const root = asObject(payload);
  const rawModels = Array.isArray(root.data) ? root.data : [];

  return rawModels
    .map((entry): HomepageModel | null => {
      const model = asObject(entry);
      const id = typeof model.id === "string" ? model.id.trim() : "";
      if (!id) return null;

      return {
        id,
        name: typeof model.name === "string" && model.name.trim() ? model.name : id,
        provider:
          typeof model.provider === "string" && model.provider.trim() ? model.provider : null,
        requestCost: Math.max(1, asNumber(model.requestCost, 1))
      };
    })
    .filter((entry): entry is HomepageModel => entry !== null);
}

async function getHomepageModels(): Promise<HomepageModel[]> {
  try {
    const response = await fetch(new URL("/models", getBackendBaseUrl()), {
      cache: "no-store"
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return FALLBACK_MODELS;
    }

    const models = normalizeHomepageModels(payload);
    return models.length ? models : FALLBACK_MODELS;
  } catch {
    return FALLBACK_MODELS;
  }
}

function MailIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 text-(--brand)" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6.5h16A1.5 1.5 0 0 1 21.5 8v8A1.5 1.5 0 0 1 20 17.5H4A1.5 1.5 0 0 1 2.5 16V8A1.5 1.5 0 0 1 4 6.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="m4.75 8.25 7.25 5 7.25-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 text-(--brand)" viewBox="0 0 24 24" fill="none">
      <path
        d="M12.02 3.5a8.5 8.5 0 0 0-7.23 12.97L4 20.5l4.17-1.03a8.5 8.5 0 1 0 3.85-15.97Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.3 8.6c.2-.43.44-.45.65-.45h.56c.18 0 .46-.07.7.5.25.58.84 1.99.91 2.14.08.15.14.32.03.52-.1.2-.16.32-.31.5-.16.18-.33.4-.47.53-.16.15-.31.31-.13.62.18.3.8 1.32 1.72 2.14 1.18 1.05 2.17 1.38 2.48 1.53.3.15.47.12.65-.07.18-.2.76-.88.97-1.19.2-.3.4-.25.67-.15.28.1 1.75.82 2.05.97.3.14.5.21.58.33.09.12.09.72-.11 1.4-.2.68-1.22 1.31-1.68 1.39-.45.08-1.06.12-1.72-.1-.67-.22-2.26-.76-3.84-2.03-1.23-.99-2.06-2.2-2.3-2.56-.24-.36-1-1.42-1-2.7 0-1.28.7-1.9.95-2.17Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default async function Home() {
  const models = await getHomepageModels();
  const pricingPlans = [
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
  const developerItems = [
    "Unified billing and invoicing",
    "Real-time usage monitoring",
    "Standardized API responses"
  ];

  return (
    <>
      <nav className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#0a0c10]/70 px-4 py-4 backdrop-blur-md md:px-6">
        <div className="mx-auto flex max-w-360 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              className="group flex items-center gap-3 text-xl font-bold tracking-tighter text-white transition hover:text-(--brand)"
              href="/"
            >
              <Image
                alt="Dekadans AI logo"
                className="h-16 w-16 object-contain transition-transform duration-200 ease-out group-hover:scale-110"
                height={64}
                priority
                src="/logo.png"
                width={64}
              />
            </Link>
            <div className="hidden items-center gap-6 md:flex">
              {["Models", "Pricing"].map((item) => (
                <Link
                  key={item}
                  className="font-mono text-[13px] tracking-wider text-(--ink-muted) transition hover:text-(--brand)"
                  href={`#${item.toLowerCase()}`}
                >
                  {item}
                </Link>
              ))}
              <Link
                className="font-mono text-[13px] tracking-wider text-(--ink-muted) transition hover:text-(--brand)"
                href="/docs"
              >
                Docs
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              className="hidden font-mono text-[13px] tracking-wider text-(--ink-muted) transition hover:text-(--brand) md:block"
              href="/login"
            >
              Login
            </Link>
            <Link
              className="rounded-sm bg-(--brand) px-4 py-2 font-mono text-[13px] font-medium tracking-[0.05em] text-[#002022]! shadow-[0_0_15px_rgba(0,242,255,0.3)] transition hover:shadow-[0_0_25px_rgba(0,242,255,0.5)] active:scale-95"
              href="/register"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="overflow-hidden pb-24 pt-32">
        <section className="relative mx-auto mb-32 max-w-360 px-4 md:mb-48 md:px-6">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[40px_40px] opacity-20 mask-[linear-gradient(to_bottom,white,transparent)]" />
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
            <div className="space-y-8 md:col-span-6">
              <div className="inline-block rounded border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 font-mono text-[13px] font-medium tracking-wider text-cyan-300">
                v2.0 Unified API Gateway
              </div>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-[-0.02em] text-[#e1fdff] md:text-5xl">
                One API for MiniMax, GLM, Kimi, and ChatGPT
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-(--ink-muted)">
                Get secure, request-limited access to multiple frontier AI models with a single
                API key.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  className="rounded-sm bg-(--brand) px-6 py-3 font-mono text-[13px] font-medium tracking-[0.05em] text-[#002022]! shadow-[0_0_15px_rgba(0,242,255,0.3)] transition hover:shadow-[0_0_25px_rgba(0,242,255,0.5)] active:scale-95"
                  href="/register"
                >
                  Get Started
                </Link>
                <Link
                  className="rounded border border-white/10 px-6 py-3 font-mono text-[13px] tracking-wider text-white transition hover:border-white/20 hover:bg-white/5 active:scale-95"
                  href="#pricing"
                >
                  View Pricing
                </Link>
              </div>
            </div>

            <div className="relative h-100 overflow-hidden rounded-lg border border-white/10 bg-[#1a1c20] md:col-span-6 md:h-125">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(0,242,255,0.28),transparent_24%),radial-gradient(circle_at_82%_62%,rgba(168,85,247,0.24),transparent_28%),linear-gradient(135deg,rgba(0,242,255,0.08),rgba(111,0,190,0.06))]" />
              <div className="absolute inset-0 opacity-35 bg-[repeating-linear-gradient(150deg,transparent_0px,transparent_20px,rgba(255,255,255,0.12)_21px,transparent_23px)]" />
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="w-full max-w-md rounded-lg border border-white/10 bg-black/80 p-6 shadow-2xl backdrop-blur-md">
                  <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                    <div className="h-3 w-3 rounded-full bg-[#ffb4ab]" />
                    <div className="h-3 w-3 rounded-full bg-[#00dbe7]" />
                    <div className="h-3 w-3 rounded-full bg-[#74f5ff]" />
                    <span className="ml-2 font-mono text-[13px] tracking-wider text-[#849495]">terminal</span>
                  </div>
                  <pre className="overflow-x-auto font-mono text-sm leading-6 text-[#e2e2e8]">
                    <code>{`curl -X POST https://api.dekadans.ai/v1/chat/completions \\
  -H "Authorization: Bearer dk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "minimax-abab6.5",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mb-32 max-w-360 px-4 md:mb-48 md:px-6" id="models">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Unified Model Access
            </h2>
            <p className="mx-auto max-w-2xl text-(--ink-muted)">
              Route your AI requests through a unified gateway instead of managing multiple
              providers separately.
            </p>
          </div>
          <div className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
            {FEATURED_MODELS.map((model) => (
              <article
                className="group relative rounded-lg border border-white/10 bg-[#1e2024] p-6 transition hover:border-cyan-300/40"
                key={model.name}
              >
                <div className="absolute inset-0 rounded-lg bg-linear-to-br from-cyan-300/5 to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="relative flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-white p-2 shadow-[0_0_18px_rgba(0,242,255,0.12)]">
                    <Image
                      alt={`${model.name} logo`}
                      className="h-full w-full object-contain"
                      height={48}
                      src={model.logo}
                      width={48}
                    />
                  </div>
                  <h3 className="font-mono text-[13px] font-bold tracking-wider text-white">{model.name}</h3>
                  <p className="font-mono text-sm text-[#849495]">{model.version}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mb-8 text-center">
            <h3 className="mb-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Live model catalog
            </h3>
            <p className="mx-auto max-w-2xl text-(--ink-muted)">
              Model names and request multipliers are loaded directly from the backend.
            </p>
          </div>
          <div className="space-y-3">
            {models.map((model) => (
              <article
                className="group relative rounded-xl border border-white/10 bg-[#101214] px-5 py-4 transition hover:border-cyan-300/40 hover:bg-[#15171b]"
                key={model.id}
              >
                <div className="absolute inset-0 rounded-xl bg-linear-to-r from-cyan-300/5 to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="truncate font-mono text-[14px] font-bold tracking-wider text-white">
                        {model.name}
                      </h3>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] tracking-wider text-[#94a3b8]">
                        {model.requestCost}x
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[12px] text-[#849495]">
                      <span className="rounded border border-white/10 px-2 py-1">{model.id}</span>
                      {model.provider ? (
                        <span className="rounded border border-white/10 px-2 py-1">{model.provider}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[12px]">
                    <span className="text-[#22c55e]">available</span>
                    <span className="text-[#fbbf24]">live</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="relative mx-auto mb-32 max-w-360 px-4 md:mb-48 md:px-6" id="docs">
          <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
            <div className="order-2 overflow-hidden rounded-lg border border-white/10 bg-[#1a1c20] md:order-1">
              <div className="border-b border-white/10 bg-[#1e2024] px-4 py-3">
                <span className="font-mono text-[13px] tracking-wider text-(--ink-muted)">
                  usage_dashboard.js
                </span>
              </div>
              <div className="space-y-6 p-6">
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-[13px] tracking-wider">
                    <span>Remaining Requests</span>
                    <span className="text-[#e1fdff]">184 / 500</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#333539]">
                    <div className="h-full w-[61%] bg-(--brand) shadow-[0_0_15px_rgba(0,242,255,0.3)]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-[13px] tracking-wider">
                    <span>Time Remaining</span>
                    <span className="text-[#ddb7ff]">3h 45m / 5h</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#333539]">
                    <div className="h-full w-[75%] bg-[#6f00be]" />
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 space-y-6 md:order-2">
              <h2 className="text-3xl font-semibold tracking-tight text-white">Built for Developers</h2>
              <p className="leading-relaxed text-(--ink-muted)">
                No more juggling separate accounts and billing. One key, all the frontier models
                you need. Track your usage in real-time.
              </p>
              <ul className="space-y-4 font-mono text-[13px] tracking-wider text-(--ink-muted)">
                {developerItems.map((item) => (
                  <li className="flex items-center gap-3" key={item}>
                    <span className="text-(--brand)">⊙</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto mb-32 max-w-360 px-4 md:mb-48 md:px-6" id="pricing">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Choose the weekly access that fits your usage
            </h2>
            <p className="mx-auto max-w-2xl text-(--ink-muted)">
              Every plan includes a <strong className="text-white">5-hour rolling quota</strong> plus
              a <strong className="text-white">weekly safety limit</strong>.
              AI requests consume quota points based on the model used.
            </p>
          </div>
          <div className="mx-auto grid max-w-2xl gap-6 md:grid-cols-2">
            {pricingPlans.map((plan) => (
              <div
                key={plan.slug}
                className={`group relative flex flex-col ${plan.popular ? 'md:-mt-2 md:mb-2' : ''}`}
              >
                {plan.popular ? (
                  <div className="absolute -inset-1 rounded-xl bg-linear-to-r from-(--brand) to-(--accent) opacity-25 blur transition duration-1000 group-hover:opacity-40" />
                ) : null}
                <div
                  className={`relative flex h-full flex-col rounded-xl border ${
                    plan.popular ? 'border-(--brand)/40' : 'border-white/10'
                  } bg-[#282a2e] p-8`}
                >
                  {plan.popular ? (
                    <span className="mb-3 inline-block self-start rounded-full bg-(--brand)/20 px-3 py-1 font-mono text-[11px] font-semibold tracking-wider text-(--brand)">
                      MOST POPULAR
                    </span>
                  ) : null}
                  <div className="mb-6">
                    <h3 className="mb-1 text-2xl font-semibold text-[#e1fdff]">{plan.name}</h3>
                    <p className="mb-4 font-mono text-[13px] tracking-wider text-(--ink-muted)">
                      {plan.subtitle}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold leading-none text-white">{plan.price}</span>
                      <span className="font-mono text-[13px] tracking-wider text-(--ink-muted)">/ week</span>
                    </div>
                  </div>
                  <ul className="mb-6 flex-1 space-y-3">
                    {plan.specs.map((spec) => (
                      <li
                        key={spec.label}
                        className="flex items-center justify-between border-b border-white/5 pb-2 font-mono text-[13px] last:border-0 last:pb-0"
                      >
                        <span className="text-(--ink-muted)">{spec.label}</span>
                        <span className="text-white">{spec.value}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    className="mb-3 w-full rounded-sm bg-(--brand) py-4 text-center font-mono text-[13px] font-medium tracking-[0.05em] text-[#002022]! shadow-[0_0_15px_rgba(0,242,255,0.3)] transition hover:shadow-[0_0_25px_rgba(0,242,255,0.5)] active:scale-95"
                    href="/register"
                  >
                    Start {plan.name} Plan
                  </Link>
                  <p className="text-center font-mono text-sm leading-6 text-[#849495]">
                    {plan.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison strip */}
          <div className="mx-auto mt-12 max-w-2xl">
            <div className="grid grid-cols-2 gap-4 overflow-hidden rounded-xl border border-white/10 bg-[#1e2024]">
              {pricingPlans.map((plan) => (
                <div key={plan.slug} className="p-5">
                  <p className="mb-2 font-mono text-[13px] font-semibold text-[#e1fdff]">
                    {plan.name}
                  </p>
                  <div className="space-y-1.5 font-mono text-[12px] text-(--ink-muted)">
                    <p>Quota: {plan.specs[0].value} per 5h</p>
                    <p>Weekly: {plan.specs[1].value}</p>
                    <p className="text-white">{plan.price}/week</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust row */}
          <div className="mx-auto mt-10 max-w-2xl text-center">
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 font-mono text-[13px] text-(--ink-muted)">
              <span className="flex items-center gap-2">
                <span className="text-(--brand)">&#x25C9;</span> No provider setup
              </span>
              <span className="flex items-center gap-2">
                <span className="text-(--brand)">&#x25C9;</span> One API key for every model
              </span>
              <span className="flex items-center gap-2">
                <span className="text-(--brand)">&#x25C9;</span> Real-time usage dashboard
              </span>
              <span className="flex items-center gap-2">
                <span className="text-(--brand)">&#x25C9;</span> Cancel or switch anytime
              </span>
            </div>
            <p className="mt-4 font-mono text-[12px] text-(--ink-muted)">
              Request multipliers apply per model. See the{' '}
              <Link className="text-(--brand) underline underline-offset-2" href="/docs#limits-model-costs">
                docs
              </Link>{' '}
              for details. An active plan is only required for AI endpoints.
            </p>
            <p className="mt-4 font-mono text-[13px] text-(--ink-muted)">
              Already have an account?{' '}
              <Link className="text-(--brand) underline underline-offset-2" href="/login">
                Login
              </Link>
            </p>
          </div>
        </section>

        <section className="mx-auto mb-32 max-w-360 px-4 md:mb-48 md:px-6" id="contact">
          <div className="mx-auto max-w-3xl rounded-xl border border-white/10 bg-[#1e2024] p-8 text-center md:p-10">
            <p className="mb-3 font-mono text-[13px] font-medium tracking-[0.05em] text-(--brand)">
              Contact
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Need help getting started?
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-(--ink-muted)">
              Contact us for weekly access, onboarding, billing, or technical questions.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <a
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-5 font-mono text-sm tracking-[0.05em] text-[#e1fdff] transition hover:border-cyan-300/40 hover:bg-cyan-300/5"
                href="mailto:contact@dekadans.net"
              >
                <MailIcon />
                contact@dekadans.net
              </a>
              <a
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-5 font-mono text-sm tracking-[0.05em] text-[#e1fdff] transition hover:border-cyan-300/40 hover:bg-cyan-300/5"
                href="https://wa.me/905016401800"
                rel="noreferrer"
                target="_blank"
              >
                <WhatsappIcon />
                WhatsApp: +90 501 640 18 00
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-white/10 bg-[#0a0c10]/70 px-4 py-5 font-mono text-[13px] tracking-wider text-(--ink-muted) backdrop-blur-md md:px-6">
        <div className="mx-auto grid max-w-360 items-center gap-4 md:grid-cols-3">
          <div className="flex justify-center md:justify-start">
            <Link
              className="group flex items-center text-white transition hover:text-(--brand)"
              href="/"
            >
              <Image
                alt="Dekadans AI logo"
                className="h-12 w-12 object-contain transition-transform duration-200 ease-out group-hover:scale-110"
                height={48}
                src="/logo.png"
                width={48}
              />
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5">
            {["Privacy Policy", "Terms of Service", "API Status", "GitHub", "Discord"].map(
              (item) => (
                <Link className="transition hover:text-(--brand)" href="#" key={item}>
                  {item}
                </Link>
              )
            )}
          </div>
          <div className="text-center text-[#6d7677] md:text-right">© 2026 Dekadans AI</div>
        </div>
      </footer>
    </>
  );
}
