import { NextResponse, type NextRequest } from "next/server";
import { profile } from "@/content/profile";
import { askRequestSchema } from "@/lib/ask/request";
import type { AskResponse, AskStatus } from "@/lib/ask/types";
import { answerQuestion, askConfigured, askFreeTier, askModel } from "@/lib/server/ask";
import { createRateLimiter } from "@/lib/server/rateLimit";

export const maxDuration = 30;

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const MAX_BODY = 6_000;

/*
 * Abuse limits. In-memory and per server instance, so they are best-effort;
 * the hard ceilings are Gemini's own quota and any budget set on the Google Cloud project.
 */
const burst = createRateLimiter({ limit: 6, windowMs: 10 * MINUTE });
const daily = createRateLimiter({ limit: 40, windowMs: DAY });
const globalDaily = createRateLimiter({ limit: Number(process.env.ASK_DAILY_LIMIT) || 400, windowMs: DAY });

const json = (body: AskResponse | AskStatus, status = 200, headers?: HeadersInit) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function GET() {
  const configured = askConfigured();
  return json({ configured, model: configured ? askModel() : null, freeTier: askFreeTier() });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const fetchSite = request.headers.get("sec-fetch-site");
  if ((origin && host && new URL(origin).host !== host) || (fetchSite && fetchSite !== "same-origin")) {
    return json({ ok: false, reason: "invalid", message: "Cross-origin requests are not accepted." }, 403);
  }

  if (!askConfigured()) {
    return json({ ok: false, reason: "not-configured", message: "Ask SHIVAM.OS is not switched on for this deployment, so no question was sent." }, 503);
  }

  const text = await request.text();
  if (text.length > MAX_BODY) return json({ ok: false, reason: "invalid", message: "That request is too large." }, 413);
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return json({ ok: false, reason: "invalid", message: "Request body must be JSON." }, 400);
  }
  const parsed = askRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ ok: false, reason: "invalid", message: parsed.error.issues[0]?.message ?? "That question could not be read." }, 422);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  for (const [check, key, what] of [
    [burst, ip, "a few minutes"],
    [daily, ip, "a few hours"],
    [globalDaily, "all", "a few hours"],
  ] as const) {
    const rate = check(key);
    if (!rate.allowed) {
      return json(
        { ok: false, reason: "rate-limited", message: `That's the question limit for now. Please try again in ${what}, or email ${profile.email}.` },
        429,
        { "Retry-After": String(rate.retryAfterSec) },
      );
    }
  }

  const answer = await answerQuestion(parsed.data);
  const status = answer.ok ? 200 : answer.reason === "busy" || answer.reason === "not-configured" ? 503 : answer.reason === "declined" ? 200 : 502;
  return json(answer, status);
}
