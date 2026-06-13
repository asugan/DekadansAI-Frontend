import Image from "next/image";
import Link from "next/link";

import { getBackendBaseUrl } from "@/lib/server/backend-url";

type JsonObject = Record<string, unknown>;

interface DocsModel {
  id: string;
  name: string;
  provider: string | null;
  requestCost: number;
}

const FALLBACK_DOCS_MODELS: DocsModel[] = [
  { id: "minimax-m3", name: "Minimax M3", provider: "minimax", requestCost: 1 },
  { id: "glm-5.1", name: "GLM 5.1", provider: "zai", requestCost: 1 },
  { id: "kimi-k2.6", name: "Kimi K2.6", provider: "kimi", requestCost: 1 },
  { id: "gpt-5.5", name: "ChatGPT 5.5", provider: "openai", requestCost: 3 }
];

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

function normalizeDocsModels(payload: unknown): DocsModel[] {
  const root = asObject(payload);
  const rawModels = Array.isArray(root.data) ? root.data : [];
  return rawModels
    .map((entry): DocsModel | null => {
      const model = asObject(entry);
      const id = typeof model.id === "string" ? model.id.trim() : "";
      if (!id) return null;
      return {
        id,
        name: typeof model.name === "string" && model.name.trim() ? model.name : id,
        provider: typeof model.provider === "string" && model.provider.trim() ? model.provider : null,
        requestCost: Math.max(1, asNumber(model.requestCost, 1)),
      };
    })
    .filter((entry): entry is DocsModel => entry !== null);
}

async function getDocsModels(): Promise<DocsModel[]> {
  try {
    const response = await fetch(new URL("/models", getBackendBaseUrl()), { cache: "no-store" });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) return FALLBACK_DOCS_MODELS;
    const models = normalizeDocsModels(payload);
    return models.length ? models : FALLBACK_DOCS_MODELS;
  } catch {
    return FALLBACK_DOCS_MODELS;
  }
}

function AnchorIcon() {
  return (
    <svg aria-hidden="true" className="inline h-4 w-4 text-(--brand) opacity-0 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="group mb-4 scroll-mt-28 text-2xl font-semibold tracking-tight text-white">
      <a href={`#${id}`} className="inline-flex items-center gap-2">
        {children}
        <AnchorIcon />
      </a>
    </h2>
  );
}

function SubHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="group mb-3 scroll-mt-28 text-lg font-semibold tracking-tight text-white/90">
      <a href={`#${id}`} className="inline-flex items-center gap-2">
        {children}
        <AnchorIcon />
      </a>
    </h3>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="mb-4 overflow-x-auto rounded-lg border border-white/10 bg-black/60 p-4 text-xs leading-6 text-white/90"><code>{children}</code></pre>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[13px] text-cyan-200">{children}</code>
  );
}

