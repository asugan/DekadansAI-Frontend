"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  ApiRequestError,
  type BillingSnapshot,
  type ModelInfo,
  type RateLimitSnapshot,
  getBillingSnapshot,
  getModelsSnapshot,
  getRateLimitSnapshot
} from "@/lib/account-client";
import { authClient, useSession } from "@/lib/auth-client";

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
    void loadBillingStatus();
    void loadModels();
    const timer = window.setInterval(() => {
      void loadSnapshot(true);
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [isSessionPending, loadBillingStatus, loadModels, loadSnapshot, router, session?.user]);

  const usagePercent = useMemo(() => {
    if (!snapshot || snapshot.overview.totalMax <= 0) return 0;
    return Math.min(100, Math.round((snapshot.overview.totalUsed / snapshot.overview.totalMax) * 100));
  }, [snapshot]);

  const selectedModel = useMemo(
    () => models.find((model) => model.id === selectedModelId) || null,
    [models, selectedModelId]
  );

  const selectedModelCurl = useMemo(
    () => `curl -X POST https://api.dekadans.ai/ai/chat/completions \\
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

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/login");
  }

  if (isSessionPending || (!session?.user && !snapshotError)) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10">
        <div className="panel w-full max-w-md p-8 text-center">
          <p className="headline text-xl font-semibold">Checking your session...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
      <header className="panel mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div>
          <p className="label">Account Dashboard</p>
          <h1 className="headline text-2xl font-semibold text-[#e1fdff]">Dekadans AI workspace</h1>
          <p className="mt-1 text-sm text-(--ink-muted)">{session?.user?.email || "-"}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-xl border border-(--line) px-4 py-2 text-sm font-semibold transition hover:border-(--ink-muted)"
        >
          Sign out
        </button>
      </header>

      <section className="panel mb-6 overflow-hidden p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="label">Weekly Plan</p>
            {billingStatus === "active" && billingSnapshotFull?.weeklyPlan.tier ? (
              <>
                <h2 className="headline text-xl font-semibold">
                  {billingSnapshotFull.weeklyPlan.tier.label}
                </h2>
                <p className="mt-1 text-sm text-(--ink-muted)">
                  {billingSnapshotFull.weeklyPlan.tier.quotaMax} requests every 5 hours &middot;{' '}
                  {billingSnapshotFull.weeklyPlan.tier.weeklyQuotaMax} weekly limit
                </p>
              </>
            ) : billingStatus === "active" ? (
              <>
                <h2 className="headline text-xl font-semibold">Weekly plan active</h2>
                <p className="mt-1 text-sm text-(--ink-muted)">
                  An active weekly plan is required to use AI endpoints. Limits apply at the account
                  level.
                </p>
              </>
            ) : billingStatus === "loading" ? (
              <>
                <h2 className="headline text-xl font-semibold">Checking plan status</h2>
              </>
            ) : (
              <>
                <h2 className="headline text-xl font-semibold">Weekly plan required</h2>
                <p className="mt-1 text-sm text-(--ink-muted)">
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
          <div className="flex flex-col gap-2 sm:flex-row">
            {billingStatus === "active" ? (
              <button
                type="button"
                onClick={() => void handleOpenPortal()}
                disabled={isOpeningPortal}
                className="rounded-xl border border-(--line) px-4 py-2.5 text-sm font-semibold transition hover:border-(--ink-muted) disabled:cursor-not-allowed disabled:opacity-65"
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
                    className="headline rounded-xl bg-(--brand) px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    {isStartingCheckout && checkoutSlug === tier.slug
                      ? "Redirecting..."
                      : `$${tier.weeklyQuotaMax >= 8000 ? '10' : '5'} / wk`}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel p-5">
          <p className="label">Total limit</p>
          <p className="headline mt-2 text-3xl font-semibold">{snapshot?.overview.totalMax ?? 0}</p>
        </article>
        <article className="panel p-5">
          <p className="label">Used</p>
          <p className="headline mt-2 text-3xl font-semibold">{snapshot?.overview.totalUsed ?? 0}</p>
        </article>
        <article className="panel p-5">
          <p className="label">Remaining</p>
          <p className="headline mt-2 text-3xl font-semibold">{snapshot?.overview.totalRemaining ?? 0}</p>
        </article>
      </section>

      <section className="panel mt-6 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="headline text-xl font-semibold">Rate limit overview</h2>
          <button
            type="button"
            onClick={() => void loadSnapshot(false)}
            className="rounded-xl border border-(--line) px-3 py-1.5 text-sm font-medium transition hover:border-(--ink-muted)"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="label">Usage rate</span>
            <span className="font-medium">{usagePercent}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-bar" style={{ width: `${usagePercent}%` }} />
          </div>
          <p className="mt-2 text-sm text-(--ink-muted)">
            Account quota resets every 5 hours. Next reset: {formatTime(snapshot?.overview.nextResetAt || null)}
          </p>
        </div>

        {snapshotError ? (
          <p className="mt-4 rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {snapshotError}
          </p>
        ) : null}

        {isLoadingSnapshot ? (
          <p className="mt-4 text-sm text-(--ink-muted)">Loading usage data...</p>
        ) : null}
      </section>

      <section className="panel mt-6 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="label">CLIProxy Models</p>
            <h2 className="headline text-xl font-semibold">Model selection</h2>
            <p className="mt-1 text-sm text-(--ink-muted)">
              Choose one of your available CLIProxy models and use its identifier in API requests.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadModels()}
            className="rounded-xl border border-(--line) px-3 py-1.5 text-sm font-medium transition hover:border-(--ink-muted)"
          >
            Refresh
          </button>
        </div>

        {modelsError ? (
          <p className="mt-4 rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {modelsError}
          </p>
        ) : null}

        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <div>
            <label className="label mb-2 block" htmlFor="model-select">
              Model to use
            </label>
            <select
              id="model-select"
              value={selectedModelId}
              onChange={(event) => setSelectedModelId(event.target.value)}
              disabled={isLoadingModels || models.length === 0}
              className="w-full rounded-xl border border-(--line) bg-[#15171b] px-4 py-2.5 outline-none transition focus:border-(--brand) disabled:cursor-not-allowed disabled:opacity-65"
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
              <div className="mt-3 rounded-xl border border-(--line) bg-white/5 p-4 text-sm">
                <p className="font-semibold text-white">{selectedModel.name}</p>
                <p className="mt-1 font-mono text-xs text-(--ink-muted)">{selectedModel.id}</p>
                {selectedModel.provider ? (
                  <p className="mt-2 text-(--ink-muted)">Provider: {selectedModel.provider}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <p className="label mb-2">Example request with the selected model</p>
            <pre className="overflow-x-auto rounded-xl border border-(--line) bg-black/30 p-4 text-xs leading-5 text-white/90">
              <code>{selectedModelCurl}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="panel mt-6 p-5 md:p-6">
        <h2 className="headline text-xl font-semibold">Create a new API key</h2>
        <p className="mt-1 text-sm text-(--ink-muted)">
          Your key is shown only once after creation. Store it somewhere secure.
        </p>

        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleCreateKey}>
          <input
            type="text"
            value={keyName}
            onChange={(event) => setKeyName(event.target.value)}
            placeholder="example: production-key"
            className="w-full rounded-xl border border-(--line) bg-white/5 px-4 py-2.5 outline-none transition placeholder:text-white/30 focus:border-(--brand)"
            disabled={isCreatingKey}
            maxLength={80}
          />
          <button
            type="submit"
            disabled={isCreatingKey}
            className="headline rounded-xl bg-(--brand) px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-65"
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
          <div className="mt-4 rounded-xl border border-(--line) bg-white/5 p-4">
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
      </section>

      <section className="panel mt-6 p-5 md:p-6">
        <h2 className="headline text-xl font-semibold">API keys</h2>
        <p className="mt-1 text-sm text-(--ink-muted)">
          Rate limits are account-wide, not per key, and include usage from every key on this account.
        </p>

        {deleteError ? (
          <p className="mt-3 rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {deleteError}
          </p>
        ) : null}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-155 border-collapse text-sm">
            <thead>
              <tr className="border-b border-(--line) text-left text-(--ink-muted)">
                <th className="py-2 pr-3">Key</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Last request</th>
                <th className="py-2 pr-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {snapshot?.keys.length ? (
                snapshot.keys.map((item) => (
                  <tr key={item.id} className="border-b border-(--line) last:border-0">
                    <td className="py-2 pr-3 font-medium">{item.name || maskKey(item.start)}</td>
                    <td className="py-2 pr-3">{item.enabled ? "Active" : "Inactive"}</td>
                    <td className="py-2 pr-3">{formatTime(item.lastRequestAt)}</td>
                    <td className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => void handleDeleteKey(item.id)}
                        disabled={deletingKeyId === item.id}
                        className="rounded-md border border-red-400/35 px-2.5 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingKeyId === item.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-(--ink-muted)" colSpan={4}>
                    No API keys yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
