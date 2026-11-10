"use client";

import { ArrowUp, BriefcaseBusiness, Search, Sparkles, TriangleAlert } from "lucide-react";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { profile } from "@/content/profile";
import { Badge, Button, Chip } from "@/design/ui";
import { ASK_MAX_HISTORY, ASK_MAX_HISTORY_ANSWER, ASK_MAX_QUESTION, ASK_MIN_QUESTION, answerText, type AskResponse, type AskSource, type AskStatus } from "@/lib/ask/types";
import { useOS } from "@/os/OSContext";
import { pathToIntent } from "@/os/routes";
import { clearActivity, publishActivity } from "@/os/state/activity";
import type { AppProps } from "@/os/WindowLayer";

interface Turn {
  id: number;
  question: string;
  result: AskResponse | null;
}

const SUGGESTIONS = [
  "What was Shivam's role in JOURNEX?",
  "Which projects use Spring Boot?",
  "How does Shivam evaluate machine-learning models?",
  "What internships has Shivam done?",
];

export default function AskApp({ params }: AppProps) {
  const { open, store } = useOS();
  const [status, setStatus] = useState<AskStatus | "unknown" | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState(params.q ?? "");
  const seq = useRef(0);
  const asked = useRef<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const hintId = useId();
  const info = status !== null && status !== "unknown" ? status : null;
  const configured = info?.configured === true;
  const pending = turns.some((t) => t.result === null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/ask", { cache: "no-store", signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<AskStatus>) : Promise.reject(new Error(String(r.status)))))
      .then(setStatus)
      .catch(() => {
        if (!controller.signal.aborted) setStatus("unknown");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (turns.length) end.current?.scrollIntoView({ block: "nearest" });
  }, [turns]);

  const ask = async (raw: string) => {
    const question = raw.trim();
    if (question.length < ASK_MIN_QUESTION || pending) return;
    const id = ++seq.current;
    const history = turns
      .filter((t) => t.result?.ok)
      .slice(-ASK_MAX_HISTORY)
      .map((t) => ({ question: t.question, answer: t.result?.ok ? answerText(t.result.segments).slice(0, ASK_MAX_HISTORY_ANSWER) : "" }));
    setTurns((all) => [...all, { id, question, result: null }]);
    setDraft("");
    const activity = publishActivity({ kind: "running", title: "Asking SHIVAM.OS", detail: "Searching the portfolio", sticky: true });
    let result: AskResponse;
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, history }) });
      result = (await res.json()) as AskResponse;
    } catch {
      result = { ok: false, reason: "failed", message: "Could not reach the server. Nothing was answered." };
    }
    setTurns((all) => all.map((t) => (t.id === id ? { ...t, result } : t)));
    clearActivity(activity);
    if (result.ok) publishActivity({ kind: "completed", title: "Answer ready", detail: `${result.sources.length} source${result.sources.length === 1 ? "" : "s"} cited` });
    else publishActivity({ kind: "error", title: "No answer", detail: result.message });
  };

  const askRef = useRef(ask);
  useEffect(() => {
    askRef.current = ask;
  });

  // A question handed over by Spotlight is asked once, after the status check.
  useEffect(() => {
    const q = params.q?.trim();
    const key = q ? `${q}#${params.t ?? ""}` : null;
    if (!q || !key || !configured || asked.current === key) return;
    asked.current = key;
    void Promise.resolve().then(() => askRef.current(q));
  }, [params.q, params.t, configured]);

  const openSource = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const url = new URL(href, window.location.origin);
    const intent = pathToIntent(url.pathname, url.search);
    if (intent.type !== "app") return;
    e.preventDefault();
    open(intent.app, intent.params, { trigger: e.currentTarget });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="scroll-area min-h-0 flex-1" tabIndex={0}>
        <div className="mx-auto w-full max-w-3xl px-5 py-5 md:px-7 md:py-6">
          <p className="text-[12px] font-semibold tracking-wider text-accent-text uppercase">Ask SHIVAM.OS</p>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 className="font-display text-2xl font-semibold text-fg">Ask about Shivam&apos;s work</h3>
            {configured && info?.model && <Badge>Answers by Gemini · {info.model}</Badge>}
          </div>
          <p className="mt-1 max-w-2xl text-[14px] text-muted">
            Answers come only from this portfolio&apos;s verified content, and each one lists the pages it cites. If the portfolio doesn&apos;t cover something, the answer says so.
          </p>

          {(status === "unknown" || info?.configured === false) && (
            <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-[13.5px] text-fg">
              <p className="flex gap-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                {status === "unknown"
                  ? "The assistant's status couldn't be checked, so questions can't be sent right now."
                  : "Ask SHIVAM.OS isn't switched on for this deployment: no Gemini API key is configured, so questions can't be answered here."}
              </p>
              <p className="mt-1.5 pl-6 text-muted">Spotlight searches the same content, and Recruiter Mode summarises it by role.</p>
              <div className="mt-2.5 flex flex-wrap gap-2 pl-6">
                <Button size="sm" onClick={() => store.dispatch({ type: "spotlight", open: true })}>
                  <Search className="size-3.5" aria-hidden /> Open Spotlight
                </Button>
                <Button size="sm" onClick={(e) => open("recruiter", undefined, { trigger: e.currentTarget })}>
                  <BriefcaseBusiness className="size-3.5" aria-hidden /> Recruiter Mode
                </Button>
              </div>
            </div>
          )}

          {turns.length === 0 && (
            <section aria-labelledby={`${inputId}-try`} className="mt-6">
              <h4 id={`${inputId}-try`} className="text-[12px] font-semibold tracking-wider text-subtle uppercase">
                Try asking
              </h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <Chip
                    key={s}
                    onClick={() => {
                      if (configured) void ask(s);
                      else {
                        setDraft(s);
                        input.current?.focus();
                      }
                    }}
                  >
                    {s}
                  </Chip>
                ))}
              </div>
            </section>
          )}

          {turns.length > 0 && (
            <ol className="mt-6 space-y-6" aria-label="Questions and answers">
              {turns.map((turn) => (
                <li key={turn.id} className="space-y-3">
                  <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-accent-strong px-3.5 py-2 text-[14px] text-white">
                    <span className="sr-only">You asked: </span>
                    {turn.question}
                  </p>
                  <Answer turn={turn} onOpen={openSource} />
                </li>
              ))}
            </ol>
          )}
          <div ref={end} />
        </div>
      </div>

      <form
        className="border-t border-hairline bg-[var(--surface-solid)]/60 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-7"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(draft);
        }}
      >
        <div className="mx-auto max-w-3xl">
          <label htmlFor={inputId} className="sr-only">
            Your question
          </label>
          <div className="flex items-end gap-2">
            <textarea
              ref={input}
              id={inputId}
              rows={1}
              maxLength={ASK_MAX_QUESTION}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void ask(draft);
                }
              }}
              aria-describedby={hintId}
              disabled={!configured}
              placeholder={configured ? "Ask a question about Shivam's work…" : "Questions are unavailable here"}
              className="max-h-32 min-h-10 flex-1 resize-none rounded-[var(--radius-control)] border border-hairline bg-sunken px-3 py-2 text-[14px] text-fg outline-none placeholder:text-subtle focus:border-accent/70 disabled:opacity-60"
            />
            <Button type="submit" variant="primary" className="h-10 w-10 shrink-0 px-0" disabled={!configured || pending || draft.trim().length < ASK_MIN_QUESTION} aria-label="Ask">
              <ArrowUp className="size-4" aria-hidden />
            </Button>
          </div>
          <p id={hintId} className="mt-1.5 text-[11.5px] leading-snug text-subtle">
            Questions are sent to Google&apos;s Gemini API to write the answer; SHIVAM.OS doesn&apos;t store them.
            {info?.freeTier !== false && " This site uses Gemini's free tier, so Google may use questions to improve its products."} Please don&apos;t include personal information.
            {draft.length > ASK_MAX_QUESTION - 80 && ` ${ASK_MAX_QUESTION - draft.length} characters left.`}
          </p>
        </div>
      </form>
    </div>
  );
}