function PropTable({ columns, rows }: { columns: { header: string; key: string }[]; rows: Record<string, string>[] }) {
  return (
    <div className="mb-4 overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full min-w-160 border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5 text-left text-(--ink-muted)">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-2.5 font-mono text-[13px] tracking-wider">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b border-white/10 last:border-0 hover:bg-white/[0.02]">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2.5 font-mono text-[13px] text-white/80">{row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function DocsPage() {
  const models = await getDocsModels();

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
              {[
                { label: "Getting Started", href: "#getting-started" },
                { label: "API Reference", href: "#api-reference" },
                { label: "Limits", href: "#limits" },
                { label: "Errors", href: "#errors" },
                { label: "FAQ", href: "#faq" },
              ].map((item) => (
                <Link
                  key={item.label}
                  className="font-mono text-[13px] tracking-wider text-(--ink-muted) transition hover:text-(--brand)"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
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

      <main className="mx-auto max-w-360 px-4 pt-32 pb-24 md:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-1 border-l border-white/10 pl-5">
              {[
                { label: "Getting Started", href: "#getting-started" },
                { label: "Authentication", href: "#authentication" },
                { label: "Base URL", href: "#base-url" },
                { label: "API Reference", href: "#api-reference" },
                { label: "Account Endpoints", href: "#account-endpoints" },
                { label: "Usage & Limits", href: "#limits" },
                { label: "Model Catalog", href: "#model-catalog" },
                { label: "Code Examples", href: "#code-examples" },
                { label: "Streaming", href: "#streaming" },
                { label: "Errors", href: "#errors" },
                { label: "FAQ", href: "#faq" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block py-1 font-mono text-[13px] tracking-wider text-(--ink-muted) transition hover:text-(--brand)"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div className="min-w-0 space-y-12">
            {/* Header */}
            <div>
              <div className="mb-3 inline-block rounded border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 font-mono text-[13px] font-medium tracking-wider text-cyan-300">
                Documentation
              </div>
              <h1 className="text-4xl font-bold tracking-[-0.02em] text-[#e1fdff] md:text-5xl">
                Dekadans AI API Docs
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-(--ink-muted)">
                Everything you need to integrate with Dekadans AI. Get secure, request-limited access to
                multiple frontier AI models through a single API.
              </p>
            </div>

            {/* Getting Started */}
            <section id="getting-started">
              <SectionHeading id="getting-started">Getting Started</SectionHeading>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                Dekadans AI is a unified AI gateway that proxies your requests to frontier models
                including MiniMax, GLM, Kimi, and ChatGPT. Here is how to get started in a few steps.
              </p>
              <ol className="mb-4 list-inside list-decimal space-y-3 text-(--ink-muted)">
                <li><strong className="text-white">Create an account</strong> at the <Link className="text-(--brand) underline" href="/register">registration page</Link>.</li>
                <li><strong className="text-white">Start a weekly plan</strong> from your dashboard. A valid subscription is required to use the AI endpoints.</li>
                <li><strong className="text-white">Generate an API key</strong> from the dashboard. Store it securely — it is only shown once.</li>
                <li><strong className="text-white">Make your first request</strong> using the examples below.</li>
              </ol>
            </section>

            {/* Base URL */}
            <section id="base-url">
              <SectionHeading id="base-url">Base URL</SectionHeading>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                All API requests should be sent to the following base URL. The backend translates
                them to the appropriate upstream provider.
              </p>
              <CodeBlock>
                {`https://api.dekadans.ai`}
              </CodeBlock>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                When using the frontend app, the backend is automatically proxied through <InlineCode>/api/*</InlineCode> routes.
              </p>
            </section>

            {/* Authentication */}
            <section id="authentication">
              <SectionHeading id="authentication">Authentication</SectionHeading>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                AI endpoints require an API key. You can authenticate in two ways:
              </p>
              <ul className="mb-4 list-inside list-disc space-y-2 text-(--ink-muted)">
                <li>
                  <InlineCode>x-api-key: &lt;YOUR_API_KEY&gt;</InlineCode> header
                </li>
                <li>
                  <InlineCode>Authorization: Bearer &lt;YOUR_API_KEY&gt;</InlineCode> header
                </li>
              </ul>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                Account endpoints (billing, rate limits, models) require a valid login session cookie
                instead of an API key.
              </p>
            </section>

            {/* API Reference */}
            <section id="api-reference">
              <SectionHeading id="api-reference">API Reference</SectionHeading>
              <p className="mb-6 leading-relaxed text-(--ink-muted)">
                All API endpoints available on the Dekadans AI gateway.
              </p>

              <SubHeading id="endpoint-health">Health Check</SubHeading>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded bg-green-500/20 px-2 py-0.5 font-mono text-[12px] font-bold text-green-400">GET</span>
                <span className="font-mono text-[14px] text-white">/health</span>
              </div>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                Public endpoint. Returns the service status.
              </p>
              <CodeBlock>
                {`curl https://api.dekadans.ai/health`}
              </CodeBlock>

              <SubHeading id="endpoint-models-public">Public Model Catalog</SubHeading>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded bg-green-500/20 px-2 py-0.5 font-mono text-[12px] font-bold text-green-400">GET</span>
                <span className="font-mono text-[14px] text-white">/models</span>
              </div>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                Public endpoint. Returns the available model catalog with IDs, names, providers, and
                request costs. No authentication required.
              </p>

              <SubHeading id="endpoint-ai-models">AI Models (Authenticated)</SubHeading>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded bg-green-500/20 px-2 py-0.5 font-mono text-[12px] font-bold text-green-400">GET</span>
                <span className="font-mono text-[14px] text-white">/ai/models</span>
              </div>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                Returns the model catalog. Requires a valid API key and an active weekly plan.
              </p>

              <SubHeading id="endpoint-chat-completions">Chat Completions</SubHeading>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded bg-blue-500/20 px-2 py-0.5 font-mono text-[12px] font-bold text-blue-400">POST</span>
                <span className="font-mono text-[14px] text-white">/ai/chat/completions</span>
              </div>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                Send a chat completion request. The <InlineCode>model</InlineCode> field in the request
                body is required.
              </p>
              <PropTable
                columns={[
                  { header: "Field", key: "field" },
                  { header: "Type", key: "type" },
                  { header: "Required", key: "required" },
                  { header: "Description", key: "description" },
                ]}
                rows={[
                  { field: "model", type: "string", required: "Yes", description: "Model identifier (e.g. gpt-5.5, minimax-m3)" },
                  { field: "messages", type: "array", required: "Yes", description: "Array of message objects with role and content" },
                  { field: "stream", type: "boolean", required: "No", description: "Enable SSE streaming (default: false)" },
                  { field: "temperature", type: "number", required: "No", description: "Sampling temperature (0-2)" },
                  { field: "max_tokens", type: "number", required: "No", description: "Maximum tokens in the response" },
                ]}
              />
              <CodeBlock>
                {`curl -X POST https://api.dekadans.ai/ai/chat/completions \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5.5",
    "messages": [{"role": "user", "content": "Hello!"}],
    "temperature": 0.7,
    "max_tokens": 1024
  }'`}
              </CodeBlock>

              <SubHeading id="endpoint-responses">Responses API</SubHeading>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded bg-blue-500/20 px-2 py-0.5 font-mono text-[12px] font-bold text-blue-400">POST</span>
                <span className="font-mono text-[14px] text-white">/ai/responses</span>
              </div>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                OpenAI Responses API compatible endpoint. The <InlineCode>model</InlineCode> field is
                required.
              </p>
              <CodeBlock>
                {`curl -X POST https://api.dekadans.ai/ai/responses \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5.5",
    "input": "Hello!"
  }'`}
              </CodeBlock>

              <SubHeading id="endpoint-default-chat">Default Chat Completions</SubHeading>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded bg-blue-500/20 px-2 py-0.5 font-mono text-[12px] font-bold text-blue-400">POST</span>
                <span className="font-mono text-[14px] text-white">/ai/default/chat/completions</span>
              </div>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                Same as chat completions, but <InlineCode>model</InlineCode> is optional. The backend
                automatically uses the default model. If <InlineCode>reasoning_effort</InlineCode> is not
                set, it defaults to <InlineCode>low</InlineCode>.
              </p>
              <CodeBlock>
                {`curl -X POST https://api.dekadans.ai/ai/default/chat/completions \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
              </CodeBlock>

              <SubHeading id="endpoint-default-responses">Default Responses</SubHeading>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded bg-blue-500/20 px-2 py-0.5 font-mono text-[12px] font-bold text-blue-400">POST</span>
                <span className="font-mono text-[14px] text-white">/ai/default/responses</span>
              </div>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                Same as responses, but <InlineCode>model</InlineCode> is optional. The backend fills in
                the default model and reasoning configuration.
              </p>
              <CodeBlock>
                {`curl -X POST https://api.dekadans.ai/ai/default/responses \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": "Hello!"
  }'`}
              </CodeBlock>
            </section>

            {/* Account Endpoints */}
            <section id="account-endpoints">
              <SectionHeading id="account-endpoints">Account Endpoints</SectionHeading>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                These endpoints require an active login session (browser cookie). They are consumed by the
                dashboard but can also be called directly by authenticated clients.
              </p>

              <SubHeading id="endpoint-account-models">Account Models</SubHeading>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded bg-green-500/20 px-2 py-0.5 font-mono text-[12px] font-bold text-green-400">GET</span>
                <span className="font-mono text-[14px] text-white">/account/models</span>
              </div>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                Returns the normalized model catalog for the authenticated user, including model ID,
                name, provider, enabled status, and request cost.
              </p>

              <SubHeading id="endpoint-account-billing">Billing</SubHeading>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded bg-green-500/20 px-2 py-0.5 font-mono text-[12px] font-bold text-green-400">GET</span>
                <span className="font-mono text-[14px] text-white">/account/billing</span>
              </div>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                Returns the weekly plan status: whether the plan is active and whether a customer record exists.
              </p>

              <SubHeading id="endpoint-account-rate-limit">Rate Limit Snapshot</SubHeading>
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded bg-green-500/20 px-2 py-0.5 font-mono text-[12px] font-bold text-green-400">GET</span>
                <span className="font-mono text-[14px] text-white">/account/rate-limit</span>
              </div>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                Returns the current account rate limit state, including quota and burst usage, reset
                times, and a list of API keys.
              </p>
            </section>

            {/* Usage & Limits */}
            <section id="limits">
              <SectionHeading id="limits">Usage and Limits</SectionHeading>

              <SubHeading id="limits-weekly-plan">Weekly Plans</SubHeading>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                All AI endpoints require an active weekly plan. Without one, requests return a
                <InlineCode>402 Payment Required</InlineCode> error with the message
                <InlineCode>weekly_plan_required</InlineCode>.
              </p>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                Two plans are available:
              </p>
              <div className="mb-4 space-y-3">
                <div className="rounded-lg border border-white/10 bg-[#101214] p-4">
                  <p className="font-semibold text-white">500 Request Plan</p>
                  <p className="text-sm text-(--ink-muted)">
                    <strong className="text-white">$10 per week</strong> — up to <strong className="text-white">500 quota points</strong> per 5-hour window and <strong className="text-white">8,000 requests</strong> per week.
                    Manage or start from the dashboard.
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#101214] p-4">
                  <p className="font-semibold text-white">250 Request Plan</p>
                  <p className="text-sm text-(--ink-muted)">
                    <strong className="text-white">$5 per week</strong> — up to <strong className="text-white">250 quota points</strong> per 5-hour window and <strong className="text-white">4,000 requests</strong> per week.
                    Manage or start from the dashboard.
                  </p>
                </div>
              </div>

              <SubHeading id="limits-quota">Quota System</SubHeading>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                Each account has a <strong className="text-white">quota window</strong> of 5 hours with a
                plan-specific maximum of quota points. Every AI
                request consumes a certain number of quota points based on the model used.
              </p>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                In addition to the 5-hour window, each plan has a <strong className="text-white">weekly quota limit</strong>
                that resets every 7 days: 8,000 for the 500 Request plan and 4,000 for the 250 Request plan.
              </p>
              <PropTable
                columns={[{ header: "Setting", key: "setting" }, { header: "500 Plan", key: "value" }, { header: "250 Plan", key: "value2" }]}
                rows={[
                  { setting: "Quota window", value: "5 hours (18,000,000 ms)", value2: "5 hours (18,000,000 ms)" },
                  { setting: "Quota max", value: "500 points per window", value2: "250 points per window" },
                  { setting: "Weekly limit", value: "8,000 points", value2: "4,000 points" },
                  { setting: "Burst window", value: "20 seconds", value2: "20 seconds" },
                  { setting: "Burst max", value: "5 requests per burst window", value2: "5 requests per burst window" },
                  { setting: "Default request cost", value: "1 point per request", value2: "1 point per request" },
                ]}
              />

              <SubHeading id="limits-model-costs">Model Request Costs</SubHeading>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                Each model has a <strong className="text-white">request cost multiplier</strong>. The
                total quota points consumed for a request equals the model&apos;s request cost. Below
                are the known multipliers loaded from the backend.
              </p>
              <div className="mb-4 space-y-2">
                {models.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-[#101214] px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[14px] font-bold text-white">{m.name}</span>
                      <span className="font-mono text-[12px] text-(--ink-muted)">{m.id}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {m.provider && <span className="rounded border border-white/10 px-2 py-0.5 font-mono text-[11px] text-(--ink-muted)">{m.provider}</span>}
                      <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-0.5 font-mono text-[12px] font-medium text-cyan-300">
                        {m.requestCost}x
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <SubHeading id="limits-burst">Burst Protection</SubHeading>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                In addition to the quota window, a burst limit prevents sudden spikes. You can make at
                most <strong className="text-white">5 requests in any 20-second window</strong>. Burst
                refills when the window expires.
              </p>

              <SubHeading id="limits-headers">Rate Limit Headers</SubHeading>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                Every AI response includes rate limit information in the response headers:
              </p>
              <PropTable
                columns={[{ header: "Header", key: "header" }, { header: "Description", key: "description" }]}
                rows={[
                  { header: "RateLimit-Limit", description: "Maximum quota points for the window" },
                  { header: "RateLimit-Remaining", description: "Quota points remaining in the window" },
                  { header: "RateLimit-Reset", description: "Unix timestamp when the window resets" },
                  { header: "X-RateLimit-Request-Cost", description: "Quota points consumed by this request" },
                  { header: "Retry-After", description: "Seconds to wait before retrying (only on 429)" },
                ]}
              />

              <SubHeading id="limits-reset">Reset Timing</SubHeading>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                Both quota and burst windows are tracked per account. The quota window resets
                <strong className="text-white">5 hours after your first request</strong> in each window.
                The burst window resets <strong className="text-white">20 seconds</strong> after the
                first request in that burst window.
              </p>
            </section>

            {/* Model Catalog */}
            <section id="model-catalog">
              <SectionHeading id="model-catalog">Model Catalog</SectionHeading>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                The model catalog is loaded in real time from the backend. The models listed below
                are the currently available ones. Use their <InlineCode>id</InlineCode> when making
                API requests.
              </p>
              {models.length > 0 ? (
                <div className="space-y-2">
                  {models.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-[#101214] px-4 py-3 transition hover:border-cyan-300/40">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[14px] font-bold text-white">{m.name}</span>
                        <span className="font-mono text-[12px] text-(--ink-muted)">{m.id}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {m.provider && <span className="rounded border border-white/10 px-2 py-0.5 font-mono text-[11px] text-(--ink-muted)">{m.provider}</span>}
                        <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-0.5 font-mono text-[12px] font-medium text-cyan-300">
                          {m.requestCost}x
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-(--ink-muted)">Model catalog unavailable at this time.</p>
              )}
            </section>

            {/* Code Examples */}
            <section id="code-examples">
              <SectionHeading id="code-examples">Code Examples</SectionHeading>

              <SubHeading id="example-curl">cURL</SubHeading>
              <CodeBlock>
                {`curl -X POST https://api.dekadans.ai/ai/chat/completions \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5.5",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
              </CodeBlock>

              <SubHeading id="example-javascript">JavaScript (fetch)</SubHeading>
              <CodeBlock>
                {`const response = await fetch("https://api.dekadans.ai/ai/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <YOUR_API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "gpt-5.5",
    messages: [{ role: "user", content: "Hello!" }]
  })
});

const data = await response.json();
console.log(data);`}
              </CodeBlock>

              <SubHeading id="example-model-list">List Available Models</SubHeading>
              <CodeBlock>
                {`curl https://api.dekadans.ai/models`}
              </CodeBlock>

              <SubHeading id="example-list-keys">List API Keys (Session Required)</SubHeading>
              <CodeBlock>
                {`curl -X GET http://localhost:4000/account/rate-limit \\
  -b cookie.txt`}
              </CodeBlock>
            </section>

            {/* Streaming */}
            <section id="streaming">
              <SectionHeading id="streaming">Streaming</SectionHeading>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                All chat and response endpoints support SSE (Server-Sent Events) streaming. Set
                <InlineCode>stream: true</InlineCode> in the request body to receive streaming responses.
              </p>
              <CodeBlock>
                {`curl -X POST https://api.dekadans.ai/ai/chat/completions \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5.5",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }' \\
  --no-buffer`}
              </CodeBlock>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                Streaming responses use the standard SSE format. Each chunk is a JSON object prefixed
                with <InlineCode>data: </InlineCode>. The stream ends with
                <InlineCode>data: [DONE]</InlineCode>.
              </p>
              <CodeBlock>
                {`const response = await fetch("https://api.dekadans.ai/ai/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <YOUR_API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "gpt-5.5",
    messages: [{ role: "user", content: "Hello!" }],
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value, { stream: true });
  // Process SSE chunks
  console.log(text);
}`}
              </CodeBlock>
            </section>

            {/* Errors */}
            <section id="errors">
              <SectionHeading id="errors">Error Handling</SectionHeading>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                The API uses standard HTTP status codes. Error responses follow a consistent JSON format.
              </p>

              <SubHeading id="errors-format">Error Response Format</SubHeading>
              <CodeBlock>
                {`{
  "error": "account_rate_limit_exceeded",
  "reason": "quota",
  "retryAfterMs": 12345,
  "requestCost": 1,
  "quota": { ... },
  "burst": { ... }
}`}
              </CodeBlock>

              <SubHeading id="errors-status-codes">HTTP Status Codes</SubHeading>
              <PropTable
                columns={[{ header: "Code", key: "code" }, { header: "Status", key: "status" }, { header: "Description", key: "description" }]}
                rows={[
                  { code: "200", status: "OK", description: "Request succeeded." },
                  { code: "400", status: "Bad Request", description: "Missing or invalid parameters (e.g. missing model)." },
                  { code: "401", status: "Unauthorized", description: "API key missing, invalid, or session expired." },
                  { code: "402", status: "Payment Required", description: "Weekly plan required for AI endpoints." },
                  { code: "404", status: "Not Found", description: "Endpoint or model not found." },
                  { code: "429", status: "Too Many Requests", description: "Quota or burst limit exceeded." },
                  { code: "500", status: "Server Error", description: "Internal server error." },
                  { code: "502", status: "Bad Gateway", description: "Upstream AI provider unreachable." },
                  { code: "503", status: "Service Unavailable", description: "Service temporarily unavailable." },
                ]}
              />

              <SubHeading id="errors-error-codes">Error Types</SubHeading>
              <PropTable
                columns={[{ header: "Error Type", key: "type" }, { header: "HTTP", key: "http" }, { header: "Description", key: "description" }]}
                rows={[
                  { type: "missing_api_key", http: "401", description: "No API key was provided." },
                  { type: "invalid_api_key", http: "401", description: "API key is not valid." },
                  { type: "unauthorized", http: "401", description: "Session expired or not authenticated." },
                  { type: "weekly_plan_required", http: "402", description: "Active weekly plan is required." },
                  { type: "missing_model", http: "400", description: "Request body must include a model field." },
                  { type: "account_rate_limit_exceeded", http: "429", description: "Quota or burst limit reached. Includes retry info." },
                  { type: "rate_limit_exceeded", http: "429", description: "Better Auth rate limit triggered." },
                  { type: "models_unavailable", http: "502", description: "Model catalog could not be fetched from upstream." },
                ]}
              />

              <SubHeading id="errors-retry">Retry Strategy</SubHeading>
              <p className="mb-4 leading-relaxed text-(--ink-muted)">
                When you receive a <InlineCode>429</InlineCode> response, use exponential backoff for
                retries. The response includes a <InlineCode>retryAfterMs</InlineCode> field and a
                <InlineCode>Retry-After</InlineCode> header. For example, retry at 1s, 2s, 4s, 8s
                intervals up to 3-5 attempts.
              </p>
            </section>

            {/* FAQ */}
            <section id="faq">
              <SectionHeading id="faq">Frequently Asked Questions</SectionHeading>

              <div className="space-y-6">
                <div>
                  <h4 className="mb-1 font-semibold text-white">How do I create an API key?</h4>
                  <p className="text-sm leading-relaxed text-(--ink-muted)">
                    Log into the dashboard and navigate to the API keys section. Enter a name and click
                    Create. The key is shown only once, so save it immediately.
                  </p>
                </div>

                <div>
                  <h4 className="mb-1 font-semibold text-white">What happens when my quota runs out?</h4>
                  <p className="text-sm leading-relaxed text-(--ink-muted)">
                    You will receive a <InlineCode>429</InlineCode> response with
                    reason <InlineCode>quota</InlineCode>. The quota resets 5 hours after the start
                    of the current window. You can also purchase a new weekly plan to continue.
                  </p>
                </div>

                <div>
                  <h4 className="mb-1 font-semibold text-white">Do I need a plan to use the API?</h4>
                  <p className="text-sm leading-relaxed text-(--ink-muted)">
                    Yes, all AI endpoints require an active weekly plan. The public model catalog and
                    health check endpoints do not require authentication or a plan.
                  </p>
                </div>

                <div>
                  <h4 className="mb-1 font-semibold text-white">Can I have multiple API keys?</h4>
                  <p className="text-sm leading-relaxed text-(--ink-muted)">
                    Yes. You can create multiple keys for different projects or environments. All keys
                    share the same account-wide rate limits.
                  </p>
                </div>

                <div>
                  <h4 className="mb-1 font-semibold text-white">Where can I track my usage?</h4>
                  <p className="text-sm leading-relaxed text-(--ink-muted)">
                    The dashboard shows your current quota usage, remaining balance, burst state, and
                    next reset time. The data refreshes automatically every 15 seconds.
                  </p>
                </div>

                <div>
                  <h4 className="mb-1 font-semibold text-white">Is my data stored on the server?</h4>
                  <p className="text-sm leading-relaxed text-(--ink-muted)">
                    No. AI request contents and responses are not stored. Only usage metrics (quota
                    consumption, burst count, model used) and error logs are retained.
                  </p>
                </div>

                <div>
                  <h4 className="mb-1 font-semibold text-white">What is the difference between /ai/chat/completions and /ai/responses?</h4>
                  <p className="text-sm leading-relaxed text-(--ink-muted)">
                    <InlineCode>/ai/chat/completions</InlineCode> follows the OpenAI Chat Completions
                    format with <InlineCode>messages</InlineCode>. <InlineCode>/ai/responses</InlineCode>
                    follows the OpenAI Responses API format with <InlineCode>input</InlineCode>. Both
                    are proxied to the upstream model provider.
                  </p>
                </div>

                <div>
                  <h4 className="mb-1 font-semibold text-white">What does the default endpoint do?</h4>
                  <p className="text-sm leading-relaxed text-(--ink-muted)">
                    The <InlineCode>/ai/default/*</InlineCode> endpoints automatically fill in the
                    default model and reasoning effort if you do not specify them. This is useful
                    for quick experiments.
                  </p>
                </div>

                <div>
                  <h4 className="mb-1 font-semibold text-white">Can I cancel or change my plan?</h4>
                  <p className="text-sm leading-relaxed text-(--ink-muted)">
                    Yes. Use the &quot;Manage subscription&quot; button in the dashboard to access the
                    customer portal where you can cancel or modify your plan.
                  </p>
                </div>

                <div>
                  <h4 className="mb-1 font-semibold text-white">What if I need help?</h4>
                  <p className="text-sm leading-relaxed text-(--ink-muted)">
                    Contact us at <a className="text-(--brand) underline" href="mailto:contact@dekadans.net">contact@dekadans.net</a>
                    {" "}or via WhatsApp at +90 501 640 18 00.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-white/10 bg-[#0a0c10]/70 px-4 py-5 font-mono text-[13px] tracking-wider text-(--ink-muted) backdrop-blur-md md:px-6">
        <div className="mx-auto grid max-w-360 items-center gap-4 md:grid-cols-3">
          <div className="flex justify-center md:justify-start">
            <Link className="group flex items-center text-white transition hover:text-(--brand)" href="/">
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
            <Link className="transition hover:text-(--brand)" href="/">Home</Link>
            <Link className="transition hover:text-(--brand)" href="/docs">Docs</Link>
            <Link className="transition hover:text-(--brand)" href="mailto:contact@dekadans.net">Contact</Link>
          </div>
          <div className="text-center text-[#6d7677] md:text-right">&copy; 2026 Dekadans AI</div>
        </div>
      </footer>
    </>
  );
}
