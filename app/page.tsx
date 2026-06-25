import Image from "next/image";
import Link from "next/link";

import { LogoHeroScene } from "./logo-hero-scene";
import { ModelLogoMarquee } from "./model-logo-marquee";
import { PricingPlanAction } from "./pricing-plan-action";
import { SiteFooter } from "./site-footer";
import { PUBLIC_PROVIDER_NAME, getModelPresentation, getProviderDisplayName } from "@/lib/model-presentation";
import { MARKETING_PLANS } from "@/lib/plan-display";
import { getBackendBaseUrl } from "@/lib/server/backend-url";

type JsonObject = Record<string, unknown>;

interface HomepageModel {
  id: string;
  name: string;
  provider: string | null;
  requestCost: number;
}

const FALLBACK_MODELS: HomepageModel[] = [
  { id: "minimax-m3", name: "Minimax M3", provider: PUBLIC_PROVIDER_NAME, requestCost: 1 },
  { id: "glm-5.1", name: "GLM 5.1", provider: PUBLIC_PROVIDER_NAME, requestCost: 1 },
  { id: "kimi-k2.6", name: "Kimi K2.6", provider: PUBLIC_PROVIDER_NAME, requestCost: 1 },
  { id: "gpt-5.5", name: "ChatGPT 5.5", provider: PUBLIC_PROVIDER_NAME, requestCost: 3 }
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
          typeof model.provider === "string" && model.provider.trim() ? PUBLIC_PROVIDER_NAME : null,
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
  const pricingPlans = MARKETING_PLANS;
  const developerItems = [
    "Unified billing and invoicing",
    "Real-time usage monitoring",
    "Standardized API responses"
  ];

  return (
    <>
      <main className="overflow-hidden pb-24">
        <section className="relative mb-32 min-h-screen px-4 pt-20 md:mb-48 md:px-6">
          <div className="absolute inset-0 -z-20 bg-black" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_28%,rgba(0,242,255,0.12),transparent_30%),linear-gradient(180deg,rgba(0,0,0,0)_0%,#000_92%)]" />
          <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-25 mask-[linear-gradient(to_bottom,black,transparent)]" />

          <div className="mx-auto flex max-w-360 flex-col items-center">
            <LogoHeroScene modelLabels={models.map((model) => model.name)} />

            <div className="-mt-6 max-w-3xl text-center md:-mt-14">
              <p className="hero-reveal mb-4 font-mono text-[12px] font-medium tracking-[0.24em] text-cyan-200/80 [--hero-reveal-delay:120ms]">
                DEKADANS AI GATEWAY
              </p>
              <h1 className="hero-reveal text-balance text-4xl font-semibold leading-[0.96] tracking-[-0.05em] text-white [--hero-reveal-delay:220ms] md:text-7xl">
                All frontier AI models, behind one key
              </h1>
              <p className="hero-reveal mx-auto mt-5 max-w-xl text-sm leading-6 text-white/55 [--hero-reveal-delay:340ms] md:text-base">
                Stop managing separate provider accounts and API keys. One unified endpoint,
                built-in quota management, and a real-time dashboard to monitor every request
                across all models.
              </p>
              <div className="hero-reveal mt-8 flex flex-wrap justify-center gap-3 [--hero-reveal-delay:460ms]">
                <Link
                  className="rounded-full bg-white px-6 py-3 font-mono text-[12px] font-semibold tracking-[0.04em] text-black! transition hover:bg-cyan-100 active:scale-95"
                  href="/login"
                >
                  Get Started
                </Link>
                <Link
                  className="rounded-full border border-white/10 bg-white/10 px-6 py-3 font-mono text-[12px] font-medium tracking-[0.04em] text-white transition hover:border-white/20 hover:bg-white/15 active:scale-95"
                  href="#pricing"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto mb-32 max-w-360 px-4 md:mb-48 md:px-6" id="models">
          <ModelLogoMarquee models={models} />

          <div className="mb-14 text-center">
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-black/70 px-4 py-2 font-mono text-[12px] tracking-[0.16em] text-white/80">
              DEKADANS SERVERLESS
            </div>
            <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-white md:text-6xl">
              Access frontier models easily with one API
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-white/55 md:text-base">
              No provider setup, no separate keys. Every successful AI request consumes quota
              points based on the model multiplier below.
            </p>
            <Link
              className="mt-8 inline-flex rounded-full bg-white px-6 py-3 font-mono text-[12px] font-semibold tracking-[0.04em] text-black! transition hover:bg-cyan-100 active:scale-95"
              href="/login"
            >
              Start building
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {models.map((model) => {
              const presentation = getModelPresentation(model);

              return (
                <article
                  className="group relative min-h-64 overflow-hidden rounded-3xl border border-white/10 bg-black/80 p-6 transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-black"
                  key={model.id}
                >
                  <div className={`absolute inset-0 bg-linear-to-br ${presentation.accent} opacity-0 transition group-hover:opacity-100`} />
                  <div className="absolute inset-x-6 bottom-16 h-px bg-white/10" />
                  <div className="relative flex h-full flex-col">
                    <div className="mb-7 flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white p-1.5 shadow-[0_0_24px_rgba(0,242,255,0.16)]">
                          <Image
                            alt={`${model.name} logo`}
                            className="h-full w-full object-contain"
                            height={36}
                            src={presentation.logo}
                            width={36}
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-semibold tracking-[-0.03em] text-white">
                            {model.name}
                          </h3>
                          <p className="mt-1 truncate font-mono text-[11px] tracking-[0.1em] text-white/35">
                            {getProviderDisplayName()}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 font-mono text-[12px] font-semibold text-cyan-100">
                        {model.requestCost}x
                      </span>
                    </div>

                    <p className="mb-10 min-h-16 text-sm leading-5 text-white/50">
                      {presentation.description}
                    </p>

                    <div className="mt-auto grid grid-cols-3 gap-4 font-mono">
                      <div>
                        <p className="text-[12px] text-white/38">Multiplier</p>
                        <p className="mt-2 text-lg text-white">{model.requestCost}x</p>
                      </div>
                      <div>
                        <p className="text-[12px] text-white/38">Quota cost</p>
                        <p className="mt-2 text-lg text-white">{model.requestCost} pt</p>
                      </div>
                      <div>
                        <p className="text-[12px] text-white/38">Access</p>
                        <p className="mt-2 text-lg text-white">All</p>
                      </div>
                    </div>

                    <p className="mt-7 font-mono text-[12px] italic text-white/38">
                      per successful AI request
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-black/80 p-5 text-center font-mono text-[12px] leading-6 text-white/45">
            Model names and multipliers are loaded from the backend. Higher-capability models use
            more quota points per request.
          </div>
        </section>

        <section className="relative mx-auto mb-32 max-w-360 px-4 md:mb-48 md:px-6" id="docs">
          <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
            <div className="order-2 overflow-hidden rounded-3xl border border-white/10 bg-black/80 md:order-1">
              <div className="border-b border-white/10 bg-black px-4 py-3">
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
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[61%] bg-(--brand) shadow-[0_0_15px_rgba(0,242,255,0.3)]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-[13px] tracking-wider">
                    <span>Time Remaining</span>
                    <span className="text-[#ddb7ff]">3h 45m / 5h</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
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

        <section className="relative mx-auto mb-32 max-w-360 px-4 md:mb-48 md:px-6" id="pricing">
          <div className="mb-12 text-center">
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-black/70 px-4 py-2 font-mono text-[12px] tracking-[0.16em] text-white/80">
              WEEKLY ACCESS
            </div>
            <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-white md:text-6xl">
              Pick a weekly quota plan for every model
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-white/55 md:text-base">
              Plans include a rolling 5-hour quota plus a weekly safety limit. Model multipliers
              decide how many quota points each successful request consumes.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
            {pricingPlans.map((plan) => (
              <article
                key={plan.slug}
                className={`group relative overflow-hidden rounded-3xl border bg-black/80 p-7 transition duration-300 hover:-translate-y-1 hover:bg-black ${
                  plan.popular ? "border-cyan-200/30" : "border-white/10"
                }`}
              >
                {plan.popular ? (
                  <div className="absolute inset-0 bg-linear-to-br from-cyan-300/15 via-transparent to-fuchsia-400/10" />
                ) : (
                  <div className="absolute inset-0 bg-linear-to-br from-white/[0.03] to-transparent" />
                )}
                <div className="relative flex h-full flex-col">
                  <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold tracking-[-0.04em] text-white">
                        {plan.name}
                      </h3>
                      <p className="mt-2 font-mono text-[12px] tracking-[0.06em] text-white/45">
                        {plan.subtitle}
                      </p>
                    </div>
                    {plan.popular ? (
                      <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 font-mono text-[11px] font-semibold tracking-[0.08em] text-cyan-100">
                        POPULAR
                      </span>
                    ) : null}
                  </div>

                  <div className="mb-8 flex items-end gap-2">
                    <span className="text-6xl font-semibold leading-none tracking-[-0.06em] text-white">
                      {plan.price}
                    </span>
                    <span className="pb-2 font-mono text-[13px] text-white/42">per week</span>
                  </div>

                  <div className="mb-8 grid grid-cols-2 gap-3">
                    {plan.specs.slice(0, 4).map((spec) => (
                      <div className="rounded-2xl border border-white/10 bg-black/80 p-4" key={spec.label}>
                        <p className="font-mono text-[11px] text-white/38">{spec.label}</p>
                        <p className="mt-2 font-mono text-sm text-white">{spec.value}</p>
                      </div>
                    ))}
                  </div>

                  <p className="mb-7 min-h-12 text-sm leading-6 text-white/50">{plan.description}</p>

                  <PricingPlanAction name={plan.name} slug={plan.slug} />
                </div>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-5 grid max-w-5xl gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-white/10 bg-black/80 p-6">
              <p className="mb-3 font-mono text-[12px] tracking-[0.14em] text-cyan-100">
                HOW MULTIPLIERS WORK
              </p>
              <p className="text-sm leading-6 text-white/55">
                A 500 point plan can run up to 500 requests on a 1x model in each 5-hour window.
                With a 3x model, that same window supports about 166 successful requests.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/80 p-6 font-mono text-[12px] leading-6 text-white/45">
              <p className="text-white/70">Included with every plan</p>
              <p className="mt-2">One API key, all models, real-time dashboard, provider setup included.</p>
              <p className="mt-3">
                See the{" "}
                <Link className="text-cyan-100 underline underline-offset-4" href="/docs#limits-model-costs">
                  docs
                </Link>{" "}
                for quota details.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto mb-32 max-w-360 px-4 md:mb-48 md:px-6" id="contact">
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-black/80 p-8 text-center md:p-10">
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
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-black p-5 font-mono text-sm tracking-[0.05em] text-[#e1fdff] transition hover:border-white/25"
                href="mailto:contact@dekadans.net"
              >
                <MailIcon />
                contact@dekadans.net
              </a>
              <a
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-black p-5 font-mono text-sm tracking-[0.05em] text-[#e1fdff] transition hover:border-white/25"
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

      <SiteFooter />
    </>
  );
}
