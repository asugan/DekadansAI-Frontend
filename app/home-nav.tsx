"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient, useSession } from "@/lib/auth-client";

export function HomeNavActions() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  async function handleSignOut() {
    await authClient.signOut();
    setIsProfileMenuOpen(false);
    router.refresh();
  }

  if (isSessionPending || !session?.user) {
    return (
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
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isProfileMenuOpen}
        aria-label="Open account menu"
        onClick={() => setIsProfileMenuOpen((current) => !current)}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#e1fdff] transition hover:border-cyan-300/40 hover:bg-cyan-300/10 active:scale-95"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <svg
          aria-hidden="true"
          className="absolute bottom-0 right-0 h-3.5 w-3.5 translate-x-1/4 translate-y-1/4 rounded-full border border-[#0a0c10] bg-[#101214] text-(--brand)"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M5.25 7.5 10 12.25 14.75 7.5 16 8.75l-6 6-6-6 1.25-1.25Z" />
        </svg>
      </button>
      {isProfileMenuOpen ? (
        <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#101214] shadow-[0_18px_55px_rgba(0,0,0,0.45)]">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="font-mono text-[12px] font-medium tracking-[0.05em] text-(--brand)">
              Account
            </p>
            <p className="mt-1 truncate text-sm text-(--ink-muted)">
              {session.user.email || "-"}
            </p>
          </div>
          <Link
            className="block px-4 py-3 font-mono text-[13px] tracking-[0.05em] text-[#e1fdff] transition hover:bg-cyan-300/10 hover:text-(--brand)"
            href="/dashboard"
            onClick={() => setIsProfileMenuOpen(false)}
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="block w-full px-4 py-3 text-left font-mono text-[13px] tracking-[0.05em] text-[#e1fdff] transition hover:bg-cyan-300/10 hover:text-(--brand)"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
