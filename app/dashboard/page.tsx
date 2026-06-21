"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  ApiRequestError,
  type BillingSnapshot,
  type ModelInfo,
  type RateLimitSnapshot,
  type UsageSnapshot,
  getBillingSnapshot,
  getModelsSnapshot,
  getRateLimitSnapshot,
  getUsageSnapshot
} from "@/lib/account-client";
import { authClient, useSession } from "@/lib/auth-client";
import { getModelPresentation } from "@/lib/model-presentation";
import { getMarketingPlan } from "@/lib/plan-display";

const POLL_INTERVAL_MS = 15000;

type BillingStatus = "loading" | "active" | "inactive" | "error";

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return {};
}

function formatTime(value: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function formatResetIn(value: string | null): string {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  const diffMs = parsed.getTime() - Date.now();
  if (diffMs <= 0) return "now";

  const minutes = Math.ceil(diffMs / 60000);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  const hours = Math.ceil(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  const days = Math.ceil(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
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

function extractCreatedKey(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const raw = payload as {
    key?: unknown;
  };

  return typeof raw.key === "string" && raw.key.trim() ? raw.key : null;
}

function maskKey(start: string | null): string {
  if (!start) return "hidden-key";
  return `${start}...`;
}

function formatCount(value: number | undefined): string {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function formatTokenValue(value: number | undefined): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2
  }).format(value ?? 0);
}

function extractRedirectUrl(payload: unknown): string | null {
  const parsed = asObject(payload);
  return typeof parsed.url === "string" && parsed.url.trim() ? parsed.url : null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();

  const [snapshot, setSnapshot] = useState<RateLimitSnapshot | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(true);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [usageSnapshot, setUsageSnapshot] = useState<UsageSnapshot | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [billingStatus, setBillingStatus] = useState<BillingStatus>("loading");
  const [billingError, setBillingError] = useState<string | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [billingSnapshotFull, setBillingSnapshotFull] = useState<BillingSnapshot | null>(null);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [checkoutSlug, setCheckoutSlug] = useState<string | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const [keyName, setKeyName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const loadSnapshot = useCallback(
    async (silent: boolean) => {
      if (!silent) {
        setIsLoadingSnapshot(true);
      }

      setSnapshotError(null);

      try {
        const payload = await getRateLimitSnapshot();
        setSnapshot(payload);
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 401) {
          router.replace("/login");
          return;
        }

        setSnapshotError(resolveErrorMessage(error, "Unable to load rate limit data."));
      } finally {
        setIsLoadingSnapshot(false);
      }
    },
    [router]
  );

  const loadUsage = useCallback(
    async (silent: boolean) => {
      if (!silent) {
        setIsLoadingUsage(true);
      }

      setUsageError(null);

      try {
        const payload = await getUsageSnapshot();
        setUsageSnapshot(payload);
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 401) {
          router.replace("/login");
          return;
        }

        setUsageError(resolveErrorMessage(error, "Unable to load usage statistics."));
      } finally {
        setIsLoadingUsage(false);
      }
    },
    [router]
  );

  const loadBillingStatus = useCallback(async () => {
    setBillingError(null);

    try {
      const payload = await getBillingSnapshot();
      setBillingSnapshotFull(payload);
      setBillingStatus(payload.weeklyPlan.active ? "active" : "inactive");
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        router.replace("/login");
        return;
      }

      setBillingStatus("error");
      setBillingError(resolveErrorMessage(error, "Unable to load billing details."));
    }
  }, [router]);

  const loadModels = useCallback(async () => {
    setModelsError(null);
    setIsLoadingModels(true);

    try {
      const payload = await getModelsSnapshot();
      setModels(payload.data);
      setSelectedModelId((current) =>
        payload.data.some((model) => model.id === current) ? current : payload.data[0]?.id || ""
      );
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        router.replace("/login");
        return;
      }

      setModelsError(resolveErrorMessage(error, "Unable to load the model list."));
    } finally {
      setIsLoadingModels(false);
    }
  }, [router]);

  useEffect(() => {
    if (isSessionPending) return;

    if (!session?.user) {
      router.replace("/login");
      return;
    }

    void loadSnapshot(false);
    void loadUsage(false);
    void loadBillingStatus();
    void loadModels();
    const timer = window.setInterval(() => {
      void loadSnapshot(true);
      void loadUsage(true);
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [isSessionPending, loadBillingStatus, loadModels, loadSnapshot, loadUsage, router, session?.user]);

  const sessionUsagePercent = useMemo(() => {
    if (!snapshot || snapshot.account.quota.max <= 0) return 0;
    return Math.min(100, Math.round((snapshot.account.quota.used / snapshot.account.quota.max) * 100));
  }, [snapshot]);

  const weeklyUsagePercent = useMemo(() => {
    if (!snapshot?.account.weekly || snapshot.account.weekly.max <= 0) return 0;
    return Math.min(100, Math.round((snapshot.account.weekly.used / snapshot.account.weekly.max) * 100));
  }, [snapshot]);

  const usageTierLabel = billingSnapshotFull?.weeklyPlan.tier?.label || snapshot?.tier?.label || "Plan";

  const selectedModel = useMemo(
    () => models.find((model) => model.id === selectedModelId) || null,
    [models, selectedModelId]
  );

  const usageByKeyId = useMemo(() => {
    const entries = new Map<string, UsageSnapshot["byKey"][number]>();
    for (const item of usageSnapshot?.byKey ?? []) {
      entries.set(item.id, item);
    }

    return entries;
  }, [usageSnapshot]);

  const selectedModelCurl = useMemo(
    () => `curl -X POST https://api.dekadans.net/ai/chat/completions \\
  -H "Authorization: Bearer dk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${selectedModelId || "model-id"}",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`,
    [selectedModelId]
  );

  async function handleCreateKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);
    setDeleteError(null);
    setCreatedKey(null);

    setIsCreatingKey(true);

    try {
      const { data, error } = await authClient.apiKey.create({
        name: keyName.trim() || undefined
      });

      if (error) {
        setCreateError(resolveErrorMessage(error, "Unable to create an API key."));
        return;
      }

      const generatedKey = extractCreatedKey(data);
      if (!generatedKey) {
        setCreateError("The API key was created, but the key value was not returned.");
        return;
      }

      setCreatedKey(generatedKey);
      setKeyName("");
      await loadSnapshot(true);
    } finally {
      setIsCreatingKey(false);
    }
  }

  async function handleCopyKey() {
    if (!createdKey) return;

    try {
      await navigator.clipboard.writeText(createdKey);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }

    window.setTimeout(() => {
      setCopyState("idle");
    }, 1600);
  }

  async function handleDeleteKey(keyId: string) {
    setDeleteError(null);
    setDeletingKeyId(keyId);

    try {
      const { error } = await authClient.apiKey.delete({
        keyId
      });

      if (error) {
        setDeleteError(resolveErrorMessage(error, "Unable to delete the API key."));
        return;
      }

      await loadSnapshot(true);
    } finally {
      setDeletingKeyId(null);
    }
  }

  async function handleStartCheckout(slug: string) {
    setBillingError(null);
    setIsStartingCheckout(true);
    setCheckoutSlug(slug);

    try {
      const { data, error } = await authClient.checkout({
        slug,
        redirect: false
      });

      if (error) {
        setBillingError(resolveErrorMessage(error, "Unable to start checkout."));
        return;
      }

      const checkoutUrl = extractRedirectUrl(data);
      if (!checkoutUrl) {
        setBillingError("Checkout did not return a redirect URL.");
        return;
      }

      window.location.assign(checkoutUrl);
    } finally {
      setIsStartingCheckout(false);
      setCheckoutSlug(null);
    }
  }

  async function handleOpenPortal() {
    setBillingError(null);
    setIsOpeningPortal(true);

    try {
      const { data, error } = await authClient.customer.portal();

      if (error) {
        setBillingError(resolveErrorMessage(error, "Unable to open the customer portal."));
        return;
      }

      const portalUrl = extractRedirectUrl(data);
      if (portalUrl) {
        window.location.assign(portalUrl);
      }
    } finally {
      setIsOpeningPortal(false);
    }
  }

  if (isSessionPending || (!session?.user && !snapshotError)) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 pb-10 pt-32">
        <div className="panel w-full max-w-md p-8 text-center">
          <p className="headline text-xl font-semibold">Checking your session...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-8 pt-32 md:px-8 md:pb-10">
      <section className="panel group relative mb-6 overflow-hidden border-cyan-300/15 bg-[#101214]/80 p-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_20%,rgba(0,242,255,0.16),transparent_26%),radial-gradient(circle_at_92%_22%,rgba(168,85,247,0.14),transparent_28%),linear-gradient(135deg,rgba(0,242,255,0.06),rgba(168,85,247,0.04))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/50 to-transparent" />
        <div className="relative flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="min-w-0">
            <p className="font-mono text-[13px] font-medium tracking-[0.05em] text-(--brand)">
              Weekly Plan
            </p>
            {billingStatus === "active" && billingSnapshotFull?.weeklyPlan.tier ? (
              <>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#e1fdff]">
                  {billingSnapshotFull.weeklyPlan.tier.label}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-(--ink-muted)">
                  {billingSnapshotFull.weeklyPlan.tier.quotaMax} requests every 5 hours &middot;{' '}
                  {billingSnapshotFull.weeklyPlan.tier.weeklyQuotaMax} weekly limit
                </p>
              </>
            ) : billingStatus === "active" ? (
              <>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#e1fdff]">Weekly plan active</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-(--ink-muted)">
                  An active weekly plan is required to use AI endpoints. Limits apply at the account
                  level.
                </p>
              </>
            ) : billingStatus === "loading" ? (
              <>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#e1fdff]">Checking plan status</h2>
              </>
            ) : (
              <>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#e1fdff]">Weekly plan required</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-(--ink-muted)">
                  Choose a plan to get started. All plans include 5 hours of AI access.
                </p>
              </>
            )}
            {billingError ? (
              <p className="mt-3 rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {billingError}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {billingStatus === "active" ? (
              <button
                type="button"
                onClick={() => void handleOpenPortal()}
                disabled={isOpeningPortal}
                className="rounded-sm bg-(--brand) px-5 py-3 font-mono text-[13px] font-semibold tracking-[0.05em] text-[#002022]! shadow-[0_0_15px_rgba(0,242,255,0.3)] transition hover:shadow-[0_0_25px_rgba(0,242,255,0.5)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-65"
              >
                {isOpeningPortal ? "Opening..." : "Manage subscription"}
              </button>
            ) : (
              <>
                {(billingSnapshotFull?.planTiers ?? []).map((tier) => (
                  <button
                    key={tier.slug}
                    type="button"
                    onClick={() => void handleStartCheckout(tier.slug)}
                    disabled={isStartingCheckout}
                    className="rounded-sm bg-(--brand) px-5 py-3 font-mono text-[13px] font-semibold tracking-[0.05em] text-[#002022]! shadow-[0_0_15px_rgba(0,242,255,0.3)] transition hover:shadow-[0_0_25px_rgba(0,242,255,0.5)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    {isStartingCheckout && checkoutSlug === tier.slug
                      ? "Redirecting..."
                      : `${getMarketingPlan(tier.slug)?.price || "$?"} / wk`}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {billingStatus === "active" ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#101214] p-5 transition hover:border-cyan-300/40">
              <div className="absolute inset-0 bg-linear-to-br from-cyan-300/8 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="relative">
                <p className="font-mono text-[12px] tracking-[0.05em] text-(--ink-muted)">Quota limit</p>
                <p className="mt-3 text-4xl font-semibold tracking-tight text-[#e1fdff]">
                  {snapshot?.overview.totalMax ?? 0}
                </p>
              </div>
            </article>
            <article className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#101214] p-5 transition hover:border-cyan-300/40">
              <div className="absolute inset-0 bg-linear-to-br from-purple-400/8 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="relative">
                <p className="font-mono text-[12px] tracking-[0.05em] text-(--ink-muted)">Quota used</p>
                <p className="mt-3 text-4xl font-semibold tracking-tight text-[#e1fdff]">
                  {snapshot?.overview.totalUsed ?? 0}
                </p>
              </div>
            </article>
            <article className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#101214] p-5 transition hover:border-cyan-300/40">
              <div className="absolute inset-0 bg-linear-to-br from-emerald-300/8 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="relative">
                <p className="font-mono text-[12px] tracking-[0.05em] text-(--ink-muted)">Quota remaining</p>
                <p className="mt-3 text-4xl font-semibold tracking-tight text-[#e1fdff]">
                  {snapshot?.overview.totalRemaining ?? 0}
                </p>
              </div>
            </article>
          </section>

          <section className="mt-4 grid gap-4 md:grid-cols-4">
            <article className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#101214] p-5 transition hover:border-cyan-300/40">
              <div className="absolute inset-0 bg-linear-to-br from-cyan-300/8 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="relative">
                <p className="font-mono text-[12px] tracking-[0.05em] text-(--ink-muted)">Total tokens</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-[#e1fdff]">
                  {formatCount(usageSnapshot?.overall.totalTokens)}
                </p>
              </div>
            </article>
            <article className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#101214] p-5 transition hover:border-cyan-300/40">
              <div className="absolute inset-0 bg-linear-to-br from-purple-400/8 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="relative">
                <p className="font-mono text-[12px] tracking-[0.05em] text-(--ink-muted)">Input tokens</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-[#e1fdff]">
                  {formatCount(usageSnapshot?.overall.inputTokens)}
                </p>
              </div>
            </article>
            <article className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#101214] p-5 transition hover:border-cyan-300/40">
              <div className="absolute inset-0 bg-linear-to-br from-emerald-300/8 to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="relative">
                <p className="font-mono text-[12px] tracking-[0.05em] text-(--ink-muted)">Output tokens</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-[#e1fdff]">
                  {formatCount(usageSnapshot?.overall.outputTokens)}
                </p>
              </div>
            </article>
            <article className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#101214] p-5 transition hover:border-cyan-300/40">
              <div className="absolute inset-0 bg-linear-to-br from-cyan-300/8 to-purple-400/8 opacity-0 transition group-hover:opacity-100" />
              <div className="relative">
                <p className="font-mono text-[12px] tracking-[0.05em] text-(--ink-muted)">Token units</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-[#e1fdff]">
                  {formatTokenValue(usageSnapshot?.overall.tokenValue)}
                </p>
              </div>
            </article>
          </section>

          {usageError ? (
            <p className="mt-4 rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {usageError}
            </p>
          ) : null}

          {isLoadingUsage ? (
            <p className="mt-4 font-mono text-[13px] text-(--ink-muted)">Loading token statistics...</p>
          ) : null}

          <section className="panel relative mt-6 overflow-hidden border-cyan-300/15 bg-[#101214]/80 p-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_8%,rgba(168,85,247,0.12),transparent_26%),linear-gradient(135deg,rgba(0,242,255,0.04),transparent_42%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/45 to-transparent" />
            <div className="relative p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold tracking-tight text-[#e1fdff]">Usage Limits</h2>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1 font-mono text-[11px] font-medium tracking-[0.05em] text-(--brand)">
                    {usageTierLabel}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void loadSnapshot(false)}
                  className="rounded-sm border border-white/10 px-4 py-2 font-mono text-[13px] font-medium tracking-[0.05em] text-[#e1fdff] transition hover:border-cyan-300/40 hover:bg-cyan-300/5 active:scale-95"
                >
                  Refresh
                </button>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-(--ink-muted)">
                Quota usage is charged by model cost. Token statistics show provider-reported input
                and output tokens.
              </p>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-mono text-[12px] tracking-[0.05em] text-(--ink-muted)">5-hour limit</span>
                    <span className="font-mono text-[12px] font-medium text-[#e1fdff]">{sessionUsagePercent}% used</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#25282d]">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-(--brand) to-(--accent) shadow-[0_0_15px_rgba(0,242,255,0.35)] transition-[width] duration-300"
                      style={{ width: `${sessionUsagePercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-(--ink-muted)">
                    Resets in {formatResetIn(snapshot?.account.quota.resetAt || null)}.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-mono text-[12px] tracking-[0.05em] text-(--ink-muted)">Weekly limit</span>
                    <span className="font-mono text-[12px] font-medium text-[#e1fdff]">{weeklyUsagePercent}% used</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#25282d]">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-(--brand) to-(--accent) shadow-[0_0_15px_rgba(0,242,255,0.35)] transition-[width] duration-300"
                      style={{ width: `${weeklyUsagePercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-(--ink-muted)">
                    Resets in {formatResetIn(snapshot?.account.weekly?.resetAt || null)}.
                  </p>
                </div>
              </div>

              {snapshotError ? (
                <p className="mt-4 rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {snapshotError}
                </p>
              ) : null}

              {isLoadingSnapshot ? (
                <p className="mt-4 font-mono text-[13px] text-(--ink-muted)">Loading usage data...</p>
              ) : null}
            </div>
          </section>

          <section className="panel relative mt-6 overflow-hidden border-cyan-300/15 bg-[#101214]/80 p-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(168,85,247,0.12),transparent_24%),linear-gradient(135deg,rgba(0,242,255,0.04),transparent_42%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/45 to-transparent" />
            <div className="relative p-5 md:p-6">
              <p className="font-mono text-[13px] font-medium tracking-[0.05em] text-(--brand)">
                Model Analytics
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#e1fdff]">Model usage</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-(--ink-muted)">
                Token and request totals grouped by the model selected for each API request.
              </p>

              <div className="mt-5 overflow-x-auto rounded-xl border border-white/10 bg-black/20">
                <table className="w-full min-w-220 border-collapse font-mono text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#1a1c20] text-left text-[12px] tracking-[0.05em] text-(--ink-muted)">
                      <th className="px-4 py-3 font-medium">Model</th>
                      <th className="px-4 py-3 font-medium">Requests</th>
                      <th className="px-4 py-3 font-medium">Input</th>
                      <th className="px-4 py-3 font-medium">Output</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Token units</th>
                      <th className="px-4 py-3 font-medium">Last request</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageSnapshot?.byModel.length ? (
                      usageSnapshot.byModel.map((item) => (
                        <tr key={item.model} className="border-b border-white/10 transition last:border-0 hover:bg-cyan-300/5">
                          <td className="px-4 py-3 font-medium text-[#e1fdff]">{item.model}</td>
                          <td className="px-4 py-3 text-(--ink-muted)">{formatCount(item.requests)}</td>
                          <td className="px-4 py-3 text-(--ink-muted)">{formatCount(item.inputTokens)}</td>
                          <td className="px-4 py-3 text-(--ink-muted)">{formatCount(item.outputTokens)}</td>
                          <td className="px-4 py-3 text-(--ink-muted)">{formatCount(item.totalTokens)}</td>
                          <td className="px-4 py-3 text-(--ink-muted)">{formatTokenValue(item.tokenValue)}</td>
                          <td className="px-4 py-3 text-(--ink-muted)">{formatTime(item.lastRequestAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-5 text-(--ink-muted)" colSpan={7}>
                          No model usage yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="panel mt-6 border-cyan-300/15 bg-[#101214]/80 p-6">
          <h2 className="text-2xl font-semibold tracking-tight text-[#e1fdff]">Usage Limits</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-(--ink-muted)">
            AI usage indicators are disabled until you activate a weekly plan. After subscribing, quota and weekly usage will appear here.
          </p>
        </section>
      )}

      <section className="panel relative mt-6 overflow-hidden border-cyan-300/15 bg-[#101214]/80 p-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_4%,rgba(0,242,255,0.1),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_42%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/45 to-transparent" />
        <div className="relative p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-mono text-[13px] font-medium tracking-[0.05em] text-(--brand)">
                DekadansAI Models
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#e1fdff]">Model selection</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-(--ink-muted)">
                Choose one of your available DekadansAI models and use its identifier in API requests.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadModels()}
              className="rounded-sm border border-white/10 px-4 py-2 font-mono text-[13px] font-medium tracking-[0.05em] text-[#e1fdff] transition hover:border-cyan-300/40 hover:bg-cyan-300/5 active:scale-95"
            >
              Refresh
            </button>
          </div>

          {modelsError ? (
            <p className="mt-4 rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {modelsError}
            </p>
          ) : null}

          <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <label className="mb-2 block font-mono text-[12px] tracking-[0.05em] text-(--ink-muted)" htmlFor="model-select">
                Model to use
              </label>
              <select
                id="model-select"
                value={selectedModelId}
                onChange={(event) => setSelectedModelId(event.target.value)}
                disabled={isLoadingModels || models.length === 0}
                className="w-full rounded-lg border border-white/10 bg-[#1a1c20] px-4 py-3 font-mono text-sm outline-none transition focus:border-(--brand) focus:shadow-[0_0_0_3px_rgba(0,242,255,0.08)] disabled:cursor-not-allowed disabled:opacity-65"
              >
                {models.length ? (
                  models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.id})
                    </option>
                  ))
                ) : (
                  <option value="">
                    {isLoadingModels ? "Loading models..." : "No models found"}
                  </option>
                )}
              </select>
              {selectedModel ? (
                <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white p-1.5">
                      <Image
                        alt={`${selectedModel.name} logo`}
                        className="h-full w-full object-contain"
                        height={36}
                        src={getModelPresentation(selectedModel).logo}
                        width={36}
                      />
                    </span>
                    <div>
                      <p className="font-mono text-[13px] font-semibold tracking-[0.05em] text-[#e1fdff]">
                        {selectedModel.name}
                      </p>
                      <p className="mt-1 font-mono text-xs text-(--ink-muted)">{selectedModel.id}</p>
                      {selectedModel.provider ? (
                        <p className="mt-1 font-mono text-xs text-(--ink-muted)">Provider: {selectedModel.provider}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
              <div className="flex items-center gap-2 border-b border-white/10 bg-[#1a1c20] px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-[#ffb4ab]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#00dbe7]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#74f5ff]" />
                <p className="ml-2 font-mono text-[12px] tracking-[0.05em] text-(--ink-muted)">
                  example_request.sh
                </p>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-xs leading-5 text-white/90">
                <code>{selectedModelCurl}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="panel relative mt-6 overflow-hidden border-cyan-300/15 bg-[#101214]/80 p-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(0,242,255,0.12),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_42%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/45 to-transparent" />
        <div className="relative p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-2">
            <p className="font-mono text-[13px] font-medium tracking-[0.05em] text-(--brand)">
              API Access
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-[#e1fdff]">Create a new API key</h2>
            <p className="max-w-2xl text-sm leading-6 text-(--ink-muted)">
              Your key is shown only once after creation. Store it somewhere secure.
            </p>
          </div>

          <form className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-3 sm:flex-row" onSubmit={handleCreateKey}>
            <input
              type="text"
              value={keyName}
              onChange={(event) => setKeyName(event.target.value)}
              placeholder="example: production-key"
              className="min-h-12 w-full rounded-lg border border-white/10 bg-[#1a1c20] px-4 font-mono text-sm outline-none transition placeholder:text-white/30 focus:border-(--brand) focus:shadow-[0_0_0_3px_rgba(0,242,255,0.08)]"
              disabled={isCreatingKey}
              maxLength={80}
            />
            <button
              type="submit"
              disabled={isCreatingKey}
              className="min-h-12 shrink-0 rounded-sm bg-(--brand) px-6 font-mono text-[13px] font-semibold tracking-[0.05em] text-[#002022]! shadow-[0_0_15px_rgba(0,242,255,0.3)] transition hover:shadow-[0_0_25px_rgba(0,242,255,0.5)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isCreatingKey ? "Creating..." : "Create key"}
            </button>
          </form>

        {createError ? (
          <p className="mt-3 rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {createError}
          </p>
        ) : null}

        {createdKey ? (
          <div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4">
            <p className="label mb-1">Generated key</p>
            <code className="block overflow-x-auto rounded-lg bg-black/30 px-3 py-2 text-xs font-semibold text-white/90">
              {createdKey}
            </code>
            <button
              type="button"
              onClick={handleCopyKey}
              className="mt-3 rounded-lg border border-(--line) px-3 py-1.5 text-sm font-medium"
            >
              {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy"}
            </button>
          </div>
        ) : null}
        </div>
      </section>

      <section className="panel relative mt-6 overflow-hidden border-cyan-300/15 bg-[#101214]/80 p-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(0,242,255,0.1),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_42%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/45 to-transparent" />
        <div className="relative p-5 md:p-6">
          <p className="font-mono text-[13px] font-medium tracking-[0.05em] text-(--brand)">
            Key Management
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#e1fdff]">API keys</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-(--ink-muted)">
            Rate limits are account-wide, not per key, and include usage from every key on this account.
          </p>

          {deleteError ? (
            <p className="mt-3 rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {deleteError}
            </p>
          ) : null}

          <div className="mt-5 overflow-x-auto rounded-xl border border-white/10 bg-black/20">
            <table className="w-full min-w-240 border-collapse font-mono text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-[#1a1c20] text-left text-[12px] tracking-[0.05em] text-(--ink-muted)">
                  <th className="px-4 py-3 font-medium">Key</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Requests</th>
                  <th className="px-4 py-3 font-medium">Input</th>
                  <th className="px-4 py-3 font-medium">Output</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Token units</th>
                  <th className="px-4 py-3 font-medium">Last request</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {snapshot?.keys.length ? (
                  snapshot.keys.map((item) => {
                    const usage = usageByKeyId.get(item.id);

                    return (
                      <tr key={item.id} className="border-b border-white/10 transition last:border-0 hover:bg-cyan-300/5">
                        <td className="px-4 py-3 font-medium text-[#e1fdff]">{item.name || maskKey(item.start)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] ${
                            item.enabled
                              ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200"
                              : "border-white/10 bg-white/5 text-(--ink-muted)"
                          }`}>
                            {item.enabled ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-(--ink-muted)">{formatCount(usage?.requests)}</td>
                        <td className="px-4 py-3 text-(--ink-muted)">{formatCount(usage?.inputTokens)}</td>
                        <td className="px-4 py-3 text-(--ink-muted)">{formatCount(usage?.outputTokens)}</td>
                        <td className="px-4 py-3 text-(--ink-muted)">{formatCount(usage?.totalTokens)}</td>
                        <td className="px-4 py-3 text-(--ink-muted)">{formatTokenValue(usage?.tokenValue)}</td>
                        <td className="px-4 py-3 text-(--ink-muted)">
                          {formatTime(usage?.lastRequestAt || item.lastRequestAt)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void handleDeleteKey(item.id)}
                            disabled={deletingKeyId === item.id}
                            className="rounded-sm border border-red-300/30 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingKeyId === item.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-4 py-5 text-(--ink-muted)" colSpan={9}>
                      No API keys yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
