"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  ApiRequestError,
  type RateLimitSnapshot,
  getRateLimitSnapshot
} from "@/lib/account-client";
import { authClient, useSession } from "@/lib/auth-client";

const POLL_INTERVAL_MS = 15000;

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

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();

  const [snapshot, setSnapshot] = useState<RateLimitSnapshot | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(true);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

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

  useEffect(() => {
    if (isSessionPending) return;

    if (!session?.user) {
      router.replace("/login");
      return;
    }

    void loadSnapshot(false);
    const timer = window.setInterval(() => {
      void loadSnapshot(true);
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [isSessionPending, loadSnapshot, router, session?.user]);

  const usagePercent = useMemo(() => {
    if (!snapshot || snapshot.overview.totalMax <= 0) return 0;
    return Math.min(100, Math.round((snapshot.overview.totalUsed / snapshot.overview.totalMax) * 100));
  }, [snapshot]);

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
          <p className="mt-1 text-sm text-[var(--ink-muted)]">{session?.user?.email || "-"}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--ink-muted)]"
        >
          Cikis yap
        </button>
      </header>

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
            className="rounded-xl border border-[var(--line)] px-3 py-1.5 text-sm font-medium transition hover:border-[var(--ink-muted)]"
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
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Sonraki reset: {formatTime(snapshot?.overview.nextResetAt || null)}
          </p>
        </div>

        {snapshotError ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {snapshotError}
          </p>
        ) : null}

        {isLoadingSnapshot ? (
          <p className="mt-4 text-sm text-[var(--ink-muted)]">Veriler yukleniyor...</p>
        ) : null}
      </section>

      <section className="panel mt-6 p-5 md:p-6">
        <h2 className="headline text-xl font-semibold">Yeni API key olustur</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Key sadece olusturuldugu anda gorunur. Guvenli bir yerde saklayin.
        </p>

        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleCreateKey}>
          <input
            type="text"
            value={keyName}
            onChange={(event) => setKeyName(event.target.value)}
            placeholder="ornek: frontend-key"
            className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 outline-none transition focus:border-[var(--brand)]"
            disabled={isCreatingKey}
            maxLength={80}
          />
          <button
            type="submit"
            disabled={isCreatingKey}
            className="headline rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isCreatingKey ? "Olusturuluyor..." : "Key olustur"}
          </button>
        </form>

        {createError ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {createError}
          </p>
        ) : null}

        {createdKey ? (
          <div className="mt-4 rounded-xl border border-[var(--line)] bg-white p-4">
            <p className="label mb-1">Olusan key</p>
            <code className="block overflow-x-auto rounded-lg bg-[#f3f0e8] px-3 py-2 text-xs font-semibold">
              {createdKey}
            </code>
            <button
              type="button"
              onClick={handleCopyKey}
              className="mt-3 rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm font-medium"
            >
              {copyState === "copied" ? "Kopyalandi" : copyState === "failed" ? "Kopyalanamadi" : "Kopyala"}
            </button>
          </div>
        ) : null}
      </section>

      <section className="panel mt-6 p-5 md:p-6">
        <h2 className="headline text-xl font-semibold">Key bazli limitler</h2>

        {deleteError ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {deleteError}
          </p>
        ) : null}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-[var(--ink-muted)]">
                <th className="py-2 pr-3">Key</th>
                <th className="py-2 pr-3">Durum</th>
                <th className="py-2 pr-3">Used</th>
                <th className="py-2 pr-3">Max</th>
                <th className="py-2 pr-3">Remaining</th>
                <th className="py-2 pr-3">Reset</th>
                <th className="py-2 pr-3">Islem</th>
              </tr>
            </thead>
            <tbody>
              {snapshot?.keys.length ? (
                snapshot.keys.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="py-2 pr-3 font-medium">{item.name || maskKey(item.start)}</td>
                    <td className="py-2 pr-3">{item.enabled ? "Aktif" : "Pasif"}</td>
                    <td className="py-2 pr-3">{item.used}</td>
                    <td className="py-2 pr-3">{item.max}</td>
                    <td className="py-2 pr-3">{item.remaining}</td>
                    <td className="py-2 pr-3">{formatTime(item.resetAt)}</td>
                    <td className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => void handleDeleteKey(item.id)}
                        disabled={deletingKeyId === item.id}
                        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingKeyId === item.id ? "Siliniyor..." : "Sil"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-[var(--ink-muted)]" colSpan={7}>
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
