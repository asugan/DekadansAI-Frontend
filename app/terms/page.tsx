import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "../site-footer";

export const metadata: Metadata = {
  title: "Terms of Service | Dekadans AI",
  description: "Terms governing access to Dekadans AI, including accounts, subscriptions, API usage, and acceptable use."
};

const sections = [
  {
    title: "Acceptance of terms",
    body: [
      "By accessing or using Dekadans AI, you agree to these Terms of Service and to any policies referenced here. If you use the service on behalf of an organization, you represent that you have authority to bind that organization.",
      "If you do not agree to these terms, you may not use the website, dashboard, API gateway, or related services."
    ]
  },
  {
    title: "Service description",
    body: [
      "Dekadans AI provides a unified gateway for accessing third-party AI models through one account, API key, subscription, and quota system. Model availability, performance, pricing, limits, and upstream behavior may change over time.",
      "We may update, suspend, limit, or discontinue any part of the service when needed for security, reliability, legal compliance, provider availability, or business reasons."
    ]
  },
  {
    title: "Accounts and API keys",
    body: [
      "You are responsible for maintaining the confidentiality of your login credentials, sessions, and API keys. You must promptly rotate or revoke any key that may have been exposed.",
      "You are responsible for all activity under your account and must ensure that your use complies with applicable laws, these terms, and the policies of any upstream AI providers used through the service."
    ]
  },
  {
    title: "Subscriptions, quotas, and billing",
    body: [
      "Paid plans provide request or quota access for the plan period shown at purchase. Quota windows, weekly limits, model multipliers, pricing, and renewal terms are displayed in the product or billing flow and may vary by plan.",
      "Fees are charged through our payment processor. Unless required by law or expressly stated otherwise, payments are non-refundable and plan access does not roll over after expiration or cancellation."
    ]
  },
  {
    title: "Acceptable use",
    body: [
      "You may not use Dekadans AI to violate laws, infringe rights, compromise security, distribute malware, scrape or overload the service, bypass rate limits, resell access without permission, or generate content that is unlawful or abusive.",
      "We may throttle, suspend, or terminate access if we reasonably believe your use creates risk for Dekadans AI, other users, upstream providers, or the public."
    ]
  },
  {
    title: "AI outputs and responsibility",
    body: [
      "AI model outputs may be inaccurate, incomplete, offensive, or unsuitable for your intended use. You are responsible for reviewing outputs before relying on them and for making your own decisions about how to use them.",
      "You are responsible for your prompts, inputs, configuration, API integrations, and any content or applications you build with the service."
    ]
  },
  {
    title: "Third-party providers",
    body: [
      "Dekadans AI depends on third-party AI providers, infrastructure vendors, authentication providers, and payment processors. Your use of the service may be subject to additional terms or restrictions from those providers.",
      "We are not responsible for upstream outages, provider policy changes, model behavior, or third-party services outside our control."
    ]
  },
  {
    title: "Disclaimers and liability",
    body: [
      "The service is provided on an as-is and as-available basis without warranties of any kind, to the fullest extent permitted by law.",
      "To the fullest extent permitted by law, Dekadans AI will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, data, goodwill, or business interruption."
    ]
  }
];

export default function TermsPage() {
  return (
    <>
      <main className="mx-auto max-w-5xl px-4 pt-32 pb-24 md:px-6">
        <div className="mb-10 rounded-3xl border border-white/10 bg-black/80 p-8 md:p-10">
          <p className="mb-3 font-mono text-[12px] tracking-[0.18em] text-cyan-200/80">
            LEGAL
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
            Terms of Service
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-white/55 md:text-base">
            These Terms of Service govern your access to and use of Dekadans AI, including
            the website, dashboard, API gateway, subscriptions, documentation, and support.
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
              Questions about these terms can be sent to{" "}
              <a className="text-cyan-100 underline underline-offset-4" href="mailto:contact@dekadans.net">
                contact@dekadans.net
              </a>
              . Please also review our{" "}
              <Link className="text-cyan-100 underline underline-offset-4" href="/privacy">
                Privacy Policy
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
