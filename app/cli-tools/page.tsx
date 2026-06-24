import type { Metadata } from "next";
import Link from "next/link";

import {
  ANTHROPIC_COMPATIBLE_BASE_URL,
  CLI_TOOL_GUIDES,
  OPENAI_COMPATIBLE_BASE_URL,
  getCompatibilityLabel
} from "@/lib/cli-tool-guides";

import { CopyButton } from "./copy-button";

export const metadata: Metadata = {
  title: "CLI Setup | Dekadans AI",
  description:
    "Installation and configuration guide for using Claude CLI, OpenCode CLI, and Droid CLI with the Dekadans AI gateway."
};

function AnchorIcon() {
  return (
    <svg
      aria-hidden="true"
      className="inline h-4 w-4 text-(--brand) opacity-0 group-hover:opacity-100"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="group scroll-mt-28 text-2xl font-semibold tracking-tight text-white">
      <a href={`#${id}`} className="inline-flex items-center gap-2">
        {children}
        <AnchorIcon />
      </a>
    </h2>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[13px] text-cyan-200">
      {children}
    </code>
  );
}

function CodePanel({ label, code }: { label: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/70">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-white/45">
          {label}
        </span>
        <CopyButton value={code} />
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-6 text-white/85">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function CompatibilityBadge({ mode }: { mode: string }) {
  return (
    <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 font-mono text-[11px] font-semibold tracking-[0.08em] text-cyan-100">
      {mode}
    </span>
  );
}

export default function CliToolsPage() {
  return (
    <main className="relative overflow-hidden px-4 pt-32 pb-24 md:px-6">
      <div className="absolute inset-0 -z-20 bg-black" />
      <div className="absolute inset-x-0 top-0 -z-10 h-140 bg-[radial-gradient(circle_at_50%_20%,rgba(0,242,255,0.18),transparent_28%),radial-gradient(circle_at_30%_16%,rgba(168,85,247,0.16),transparent_26%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] opacity-25 mask-[linear-gradient(to_bottom,black,transparent)]" />

      <div className="mx-auto max-w-360">
        <section className="mb-16 max-w-4xl">
          <div className="mb-4 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 font-mono text-[12px] font-semibold tracking-[0.18em] text-cyan-200">
            CLI SETUP GUIDE
          </div>
          <h1 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-[#e1fdff] md:text-7xl">
            Connect CLI tools to Dekadans AI
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/58 md:text-lg">
            Install and configure Claude CLI, OpenCode CLI, and Droid CLI with the right API key,
            base URL, verification steps, and troubleshooting notes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-white px-6 py-3 font-mono text-[12px] font-semibold tracking-[0.04em] text-black! transition hover:bg-cyan-100 active:scale-95"
              href="/dashboard"
            >
              Create API Key
            </Link>
            <Link
              className="rounded-full border border-white/10 bg-white/10 px-6 py-3 font-mono text-[12px] font-medium tracking-[0.04em] text-white transition hover:border-white/20 hover:bg-white/15 active:scale-95"
              href="#tool-guides"
            >
              View Setups
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,2.4fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-1 border-l border-white/10 pl-5">
              {[
                { label: "Gateway", href: "#gateway" },
                { label: "Tools", href: "#tool-guides" },
                ...CLI_TOOL_GUIDES.map((tool) => ({ label: tool.name, href: `#${tool.slug}` })),
                { label: "Comparison", href: "#comparison" }
              ].map((item) => (
                <a
                  key={item.href}
                  className="block py-1 font-mono text-[13px] tracking-wider text-(--ink-muted) transition hover:text-(--brand)"
                  href={item.href}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </aside>

          <div className="min-w-0 space-y-16">
            <section id="gateway" className="scroll-mt-28">
              <SectionHeading id="gateway">Gateway basics</SectionHeading>
              <p className="mt-4 max-w-3xl leading-7 text-(--ink-muted)">
                CLI tools connect to Dekadans AI through two compatibility modes. The API key stays
                the same, while the base URL and provider format depend on the client.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <article className="rounded-3xl border border-white/10 bg-black/70 p-5">
                  <p className="font-mono text-[12px] font-semibold tracking-[0.14em] text-cyan-200">
                    OPENAI-COMPATIBLE
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-white">Chat Completions / Responses</p>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    Use this for OpenCode and clients that expect the OpenAI request format.
                  </p>
                  <div className="mt-4">
                    <InlineCode>{OPENAI_COMPATIBLE_BASE_URL}</InlineCode>
                  </div>
                </article>
                <article className="rounded-3xl border border-white/10 bg-black/70 p-5">
                  <p className="font-mono text-[12px] font-semibold tracking-[0.14em] text-purple-200">
                    ANTHROPIC-COMPATIBLE
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-white">Messages API</p>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    Use this for Claude CLI and clients that expect the Anthropic Messages format.
                  </p>
                  <div className="mt-4">
                    <InlineCode>{ANTHROPIC_COMPATIBLE_BASE_URL}</InlineCode>
                  </div>
                </article>
              </div>
            </section>

            <section id="tool-guides" className="scroll-mt-28">
              <SectionHeading id="tool-guides">Supported CLI tools</SectionHeading>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {CLI_TOOL_GUIDES.map((tool) => (
                  <a
                    key={tool.slug}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/75 p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-200/30"
                    href={`#${tool.slug}`}
                  >
                    <div className="absolute inset-0 bg-linear-to-br from-cyan-300/10 via-transparent to-purple-500/10 opacity-0 transition group-hover:opacity-100" />
                    <div className="relative">
                      <CompatibilityBadge mode={getCompatibilityLabel(tool.compatibility)} />
                      <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-white">
                        {tool.name}
                      </h3>
                      <p className="mt-2 font-mono text-[12px] tracking-[0.12em] text-white/35">
                        {tool.tagline}
                      </p>
                      <p className="mt-5 text-sm leading-6 text-white/55">{tool.summary}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            {CLI_TOOL_GUIDES.map((tool, index) => (
              <section key={tool.slug} id={tool.slug} className="scroll-mt-28">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="mb-3 font-mono text-[12px] font-semibold tracking-[0.16em] text-cyan-200/80">
                      0{index + 1} / {tool.tagline}
                    </p>
                    <SectionHeading id={tool.slug}>{tool.name}</SectionHeading>
                    <p className="mt-4 max-w-3xl leading-7 text-(--ink-muted)">{tool.summary}</p>
                  </div>
                  <a
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-[12px] font-semibold tracking-[0.08em] text-white/70 transition hover:border-cyan-300/40 hover:text-cyan-100"
                    href={tool.officialDocsUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Official Docs
                  </a>
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
                  <div className="space-y-5">
                    <div className="rounded-3xl border border-white/10 bg-black/70 p-5">
                      <h3 className="text-lg font-semibold text-white">Install commands</h3>
                      <div className="mt-4 space-y-3">
                        {tool.installCommands.map((command) => (
                          <CodePanel
                            key={`${tool.slug}-${command.label}`}
                            code={command.command}
                            label={command.label}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-black/70 p-5">
                      <h3 className="text-lg font-semibold text-white">Dekadans configuration</h3>
                      <p className="mt-2 text-sm leading-6 text-white/55">
                        Config file: <InlineCode>{tool.configFile}</InlineCode>
                      </p>
                      <div className="mt-4">
                        <CodePanel code={tool.configExample} label="configuration" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                      <h3 className="text-lg font-semibold text-white">Best for</h3>
                      <p className="mt-3 text-sm leading-6 text-white/58">{tool.bestFor}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {tool.envVars.map((envVar) => (
                          <span
                            key={envVar}
                            className="rounded-full border border-white/10 bg-black/60 px-3 py-1 font-mono text-[11px] text-cyan-100"
                          >
                            {envVar}
                          </span>
                        ))}
                      </div>
                    </article>

                    <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                      <h3 className="text-lg font-semibold text-white">Verification</h3>
                      <ol className="mt-4 list-inside list-decimal space-y-2 text-sm leading-6 text-white/58">
                        {tool.verifyCommands.map((command) => (
                          <li key={command}>
                            <InlineCode>{command}</InlineCode>
                          </li>
                        ))}
                      </ol>
                    </article>

                    <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                      <h3 className="text-lg font-semibold text-white">Checklist</h3>
                      <ul className="mt-4 space-y-3 text-sm leading-6 text-white/58">
                        {tool.checklist.map((item) => (
                          <li key={item} className="flex gap-3">
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-(--brand)" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-amber-300/15 bg-amber-300/5 p-5">
                  <h3 className="text-lg font-semibold text-amber-100">Common issues</h3>
                  <ul className="mt-4 grid gap-3 text-sm leading-6 text-amber-50/65 md:grid-cols-3">
                    {tool.troubleshooting.map((item) => (
                      <li key={item} className="rounded-2xl border border-amber-300/10 bg-black/30 p-4">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ))}

            <section id="comparison" className="scroll-mt-28">
              <SectionHeading id="comparison">Comparison table</SectionHeading>
              <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-black/70">
                <table className="w-full min-w-220 border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03] text-left font-mono text-[12px] tracking-[0.12em] text-white/45">
                      <th className="px-5 py-4">Tool</th>
                      <th className="px-5 py-4">Compatibility</th>
                      <th className="px-5 py-4">Config</th>
                      <th className="px-5 py-4">Env</th>
                      <th className="px-5 py-4">Recommended Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CLI_TOOL_GUIDES.map((tool) => (
                      <tr key={tool.slug} className="border-b border-white/10 last:border-0">
                        <td className="px-5 py-4 font-semibold text-white">{tool.name}</td>
                        <td className="px-5 py-4 text-white/60">{getCompatibilityLabel(tool.compatibility)}</td>
                        <td className="px-5 py-4 font-mono text-[13px] text-cyan-100">{tool.configFile}</td>
                        <td className="px-5 py-4 font-mono text-[13px] text-white/60">
                          {tool.envVars.join(", ")}
                        </td>
                        <td className="px-5 py-4 text-white/60">{tool.bestFor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
