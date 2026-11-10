import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const answerQuestion = vi.hoisted(() => vi.fn());
vi.mock("@/lib/server/ask", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/server/ask")>()), answerQuestion }));

let ipCounter = 0;
const post = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost:3000/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json", host: "localhost:3000", origin: "http://localhost:3000", "x-forwarded-for": `10.1.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const load = async () => await import("@/app/api/ask/route");

describe("/api/ask", () => {
  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("GEMINI_PAID_TIER", "");
    answerQuestion.mockReset();
    answerQuestion.mockResolvedValue({ ok: true, segments: [{ text: "Answer.", sources: [] }], sources: [], model: "gemini-3.6-flash", truncated: false });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("GET reports whether the assistant is configured, and which model answers", async () => {
    const { GET } = await load();
    expect(await (await GET()).json()).toEqual({ configured: true, model: "gemini-3.6-flash", freeTier: true });
    vi.stubEnv("GEMINI_PAID_TIER", "true");
    expect(await (await GET()).json()).toMatchObject({ freeTier: false });
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(await (await GET()).json()).toMatchObject({ configured: false, model: null });
  });

  it("says plainly when it is not configured, and sends nothing", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const res = await (await load()).POST(post({ question: "Who is Shivam?" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, reason: "not-configured" });
    expect(answerQuestion).not.toHaveBeenCalled();
  });

  it("rejects cross-origin requests", async () => {
    const { POST } = await load();
    expect((await POST(post({ question: "Who is Shivam?" }, { origin: "https://evil.example" }))).status).toBe(403);
    expect((await POST(post({ question: "Who is Shivam?" }, { "sec-fetch-site": "cross-site" }))).status).toBe(403);
    expect(answerQuestion).not.toHaveBeenCalled();
  });

  it("rejects malformed, oversized and invalid bodies before calling the model", async () => {
    const { POST } = await load();
    expect((await POST(post("{not json"))).status).toBe(400);
    expect((await POST(post({ question: "x".repeat(7000) }))).status).toBe(413);
    expect((await POST(post({ question: "" }))).status).toBe(422);
    expect(answerQuestion).not.toHaveBeenCalled();
  });

  it("answers a valid question and never caches the response", async () => {
    const res = await (await load()).POST(post({ question: "Who is Shivam?" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toMatchObject({ ok: true });
    expect(answerQuestion).toHaveBeenCalledWith({ question: "Who is Shivam?", history: [] });
  });

  it("limits each visitor to six questions in ten minutes", async () => {
    const { POST } = await load();
    const headers = { "x-forwarded-for": "10.9.9.9" };
    for (let i = 0; i < 6; i++) expect((await POST(post({ question: `Question ${i}?` }, headers))).status).toBe(200);
    const limited = await POST(post({ question: "One more?" }, headers));
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(answerQuestion).toHaveBeenCalledTimes(6);
  });

  it("maps assistant failures to honest status codes", async () => {
    const { POST } = await load();
    answerQuestion.mockResolvedValueOnce({ ok: false, reason: "busy", message: "Busy" });
    expect((await POST(post({ question: "Who is Shivam?" }))).status).toBe(503);
    answerQuestion.mockResolvedValueOnce({ ok: false, reason: "failed", message: "Failed" });
    expect((await POST(post({ question: "Who is Shivam?" }))).status).toBe(502);
  });
});
