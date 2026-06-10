import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const models = [
    { name: "Minimax M3", version: "minimax-m3", logo: "/minimax.png" },
    { name: "GLM 5.1", version: "glm-5.1", logo: "/zai.jpg" },
    { name: "Kimi K2.6", version: "kimi-k2.6", logo: "/kimilogo.webp" },
    { name: "ChatGPT 5.5", version: "gpt-5.5", logo: "/chatgptlogo.png" }
  ];
  const pricingItems = [
    ["⚡", "300 requests included"],
    ["◴", "Up to 5 hours of AI usage"],
    ["▦", "Multiple model access"],
    ["⌁", "API key included"],
    ["▥", "Usage dashboard"]
  ];
  const developerItems = [
    "Unified billing and invoicing",
    "Real-time usage monitoring",
    "Standardized API responses"
  ];

  return (
    <>
      <nav className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#0a0c10]/70 px-4 py-4 backdrop-blur-md md:px-6">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <div className="flex items-center gap-8">
            <Link className="text-xl font-bold tracking-tighter text-white transition hover:text-[var(--brand)]" href="/">
              Dekadans AI
            </Link>
            <div className="hidden items-center gap-6 md:flex">
              {["Models", "Pricing", "Docs"].map((item) => (
                <Link
                  key={item}
                  className="font-mono text-[13px] tracking-wider text-[var(--ink-muted)] transition hover:text-[var(--brand)]"
                  href={`#${item.toLowerCase()}`}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              className="hidden font-mono text-[13px] tracking-wider text-[var(--ink-muted)] transition hover:text-[var(--brand)] md:block"
              href="/login"
            >
              Login
            </Link>
            <Link
              className="rounded bg-[var(--brand)] px-4 py-2 font-mono text-[13px] tracking-wider text-[#00363a] shadow-[0_0_15px_rgba(0,242,255,0.3)] transition hover:shadow-[0_0_25px_rgba(0,242,255,0.5)] active:scale-95"
              href="/register"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="overflow-hidden pb-24 pt-32">
        <section className="relative mx-auto mb-32 max-w-[1440px] px-4 md:mb-48 md:px-6">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
            <div className="space-y-8 md:col-span-6">
              <div className="inline-block rounded border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 font-mono text-[13px] font-medium tracking-wider text-cyan-300">
                v2.0 Unified API Gateway
              </div>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-[-0.02em] text-[#e1fdff] md:text-5xl">
                One API for MiniMax, GLM, Kimi, and ChatGPT
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-[var(--ink-muted)]">
                Get secure, request-limited access to multiple frontier AI models with a single
                API key powered by CLIProxy.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  className="rounded bg-[var(--brand)] px-6 py-3 font-mono text-[13px] tracking-wider text-[#00363a] shadow-[0_0_15px_rgba(0,242,255,0.3)] transition hover:shadow-[0_0_25px_rgba(0,242,255,0.5)] active:scale-95"
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

            <div className="relative h-[400px] overflow-hidden rounded-lg border border-white/10 bg-[#1a1c20] md:col-span-6 md:h-[500px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(0,242,255,0.28),transparent_24%),radial-gradient(circle_at_82%_62%,rgba(168,85,247,0.24),transparent_28%),linear-gradient(135deg,rgba(0,242,255,0.08),rgba(111,0,190,0.06))]" />
              <div className="absolute inset-0 opacity-35 [background-image:repeating-linear-gradient(150deg,transparent_0px,transparent_20px,rgba(255,255,255,0.12)_21px,transparent_23px)]" />
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

        <section className="mx-auto mb-32 max-w-[1440px] px-4 md:mb-48 md:px-6" id="models">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Unified Model Access
            </h2>
            <p className="mx-auto max-w-2xl text-[var(--ink-muted)]">
              Route your AI requests through a unified gateway instead of managing multiple
              providers separately.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
            {models.map((model) => (
              <article
                className="group relative rounded-lg border border-white/10 bg-[#1e2024] p-6 transition hover:border-cyan-300/40"
                key={model.name}
              >
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-300/5 to-transparent opacity-0 transition group-hover:opacity-100" />
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
        </section>

        <section className="relative mx-auto mb-32 max-w-[1440px] px-4 md:mb-48 md:px-6" id="docs">
          <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
            <div className="order-2 overflow-hidden rounded-lg border border-white/10 bg-[#1a1c20] md:order-1">
              <div className="border-b border-white/10 bg-[#1e2024] px-4 py-3">
                <span className="font-mono text-[13px] tracking-wider text-[var(--ink-muted)]">
                  usage_dashboard.js
                </span>
              </div>
              <div className="space-y-6 p-6">
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-[13px] tracking-wider">
                    <span>Remaining Requests</span>
                    <span className="text-[#e1fdff]">184 / 300</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#333539]">
                    <div className="h-full w-[61%] bg-[var(--brand)] shadow-[0_0_15px_rgba(0,242,255,0.3)]" />
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
              <p className="leading-relaxed text-[var(--ink-muted)]">
                No more juggling separate accounts and billing. One key, all the frontier models
                you need. Track your usage in real-time.
              </p>
              <ul className="space-y-4 font-mono text-[13px] tracking-wider text-[var(--ink-muted)]">
                {developerItems.map((item) => (
                  <li className="flex items-center gap-3" key={item}>
                    <span className="text-[var(--brand)]">⊙</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto mb-32 max-w-[1440px] px-4 md:mb-48 md:px-6" id="pricing">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Simple Weekly Pricing
            </h2>
          </div>
          <div className="group relative mx-auto max-w-md">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] opacity-25 blur transition duration-1000 group-hover:opacity-40" />
            <div className="relative flex h-full flex-col rounded-xl border border-white/10 bg-[#282a2e] p-8">
              <div className="mb-8">
                <h3 className="mb-2 text-2xl font-semibold text-[#e1fdff]">Weekly Access</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold leading-none text-white">$10</span>
                  <span className="font-mono text-[13px] tracking-wider text-[var(--ink-muted)]">/ week</span>
                </div>
              </div>
              <ul className="mb-8 flex-1 space-y-4">
                {pricingItems.map(([icon, item]) => (
                  <li className="flex items-start gap-3" key={item}>
                    <span className="mt-0.5 text-[var(--brand)]">{icon}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                className="mb-4 w-full rounded bg-[var(--brand)] py-4 text-center font-mono text-[13px] tracking-wider text-[#00363a] shadow-[0_0_15px_rgba(0,242,255,0.3)] transition hover:shadow-[0_0_25px_rgba(0,242,255,0.5)] active:scale-95"
                href="/register"
              >
                Start Weekly Access
              </Link>
              <p className="text-center font-mono text-sm leading-6 text-[#849495]">
                $10 per week includes up to 5 hours of AI access or 300 requests, whichever comes
                first.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex w-full flex-col items-center justify-between gap-8 border-t border-white/5 bg-[#0c0e12] px-4 py-12 font-mono text-[13px] tracking-wider text-[#454747] md:flex-row md:px-6">
        <div className="font-sans text-xl font-bold tracking-tight text-white">Dekadans AI</div>
        <div className="flex flex-wrap justify-center gap-6">
          {["Privacy Policy", "Terms of Service", "API Status", "GitHub", "Discord"].map((item) => (
            <Link className="transition hover:text-[var(--brand)]" href="#" key={item}>
              {item}
            </Link>
          ))}
        </div>
        <div>© 2024 Dekadans AI. Powered by CLIProxy</div>
      </footer>
    </>
  );
}
