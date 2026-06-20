import { polarClient } from "@polar-sh/better-auth/client";
import { apiKeyClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { assertSafeProductionUrl } from "@/lib/url-guard";

function resolveAuthBaseUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/auth`;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  assertSafeProductionUrl("NEXT_PUBLIC_APP_URL", appUrl);
  return `${appUrl.replace(/\/$/, "")}/api/auth`;
}

export const authClient = createAuthClient({
  baseURL: resolveAuthBaseUrl(),
  plugins: [apiKeyClient(), polarClient()]
});

export const useSession = authClient.useSession;
