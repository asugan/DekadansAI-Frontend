import Link from "next/link";

import { HomeNavActions } from "./home-nav";

const NAV_ITEMS = [
  { label: "Models", href: "/#models" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Docs", href: "/docs" }
];

export function AppNav() {
  return (
    <nav className="fixed left-0 top-0 z-50 w-full px-4 py-4 md:px-6">
      <div className="mx-auto grid max-w-360 grid-cols-3 items-center rounded-full border border-white/10 bg-black/45 px-4 py-2 backdrop-blur-xl">
        <div className="hidden items-center gap-5 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              className="font-mono text-[12px] tracking-wider text-white/70 transition hover:text-(--brand)"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <Link
          className="col-start-1 justify-self-start font-mono text-sm font-semibold tracking-[0.18em] text-white transition hover:text-(--brand) md:col-start-2 md:justify-self-center"
          href="/"
        >
          Dekadans AI
        </Link>
        <div className="col-span-2 justify-self-end md:col-span-1">
          <HomeNavActions />
        </div>
      </div>
    </nav>
  );
}
