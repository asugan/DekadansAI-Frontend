"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { authClient, useSession } from "@/lib/auth-client";

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

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session?.user) {
      router.replace("/dashboard");
    }
  }, [router, session?.user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!email.trim() || !password.trim()) {
      setFormError("Email ve sifre gerekli");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password
      });

      if (error) {
        setFormError(resolveErrorMessage(error, "Giris basarisiz"));
        return;
      }

      router.replace("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-10">
      <section className="panel w-full max-w-md p-8">
        <p className="label mb-3">Dekadans AI Account</p>
        <h1 className="headline text-3xl font-semibold">Hesabina giris yap</h1>
        <p className="mt-2 text-sm text-(--ink-muted)">
          Better Auth uzerinden oturum acip API key ve rate limit paneline gecis yap.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label mb-1 block" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-xl border border-(--line) bg-white/5 px-4 py-2.5 outline-none transition placeholder:text-white/30 focus:border-(--brand)"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ornek@domain.com"
              disabled={isSubmitting || isSessionPending}
              required
            />
          </div>

          <div>
            <label className="label mb-1 block" htmlFor="password">
              Sifre
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-(--line) bg-white/5 px-4 py-2.5 outline-none transition placeholder:text-white/30 focus:border-(--brand)"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              disabled={isSubmitting || isSessionPending}
              required
            />
          </div>

          {formError ? (
            <p className="rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || isSessionPending}
            className="headline w-full rounded-xl bg-(--brand) px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isSubmitting ? "Giris yapiliyor..." : "Giris yap"}
          </button>
        </form>

        <p className="mt-6 text-sm text-(--ink-muted)">
          Hesabin yok mu?{" "}
          <Link className="font-semibold text-(--brand)" href="/register">
            Kayit ol
          </Link>
        </p>
      </section>
    </main>
  );
}
