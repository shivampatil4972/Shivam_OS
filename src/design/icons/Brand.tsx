import { GitBranch } from "lucide-react";

/** Neutral link glyphs for external profiles; the visible label names the service. */
export function GitHubGlyph({ className = "size-4" }: { className?: string }) {
  return <GitBranch className={className} aria-hidden />;
}

export function LinkedInGlyph({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10.5V16M8 7.6v.1M11.5 16v-5.5M11.5 13c0-1.7 1-2.6 2.3-2.6 1.3 0 2.2.8 2.2 2.6V16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
