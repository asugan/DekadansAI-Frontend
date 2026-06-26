"use client";

import mixpanel, { type OverridedMixpanel } from "mixpanel-browser";

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
export const CONSENT_KEY = "dekadans_analytics_consent";
export const CONSENT_GRANTED_EVENT = "dekadans_analytics_consent_granted";
export const CONSENT_PREFERENCES_EVENT = "dekadans_analytics_preferences_opened";

let isInitialized = false;

function ensureInit(): boolean {
  if (isInitialized) return true;
  if (!MIXPANEL_TOKEN || typeof window === "undefined") return false;

  mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV !== "production",
    opt_out_tracking_by_default: true,
    persistence: "localStorage",
    track_pageview: false
  });

  isInitialized = true;
  return true;
}

export function getMixpanel(): OverridedMixpanel | null {
  if (typeof window === "undefined") return null;
  if (!ensureInit()) return null;
  return mixpanel;
}

export function hasConsented(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

export function setConsentGranted() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_KEY, "granted");
  } catch {
    // localStorage may be blocked
  }

  if (!ensureInit()) return;
  mixpanel.opt_in_tracking();
  window.dispatchEvent(new Event(CONSENT_GRANTED_EVENT));
}

export function setConsentDeclined() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_KEY, "declined");
  } catch {
    // localStorage may be blocked
  }

  if (!ensureInit()) return;
  mixpanel.opt_out_tracking();
}

export function track(eventName: string, properties?: Record<string, unknown>): boolean {
  if (!hasConsented()) return false;
  const mp = getMixpanel();
  if (!mp) return false;

  mp.track(eventName, {
    platform: "web",
    ...properties
  });
  return true;
}

export function identify(userId: string, userProperties?: Record<string, unknown>): boolean {
  if (!hasConsented()) return false;
  const mp = getMixpanel();
  if (!mp) return false;

  mp.identify(userId);
  if (userProperties) {
    mp.people.set(userProperties);
  }
  return true;
}

export function resetIdentity() {
  if (typeof window === "undefined") return;
  if (!ensureInit()) return;
  mixpanel.reset();
}
