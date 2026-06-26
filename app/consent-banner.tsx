"use client";

import { useEffect, useState } from "react";

import {
  CONSENT_KEY,
  CONSENT_PREFERENCES_EVENT,
  setConsentDeclined,
  setConsentGranted
} from "@/lib/mixpanel";

type ConsentState = "loading" | "show" | "hidden";

function getInitialConsentState(): ConsentState {
  if (typeof window === "undefined") return "loading";
  try {
    return localStorage.getItem(CONSENT_KEY) ? "hidden" : "show";
  } catch {
    return "show";
  }
}

export function ConsentBanner() {
  const [state, setState] = useState<ConsentState>(getInitialConsentState);

  useEffect(() => {
    function openPreferences() {
      setState("show");
    }

    window.addEventListener(CONSENT_PREFERENCES_EVENT, openPreferences);
    return () => {
      window.removeEventListener(CONSENT_PREFERENCES_EVENT, openPreferences);
    };
  }, []);

  function handleAccept() {
    setConsentGranted();
    setState("hidden");
  }

  function handleDecline() {
    setConsentDeclined();
    setState("hidden");
  }

  if (state !== "show") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 md:px-6 md:pb-6">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-4 rounded-2xl border border-white/10 bg-[#101214]/95 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.55)] backdrop-blur-xl md:flex-row md:items-center md:justify-between md:p-6">
        <p className="text-sm leading-6 text-white/70">
          We use analytics cookies to understand how you use our product. You can accept or
          decline tracking at any time.
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={handleDecline}
            className="cursor-pointer rounded-full border border-white/15 px-5 py-2 font-mono text-[12px] font-medium tracking-[0.05em] text-white/70 transition hover:border-white/30 hover:text-white active:scale-95"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="cursor-pointer rounded-full bg-(--brand) px-5 py-2 font-mono text-[12px] font-semibold tracking-[0.05em] text-[#002022]! shadow-[0_0_15px_rgba(0,242,255,0.3)] transition hover:shadow-[0_0_25px_rgba(0,242,255,0.5)] active:scale-95"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
