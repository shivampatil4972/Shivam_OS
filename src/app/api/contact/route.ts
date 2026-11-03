import { NextResponse, type NextRequest } from "next/server";
import { contactSchema, MIN_FILL_MS, type ContactResponse } from "@/lib/contact";
import { configuredProvider, deliver } from "@/lib/server/delivery";
import { createRateLimiter } from "@/lib/server/rateLimit";

const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });
const MAX_BODY = 12_000;

const json = (body: ContactResponse | { configured: boolean }, status = 200, headers?: HeadersInit) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function GET() {
  return json({ configured: configuredProvider() !== null });
}

export async function POST(request: NextRequest) {
  // Same-origin only: browsers always send Origin on cross-site POSTs.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return json({ ok: false, reason: "invalid", message: "Cross-origin requests are not accepted." }, 403);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const rate = limiter(ip);
  if (!rate.allowed) {
    return json({ ok: false, reason: "rate-limited", message: `Too many messages. Please try again in ${Math.ceil(rate.retryAfterSec / 60)} minutes.` }, 429, { "Retry-After": String(rate.retryAfterSec) });
  }

  const text = await request.text();
  if (text.length > MAX_BODY) return json({ ok: false, reason: "invalid", message: "Message is too large." }, 413);
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return json({ ok: false, reason: "invalid", message: "Request body must be JSON." }, 400);
  }

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    if (fieldErrors.company) return json({ ok: false, reason: "spam", message: "Your message could not be accepted." }, 400);
    return json({ ok: false, reason: "invalid", message: "Please correct the highlighted fields.", fieldErrors }, 422);
  }
  if (parsed.data.elapsedMs !== undefined && parsed.data.elapsedMs < MIN_FILL_MS) {
    return json({ ok: false, reason: "spam", message: "That was quick — please take a moment and send again." }, 400);
  }

  if (!configuredProvider()) {
    return json({ ok: false, reason: "not-configured", message: "Message delivery is not configured on this deployment, so nothing was sent." }, 503);
  }

  try {
    const delivered = await deliver(parsed.data);
    if (!delivered) return json({ ok: false, reason: "delivery-failed", message: "The mail provider did not accept the message, so it was not sent." }, 502);
    return json({ ok: true, delivered: true });
  } catch {
    return json({ ok: false, reason: "delivery-failed", message: "The mail provider could not be reached, so the message was not sent." }, 502);
  }
}
