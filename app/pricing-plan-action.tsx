"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getBillingSnapshot } from "@/lib/account-client";
import { authClient, useSession } from "@/lib/auth-client";

type PricingPlanActionProps = {
  slug: string;
  name: string;
};

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return {};
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const value = error as {
    message?: string;
    code?: string;
  };

  if (typeof value.message === "string" && value.message.trim()) {
    return value.message;
  }

  if (typeof value.code === "string" && value.code.trim()) {
    return value.code;
  }

  return fallback;
}

function extractRedirectUrl(payload: unknown): string | null {
  const parsed = asObject(payload);
  return typeof parsed.url === "string" && parsed.url.trim() ? parsed.url : null;
}

export function PricingPlanAction({ slug, name }: PricingPlanActionProps) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleClick() {
    setErrorMessage(null);

    if (isSessionPending) {
      return;
    }

    if (!session?.user) {
      router.push("/login");
      return;
    }

    setIsProcessing(true);

    try {
      const billingSnapshot = await getBillingSnapshot();

      if (billingSnapshot.weeklyPlan.active) {
        router.push("/dashboard");
        return;
      }

      const { data, error } = await authClient.checkout({
        slug,
        redirect: false
      });

      if (error) {
        setErrorMessage(resolveErrorMessage(error, "Unable to start checkout."));
        return;
      }

      const checkoutUrl = extractRedirectUrl(data);
      if (!checkoutUrl) {
        setErrorMessage("Checkout did not return a redirect URL.");
        return;
      }

      window.location.assign(checkoutUrl);
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error, "Unable to check billing status."));
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="mt-auto">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={isProcessing || isSessionPending}
        className="w-full cursor-pointer rounded-full bg-white px-6 py-3 text-center font-mono text-[12px] font-semibold tracking-[0.04em] text-black transition hover:bg-cyan-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-65"
      >
        {isProcessing || isSessionPending ? "Checking..." : `Start ${name} Plan`}
      </button>
      {errorMessage ? (
        <p className="mt-3 rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
