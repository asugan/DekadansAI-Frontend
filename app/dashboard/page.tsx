"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  ApiRequestError,
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
  return parsed.toLocaleTimeString("tr-TR", {
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
  if (!start) return "gizli-key";
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
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
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

        setSnapshotError(resolveErrorMessage(error, "Rate limit verisi yuklenemedi"));
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
      setBillingStatus(payload.weeklyPlan.active ? "active" : "inactive");
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        router.replace("/login");
        return;
      }

      setBillingStatus("error");
      setBillingError(resolveErrorMessage(error, "Billing bilgisi yuklenemedi"));
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

      setModelsError(resolveErrorMessage(error, "Model listesi yuklenemedi"));
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
    "messages": [{"role": "user", "content": "Merhaba"}]
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
        setCreateError(resolveErrorMessage(error, "API key olusturulamadi"));
        return;
      }

      const generatedKey = extractCreatedKey(data);
      if (!generatedKey) {
        setCreateError("API key olustu ama key degeri donmedi");
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
        setDeleteError(resolveErrorMessage(error, "API key silinemedi"));
        return;
      }

      await loadSnapshot(true);
    } finally {
      setDeletingKeyId(null);
    }
  }

  async function handleStartCheckout() {
    setBillingError(null);
    setIsStartingCheckout(true);

    try {
      const { data, error } = await authClient.checkout({
        slug: "weekly",
        redirect: false
      });

      if (error) {
        setBillingError(resolveErrorMessage(error, "Checkout baslatilamadi"));
        return;
      }

      const checkoutUrl = extractRedirectUrl(data);
      if (!checkoutUrl) {
        setBillingError("Checkout URL donmedi");
        return;
      }

      window.location.assign(checkoutUrl);
    } finally {
      setIsStartingCheckout(false);
    }
  }

  async function handleOpenPortal() {
    setBillingError(null);
    setIsOpeningPortal(true);

    try {
      const { data, error } = await authClient.customer.portal();

      if (error) {
        setBillingError(resolveErrorMessage(error, "Musteri portali acilamadi"));
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
          <p className="headline text-xl font-semibold">Oturum kontrol ediliyor...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
      <header className="panel mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div>
          <p className="label">Hesap Paneli</p>
          <h1 className="headline text-2xl font-semibold">Dekadans AI account dashboard</h1>
          <p className="mt-1 text-sm text-(--ink-muted)">{session?.user?.email || "-"}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-xl border border-(--line) px-4 py-2 text-sm font-semibold transition hover:border-(--ink-muted)"
        >
          Cikis yap
        </button>
      </header>

      <section className="panel mb-6 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="label">Weekly Plan</p>
            <h2 className="headline text-xl font-semibold">
              {billingStatus === "active"
                ? "Weekly plan aktif"
                : billingStatus === "loading"
                  ? "Plan durumu kontrol ediliyor"
                  : "Weekly plan gerekli"}
            </h2>
            <p className="mt-1 text-sm text-(--ink-muted)">
              AI endpointlerini kullanmak icin aktif weekly plan aboneligi gerekir.
              Limit hesap bazlidir: 5 saatte 500 request.
            </p>
            {billingError ? (
              <p className="mt-3 rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {billingError}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleStartCheckout()}
              disabled={isStartingCheckout}
              className="headline rounded-xl bg-(--brand) px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isStartingCheckout ? "Yonlendiriliyor..." : "Weekly Plan'a gec"}
            </button>
            <button
              type="button"
              onClick={() => void handleOpenPortal()}
              disabled={isOpeningPortal}
              className="rounded-xl border border-(--line) px-4 py-2.5 text-sm font-semibold transition hover:border-(--ink-muted) disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isOpeningPortal ? "Aciliyor..." : "Aboneligi yonet"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="panel p-5">
          <p className="label">Toplam limit</p>
          <p className="headline mt-2 text-3xl font-semibold">{snapshot?.overview.totalMax ?? 0}</p>
        </article>
        <article className="panel p-5">
          <p className="label">Kullanilan</p>
          <p className="headline mt-2 text-3xl font-semibold">{snapshot?.overview.totalUsed ?? 0}</p>
        </article>
        <article className="panel p-5">
          <p className="label">Kalan</p>
          <p className="headline mt-2 text-3xl font-semibold">{snapshot?.overview.totalRemaining ?? 0}</p>
        </article>
      </section>

      <section className="panel mt-6 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="headline text-xl font-semibold">Rate limit ozeti</h2>
          <button
            type="button"
            onClick={() => void loadSnapshot(false)}
            className="rounded-xl border border-(--line) px-3 py-1.5 text-sm font-medium transition hover:border-(--ink-muted)"
          >
            Yenile
          </button>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="label">Kullanim orani</span>
            <span className="font-medium">{usagePercent}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-bar" style={{ width: `${usagePercent}%` }} />
          </div>
          <p className="mt-2 text-sm text-(--ink-muted)">
            5 saatlik hesap kotasi reset: {formatTime(snapshot?.overview.nextResetAt || null)}
          </p>
        </div>

        {snapshotError ? (
          <p className="mt-4 rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {snapshotError}
          </p>
        ) : null}

        {isLoadingSnapshot ? (
          <p className="mt-4 text-sm text-(--ink-muted)">Veriler yukleniyor...</p>
        ) : null}
      </section>

      <section className="panel mt-6 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="label">CLIProxy modelleri</p>
            <h2 className="headline text-xl font-semibold">Model secimi</h2>
            <p className="mt-1 text-sm text-(--ink-muted)">
              CLIProxy&apos;de ekli modelleri buradan secip API isteginde model alanina yazabilirsin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadModels()}
            className="rounded-xl border border-(--line) px-3 py-1.5 text-sm font-medium transition hover:border-(--ink-muted)"
          >
            Yenile
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
              Kullanilacak model
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
                  {isLoadingModels ? "Modeller yukleniyor..." : "Model bulunamadi"}
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
            <p className="label mb-2">Secili model ile ornek istek</p>
            <pre className="overflow-x-auto rounded-xl border border-(--line) bg-black/30 p-4 text-xs leading-5 text-white/90">
              <code>{selectedModelCurl}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="panel mt-6 p-5 md:p-6">
        <h2 className="headline text-xl font-semibold">Yeni API key olustur</h2>
        <p className="mt-1 text-sm text-(--ink-muted)">
          Key sadece olusturuldugu anda gorunur. Guvenli bir yerde saklayin.
        </p>

        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleCreateKey}>
          <input
            type="text"
            value={keyName}
            onChange={(event) => setKeyName(event.target.value)}
            placeholder="ornek: frontend-key"
            className="w-full rounded-xl border border-(--line) bg-white/5 px-4 py-2.5 outline-none transition placeholder:text-white/30 focus:border-(--brand)"
            disabled={isCreatingKey}
            maxLength={80}
          />
          <button
            type="submit"
            disabled={isCreatingKey}
            className="headline rounded-xl bg-(--brand) px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isCreatingKey ? "Olusturuluyor..." : "Key olustur"}
          </button>
        </form>

        {createError ? (
          <p className="mt-3 rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {createError}
          </p>
        ) : null}

        {createdKey ? (
          <div className="mt-4 rounded-xl border border-(--line) bg-white/5 p-4">
            <p className="label mb-1">Olusan key</p>
            <code className="block overflow-x-auto rounded-lg bg-black/30 px-3 py-2 text-xs font-semibold text-white/90">
              {createdKey}
            </code>
            <button
              type="button"
              onClick={handleCopyKey}
              className="mt-3 rounded-lg border border-(--line) px-3 py-1.5 text-sm font-medium"
            >
              {copyState === "copied" ? "Kopyalandi" : copyState === "failed" ? "Kopyalanamadi" : "Kopyala"}
            </button>
          </div>
        ) : null}
      </section>

      <section className="panel mt-6 p-5 md:p-6">
        <h2 className="headline text-xl font-semibold">API keyler</h2>
        <p className="mt-1 text-sm text-(--ink-muted)">
          Rate limit key bazli degil, hesaptaki tum keylerin toplam kullanimi uzerinden hesaplanir.
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
                <th className="py-2 pr-3">Durum</th>
                <th className="py-2 pr-3">Son istek</th>
                <th className="py-2 pr-3">Islem</th>
              </tr>
            </thead>
            <tbody>
              {snapshot?.keys.length ? (
                snapshot.keys.map((item) => (
                  <tr key={item.id} className="border-b border-(--line) last:border-0">
                    <td className="py-2 pr-3 font-medium">{item.name || maskKey(item.start)}</td>
                    <td className="py-2 pr-3">{item.enabled ? "Aktif" : "Pasif"}</td>
                    <td className="py-2 pr-3">{formatTime(item.lastRequestAt)}</td>
                    <td className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => void handleDeleteKey(item.id)}
                        disabled={deletingKeyId === item.id}
                        className="rounded-md border border-red-400/35 px-2.5 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingKeyId === item.id ? "Siliniyor..." : "Sil"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-(--ink-muted)" colSpan={4}>
                    Henuz API key bulunmuyor.
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
