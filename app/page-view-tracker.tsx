"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { CONSENT_GRANTED_EVENT, track as mixpanelTrack } from "@/lib/mixpanel";

function pageNameFromPath(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname === "/login") return "login";
  if (pathname === "/dashboard") return "dashboard";
  if (pathname === "/docs") return "docs";
  if (pathname === "/cli-tools") return "cli-tools";
  if (pathname === "/terms") return "terms";
  if (pathname === "/privacy") return "privacy";
  return pathname;
}

export function PageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    mixpanelTrack("page_viewed", {
      page_path: pathname,
      page_name: pageNameFromPath(pathname)
    });
  }, [pathname]);

  useEffect(() => {
    function handleConsentGranted() {
      if (lastPath.current) {
        mixpanelTrack("page_viewed", {
          page_path: lastPath.current,
          page_name: pageNameFromPath(lastPath.current)
        });
      }
    }

    window.addEventListener(CONSENT_GRANTED_EVENT, handleConsentGranted);
    return () => {
      window.removeEventListener(CONSENT_GRANTED_EVENT, handleConsentGranted);
    };
  }, []);

  return null;
}
