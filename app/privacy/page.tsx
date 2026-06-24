import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "../site-footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Dekadans AI",
  description: "Privacy practices for Dekadans AI accounts, billing, API gateway usage, and support."
};

const sections = [
  {
    title: "Information we collect",
    body: [
      "We collect account information you provide when you sign in, subscribe, contact support, or manage your API access. This may include your name, email address, authentication provider profile, billing status, customer identifiers, and support messages.",
      "When you use the gateway, we process technical and usage information such as API key identifiers, model selected, request timing, quota consumption, rate-limit events, error metadata, IP-derived security signals, and device or browser data needed to operate the service."
    ]
  },
  {
    title: "AI request content",
    body: [
      "Dekadans AI routes your prompts, inputs, files, and model responses to the selected upstream AI provider only for the purpose of fulfilling your request. We do not use your API content to train our own models.",
      "We do not intentionally store full AI request or response content in our application database. Temporary processing, provider-side retention, infrastructure logs, or security tooling may still occur where necessary to deliver, troubleshoot, and protect the service."
    ]
  },
  {
    title: "How we use information",
    body: [
      "We use information to provide the API gateway, authenticate accounts, enforce quotas and rate limits, process payments, prevent abuse, maintain security, improve reliability, communicate with you, and comply with legal obligations.",
      "Aggregated or de-identified usage statistics may be used to understand product performance, model demand, and system health."
    ]
  },
  {
    title: "Payments and providers",
    body: [
      "Payments and subscription management may be handled by third-party payment processors. We do not store full card numbers on our servers.",
      "AI requests are sent to third-party model providers and infrastructure vendors that help us operate Dekadans AI. Their handling of data may be governed by their own terms and privacy policies."
    ]
  },
  {
    title: "Security and retention",
    body: [
      "We use reasonable administrative, technical, and organizational safeguards designed to protect account data and API access. No internet service can be guaranteed to be completely secure.",
      "We retain account, billing, usage, and operational records for as long as needed to provide the service, resolve disputes, enforce agreements, maintain security, and meet legal or accounting requirements."
    ]
  },
  {
    title: "Your choices",
    body: [
      "You may request access, correction, deletion, or export of personal information by contacting us. We may need to verify your identity before acting on a request.",
      "You can delete API keys from your dashboard and manage or cancel your subscription through the billing portal when available."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <>
      <main className="mx-auto max-w-5xl px-4 pt-32 pb-24 md:px-6">
        <div className="mb-10 rounded-3xl border border-white/10 bg-black/80 p-8 md:p-10">
          <p className="mb-3 font-mono text-[12px] tracking-[0.18em] text-cyan-200/80">
            LEGAL
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-white/55 md:text-base">
            This Privacy Policy explains how Dekadans AI collects, uses, shares, and protects
            information when you use our website, dashboard, API gateway, billing features, and
            support channels.
          </p>
          <p className="mt-4 font-mono text-[12px] tracking-wider text-white/40">
            Effective date: June 24, 2026
          </p>
        </div>

        <div className="space-y-5">
          {sections.map((section) => (
            <section className="rounded-3xl border border-white/10 bg-black/70 p-6" key={section.title}>
              <h2 className="mb-4 text-2xl font-semibold tracking-[-0.03em] text-white">
                {section.title}
              </h2>
              <div className="space-y-3 text-sm leading-6 text-white/55 md:text-base">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-3xl border border-white/10 bg-black/70 p-6">
            <h2 className="mb-4 text-2xl font-semibold tracking-[-0.03em] text-white">
              Contact
            </h2>
            <p className="text-sm leading-6 text-white/55 md:text-base">
              For privacy questions or requests, contact us at{" "}
              <a className="text-cyan-100 underline underline-offset-4" href="mailto:contact@dekadans.net">
                contact@dekadans.net
              </a>
              . You can also review our{" "}
              <Link className="text-cyan-100 underline underline-offset-4" href="/terms">
                Terms of Service
              </Link>
              .
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
