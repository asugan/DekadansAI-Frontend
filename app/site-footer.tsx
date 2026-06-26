import Image from "next/image";
import Link from "next/link";

import { AnalyticsPreferencesButton } from "./analytics-preferences-button";

const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Docs", href: "/docs" },
  { label: "Contact", href: "mailto:contact@dekadans.net" },
  { label: "API Status", href: "#" },
  { label: "Discord", href: "#" },
];

export function SiteFooter({ className = "bg-black/70" }: { className?: string }) {
  return (
    <footer
      className={`w-full border-t border-white/10 px-4 py-5 font-mono text-[13px] tracking-wider text-(--ink-muted) backdrop-blur-md md:px-6 ${className}`}
    >
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
          {FOOTER_LINKS.map((item) => (
            <Link className="transition hover:text-(--brand)" href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
          <AnalyticsPreferencesButton />
        </div>
        <div className="text-center text-[#6d7677] md:text-right">© 2026 Dekadans AI</div>
      </div>
    </footer>
  );
}
