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
      setFormError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password
      });

      if (error) {
        setFormError(resolveErrorMessage(error, "We could not sign you in. Please check your credentials."));
        return;
      }

      router.replace("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden lg:block">
        <div className="mb-6 inline-flex rounded border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 font-mono text-[13px] font-medium tracking-wider text-cyan-300">
          Secure Gateway Access
        </div>
        <h1 className="headline max-w-xl text-5xl font-semibold leading-tight text-[#e1fdff]">
          Sign in to manage your unified AI workspace.
        </h1>
        <p className="mt-5 max-w-lg leading-relaxed text-(--ink-muted)">
          Monitor usage, create API keys, manage billing, and route requests to your available
          Dekadans AI models from one clean dashboard.
        </p>
        <div className="mt-8 grid max-w-lg gap-3">
          {["Real-time request limits", "Weekly access management", "One API key for every model"].map((item) => (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-[#e1fdff]" key={item}>
              <span className="mr-2 text-(--brand)">⊙</span>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="panel w-full p-8">
        <p className="label mb-3">Dekadans AI Account</p>
        <h2 className="headline text-3xl font-semibold text-white">Welcome back</h2>
        <p className="mt-2 text-sm leading-6 text-(--ink-muted)">
          Sign in to access your API keys, usage limits, model selection, and billing tools.
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
              placeholder="you@example.com"
              disabled={isSubmitting || isSessionPending}
              required
            />
          </div>

          <div>
            <label className="label mb-1 block" htmlFor="password">
              Password
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
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-(--ink-muted)">
          New to Dekadans AI?{" "}
          <Link className="font-semibold text-(--brand)" href="/register">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
