import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="fixed inset-0 grid place-items-center overflow-auto bg-[radial-gradient(100%_70%_at_50%_0%,#12264f,#04060c_70%)] p-6 text-center text-[#eef2f9]">
      <div className="max-w-md">
        <p className="font-mono text-sm text-[#7fb0ff]">404</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">This app isn&apos;t installed.</h1>
        <p className="mt-2 text-[15px] text-[#b3bdcc]">The page you asked for doesn&apos;t exist in SHIVAM.OS.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex h-10 items-center rounded-xl bg-[#1f5fe0] px-4 text-sm font-medium text-white">
            Back to the desktop
          </Link>
          <Link href="/projects" className="inline-flex h-10 items-center rounded-xl border border-white/20 px-4 text-sm font-medium text-white">
            See projects
          </Link>
        </div>
      </div>
    </main>
  );
}
