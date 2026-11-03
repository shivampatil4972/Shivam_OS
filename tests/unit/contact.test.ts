import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { contactSchema, MIN_FILL_MS } from "@/lib/contact";
import { configuredProvider, deliver } from "@/lib/server/delivery";
import { createRateLimiter } from "@/lib/server/rateLimit";

const valid = { name: "Asha Rao", email: "asha@example.com", subject: "Internship role", message: "We would like to talk about an internship.", company: "" };

describe("contact validation", () => {
  it("accepts a valid message", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("trims whitespace", () => {
    const r = contactSchema.parse({ ...valid, name: "  Asha  " });
    expect(r.name).toBe("Asha");
  });

  it.each([
    ["name", { name: "A" }],
    ["email", { email: "not-an-email" }],
    ["subject", { subject: "Hi" }],
    ["message", { message: "too short" }],
    ["message", { message: "x".repeat(4001) }],
  ])("rejects an invalid %s", (field, patch) => {
    const r = contactSchema.safeParse({ ...valid, ...patch });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.path[0])).toContain(field);
  });

  it("rejects a filled honeypot", () => {
    expect(contactSchema.safeParse({ ...valid, company: "Spam Ltd" }).success).toBe(false);
  });
});

describe("rate limiter", () => {
  it("allows up to the limit in a window, then blocks, then resets", () => {
    const check = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(check("a", 0).allowed).toBe(true);
    expect(check("a", 1).allowed).toBe(true);
    const blocked = check("a", 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(check("a", 1001).allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(check("a", 0).allowed).toBe(true);
    expect(check("b", 0).allowed).toBe(true);
    expect(check("a", 1).allowed).toBe(false);
  });
});

describe("delivery configuration", () => {
  it("detects no provider by default", () => {
    expect(configuredProvider({} as NodeJS.ProcessEnv)).toBeNull();
  });

  it("selects Formspree only with a well-formed id", () => {
    expect(configuredProvider({ FORMSPREE_FORM_ID: "abcd1234" } as unknown as NodeJS.ProcessEnv)).toBe("formspree");
    expect(configuredProvider({ FORMSPREE_FORM_ID: "../evil" } as unknown as NodeJS.ProcessEnv)).toBeNull();
  });

  it("requires all Resend settings", () => {
    expect(configuredProvider({ RESEND_API_KEY: "k" } as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(configuredProvider({ RESEND_API_KEY: "k", CONTACT_TO_EMAIL: "t@x.io", CONTACT_FROM_EMAIL: "f@x.io" } as unknown as NodeJS.ProcessEnv)).toBe("resend");
  });

  it("reports failure when the provider rejects the message", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("nope", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const parsed = contactSchema.parse(valid);
    await expect(deliver(parsed, { FORMSPREE_FORM_ID: "abcd1234" } as unknown as NodeJS.ProcessEnv)).resolves.toBe(false);
    vi.unstubAllGlobals();
  });
});

describe("POST /api/contact", () => {
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    new NextRequest("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", host: "localhost:3000", origin: "http://localhost:3000", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}`, ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });

  const okBody = { ...valid, elapsedMs: MIN_FILL_MS + 1000 };

  beforeEach(() => {
    vi.stubEnv("FORMSPREE_FORM_ID", "");
    vi.stubEnv("RESEND_API_KEY", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const load = async () => (await import("@/app/api/contact/route")).POST;

  it("never claims success when delivery is not configured", async () => {
    const POST = await load();
    const res = await POST(post(okBody));
    const data = await res.json();
    expect(res.status).toBe(503);
    expect(data).toMatchObject({ ok: false, reason: "not-configured" });
  });

  it("returns field errors for invalid input", async () => {
    const POST = await load();
    const res = await POST(post({ ...okBody, email: "nope" }));
    const data = await res.json();
    expect(res.status).toBe(422);
    expect(data.fieldErrors.email).toBeDefined();
  });

  it("rejects malformed JSON", async () => {
    const POST = await load();
    expect((await POST(post("{oops"))).status).toBe(400);
  });

  it("rejects oversized bodies", async () => {
    const POST = await load();
    expect((await POST(post({ ...okBody, message: "x".repeat(20000) }))).status).toBe(413);
  });

  it("rejects honeypot and too-fast submissions as spam", async () => {
    const POST = await load();
    const a = await POST(post({ ...okBody, company: "Spam" }));
    expect((await a.json()).reason).toBe("spam");
    const b = await POST(post({ ...okBody, elapsedMs: 10 }));
    expect((await b.json()).reason).toBe("spam");
  });

  it("rejects cross-origin requests", async () => {
    const POST = await load();
    const res = await POST(post(okBody, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
  });

  it("rate limits repeated requests from one address", async () => {
    const POST = await load();
    const ip = { "x-forwarded-for": "203.0.113.9" };
    let last = 0;
    for (let i = 0; i < 7; i++) last = (await POST(post(okBody, ip))).status;
    expect(last).toBe(429);
  });

  it("reports delivered only when the provider accepts", async () => {
    vi.stubEnv("FORMSPREE_FORM_ID", "abcd1234");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    const POST = await load();
    const res = await POST(post(okBody));
    expect(await res.json()).toEqual({ ok: true, delivered: true });
  });

  it("reports failure when the provider rejects or is unreachable", async () => {
    vi.stubEnv("FORMSPREE_FORM_ID", "abcd1234");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 500 })));
    const POST = await load();
    const a = await POST(post(okBody));
    expect(a.status).toBe(502);
    expect((await a.json()).ok).toBe(false);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    const b = await POST(post(okBody));
    expect((await b.json()).reason).toBe("delivery-failed");
  });
});
