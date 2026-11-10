/**
 * Shared types and limits for "Ask SHIVAM.OS". Dependency-free so the client
 * can import it without pulling in the validator or the SDK.
 */
export const ASK_MAX_QUESTION = 400;
export const ASK_MIN_QUESTION = 3;
/** Earlier exchanges sent along so follow-ups like "what did it use?" resolve. */
export const ASK_MAX_HISTORY = 2;
export const ASK_MAX_HISTORY_ANSWER = 1200;

export interface AskTurn {
  question: string;
  answer: string;
}

export interface AskRequest {
  question: string;
  history?: AskTurn[];
}

/** A portfolio page the answer cites, numbered in order of first citation. */
export interface AskSource {
  n: number;
  title: string;
  /** Same-origin path, e.g. `/projects/journex`. */
  href: string;
  /** The exact passages the answer cites from this page. */
  quotes: string[];
}

/** A run of answer text and the sources (by `n`) that support it. */
export interface AskSegment {
  text: string;
  sources: number[];
}

export type AskFailure = "not-configured" | "invalid" | "rate-limited" | "declined" | "busy" | "failed";

export type AskResponse =
  | { ok: true; segments: AskSegment[]; sources: AskSource[]; model: string; truncated: boolean }
  | { ok: false; reason: AskFailure; message: string };

export interface AskStatus {
  configured: boolean;
  model: string | null;
  /** True unless the owner confirms a paid Gemini key: on the free tier Google may use inputs to improve its products. */
  freeTier: boolean;
}

export function answerText(segments: AskSegment[]): string {
  return segments.map((s) => s.text).join("");
}
