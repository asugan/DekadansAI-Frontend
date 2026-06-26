"use client";

import { CONSENT_PREFERENCES_EVENT } from "@/lib/mixpanel";

export function AnalyticsPreferencesButton() {
  function handleClick() {
    window.dispatchEvent(new Event(CONSENT_PREFERENCES_EVENT));
  }

  return (
    <button
      className="cursor-pointer appearance-none border-0 bg-transparent p-0 font-inherit tracking-inherit text-inherit"
      onClick={handleClick}
      type="button"
    >
      Analytics Preferences
    </button>
  );
}
