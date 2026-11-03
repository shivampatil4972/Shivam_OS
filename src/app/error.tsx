"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="fixed inset-0 grid place-items-center overflow-auto bg-[#04060c] p-6 text-center text-[#eef2f9]">
      <div className="max-w-md">
        <h1 className="font-display text-2xl font-semibold">Something went wrong.</h1>
        <p className="mt-2 text-[15px] text-[#b3bdcc]">SHIVAM.OS hit an unexpected error. You can try again, or get the résumé directly.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="inline-flex h-10 items-center rounded-xl bg-[#1f5fe0] px-4 text-sm font-medium text-white">
            Try again
          </button>
          <a href="/resume/Shivam_Patil_Resume.pdf" className="inline-flex h-10 items-center rounded-xl border border-white/20 px-4 text-sm font-medium text-white">
            Open résumé (PDF)
          </a>
        </div>
      </div>
    </main>
  );
}
