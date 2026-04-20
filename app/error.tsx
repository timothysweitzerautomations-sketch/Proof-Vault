"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const focusRing =
    "outline-none ring-vault-500/40 focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:py-20">
      <LogoMark
        gradientId="pv-logo-error"
        className="mx-auto h-14 w-14 opacity-90 shadow-md shadow-vault-900/10"
      />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">Something went wrong</h1>
      <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-600">
        Proof Vault hit an unexpected error. You can try again or return to the inbox.
      </p>
      {process.env.NODE_ENV === "development" && error?.message ? (
        <pre className="mt-6 max-h-40 overflow-auto rounded-xl border border-red-200 bg-red-50/80 p-3 text-left text-xs text-red-900">
          {error.message}
        </pre>
      ) : null}
      <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => reset()}
          className={`rounded-full bg-gradient-to-b from-vault-600 to-vault-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-vault-900/20 transition hover:from-vault-500 hover:to-vault-600 ${focusRing}`}
        >
          Try again
        </button>
        <Link
          href="/"
          className={`rounded-full border border-slate-200 bg-white/90 px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 ${focusRing}`}
        >
          Back to inbox
        </Link>
      </div>
    </div>
  );
}
