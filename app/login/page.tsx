"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { authClient, useSession } from "@/lib/auth-client";

type Provider = "google" | "github";

const providerLabels: Record<Provider, string> = {
  google: "Google",
  github: "GitHub"
};

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

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M21.6 12.23c0-.74-.07-1.45-.19-2.14H12v4.05h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.31 2.98-7.44Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.89 6.62-2.42l-3.24-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A9.99 9.99 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.4 13.9a6.01 6.01 0 0 1 0-3.8V7.51H3.06a10.01 10.01 0 0 0 0 8.98l3.34-2.59Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.86-2.86C16.96 3.01 14.7 2 12 2a9.99 9.99 0 0 0-8.94 5.51L6.4 10.1C7.19 7.74 9.4 5.98 12 5.98Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.29 9.29 0 0 1 12 7c.85 0 1.7.12 2.5.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.13 10.13 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const [formError, setFormError] = useState<string | null>(null);
  const [submittingProvider, setSubmittingProvider] = useState<Provider | null>(null);

  useEffect(() => {
    if (session?.user) {
      router.replace("/dashboard");
    }
  }, [router, session?.user]);

  async function handleSocialSignIn(provider: Provider) {
    setFormError(null);
    setSubmittingProvider(provider);

    try {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard"
      });

      if (error) {
        setFormError(resolveErrorMessage(error, `We could not sign you in with ${providerLabels[provider]}.`));
        setSubmittingProvider(null);
      }
    } catch (error) {
      setFormError(resolveErrorMessage(error, `We could not sign you in with ${providerLabels[provider]}.`));
      setSubmittingProvider(null);
    }
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-6 pb-10 pt-32 lg:grid-cols-[1.05fr_0.95fr]">
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
          Continue with Google or GitHub to access your API keys, usage limits, model selection,
          and billing tools.
        </p>

        <div className="mt-8 space-y-4">
          {formError ? (
            <p className="rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {formError}
            </p>
          ) : null}

          <button
            type="button"
            disabled={Boolean(submittingProvider) || isSessionPending}
            onClick={() => void handleSocialSignIn("google")}
            className="headline flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-65"
          >
            <GoogleIcon />
            {submittingProvider === "google" ? "Connecting to Google..." : "Continue with Google"}
          </button>

          <button
            type="button"
            disabled={Boolean(submittingProvider) || isSessionPending}
            onClick={() => void handleSocialSignIn("github")}
            className="headline flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-(--line) bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-(--brand) hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-65"
          >
            <GitHubIcon />
            {submittingProvider === "github" ? "Connecting to GitHub..." : "Continue with GitHub"}
          </button>
        </div>
      </section>
    </main>
  );
}
