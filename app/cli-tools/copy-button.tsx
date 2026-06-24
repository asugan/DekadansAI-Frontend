"use client";

import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [isCopied, setIsCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-white/70 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-100 active:scale-95"
    >
      {isCopied ? "Copied" : "Copy"}
    </button>
  );
}