function Answer({ turn, onOpen }: { turn: Turn; onOpen: (e: MouseEvent<HTMLAnchorElement>, href: string) => void }) {
  const r = turn.result;
  if (r === null) {
    return (
      <p role="status" className="flex items-center gap-2 text-[13.5px] text-muted">
        <Sparkles className="size-4 animate-pulse text-accent-text motion-reduce:animate-none" aria-hidden />
        Searching the portfolio and writing an answer…
      </p>
    );
  }
  if (!r.ok) {
    return (
      <p role="alert" className="flex gap-2 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-[13.5px] text-fg">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
        <span>
          {r.message}
          {(r.reason === "not-configured" || r.reason === "rate-limited") && (
            <>
              {" "}
              <a className="text-accent-text underline" href={`mailto:${profile.email}`}>
                Email Shivam
              </a>
            </>
          )}
        </span>
      </p>
    );
  }
  const byN = new Map(r.sources.map((s) => [s.n, s]));
  return (
    <article className="card p-4" aria-label={`Answer to: ${turn.question}`}>
      <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap text-fg">
        {r.segments.map((seg, i) => (
          <span key={i}>
            {seg.text}
            {seg.sources.map((n) => {
              const s = byN.get(n);
              return s ? <Cite key={n} source={s} onOpen={onOpen} /> : null;
            })}
          </span>
        ))}
      </p>
      {r.truncated && <p className="mt-2 text-[12.5px] text-warning">The answer was cut short. Ask a narrower question for the rest.</p>}
      <div className="mt-3 border-t border-hairline pt-3">
        {r.sources.length === 0 ? (
          <p className="text-[12.5px] text-muted">This answer cites no portfolio content, so treat it as a pointer rather than a fact.</p>
        ) : (
          <>
            <h5 className="text-[11.5px] font-semibold tracking-wider text-subtle uppercase">Sources</h5>
            <ol className="mt-1.5 space-y-2">
              {r.sources.map((s) => (
                <li key={s.n} className="flex gap-2 text-[13px]">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-text" aria-hidden>
                    {s.n}
                  </span>
                  <div className="min-w-0">
                    <a href={s.href} onClick={(e) => onOpen(e, s.href)} className="font-medium text-accent-text underline decoration-accent/40 underline-offset-2 hover:decoration-accent">
                      {s.title}
                    </a>
                    {s.quotes.map((q) => (
                      <blockquote key={q} className="mt-1 line-clamp-3 border-l-2 border-hairline pl-2 text-[12.5px] text-muted">
                        {q}
                      </blockquote>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </article>
  );
}

function Cite({ source, onOpen }: { source: AskSource; onOpen: (e: MouseEvent<HTMLAnchorElement>, href: string) => void }) {
  return (
    <a
      href={source.href}
      onClick={(e) => onOpen(e, source.href)}
      aria-label={`Source ${source.n}: ${source.title}`}
      className="ml-0.5 inline-grid h-[18px] min-w-[18px] -translate-y-px place-items-center rounded-full bg-accent-soft px-1 align-middle text-[10.5px] font-semibold text-accent-text no-underline hover:bg-accent-strong hover:text-white"
    >
      {source.n}
    </a>
  );
}
