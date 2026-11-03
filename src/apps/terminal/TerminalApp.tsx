"use client";

import { useEffect, useRef, useState } from "react";
import { complete, execute } from "@/lib/terminal";
import { useOS } from "@/os/OSContext";
import { runSearchAction } from "@/os/actions";
import { setPrefs } from "@/os/state/prefs";

interface Line {
  id: number;
  text: string;
  kind: "input" | "output" | "error";
}

const HISTORY_KEY = "shivam-os:terminal-history";
const WELCOME = ["SHIVAM.OS terminal — a safe shell with predefined commands.", "Type “help” to begin."];

function loadHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((x): x is string => typeof x === "string").slice(-50) : [];
  } catch {
    return [];
  }
}

let lineId = 0;
const mk = (text: string, kind: Line["kind"]): Line => ({ id: ++lineId, text, kind });

export default function TerminalApp() {
  const os = useOS();
  const [lines, setLines] = useState<Line[]>(() => WELCOME.map((t) => mk(t, "output")));
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>(loadHistory);
  const [cursor, setCursor] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  const submit = () => {
    const command = input;
    const nextHistory = command.trim() ? [...history, command.trim()].slice(-50) : history;
    const out = execute(command, nextHistory);
    setHistory(nextHistory);
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    } catch {
      // ignore
    }
    setCursor(null);
    setInput("");
    if (out.effect?.kind === "clear") {
      setLines([]);
      return;
    }
    setLines((prev) => [...prev, mk(`$ ${command}`, "input"), ...out.lines.map((l) => mk(l, out.error ? "error" : "output"))]);
    const effect = out.effect;
    if (!effect) return;
    if (effect.kind === "open") os.open(effect.app, effect.params);
    if (effect.kind === "theme") setPrefs({ theme: effect.theme });
    if (effect.kind === "download") runSearchAction(os, { kind: "download", href: effect.href, fileName: effect.fileName });
  };

  return (
    <div className="flex h-full flex-col bg-[#060a12] font-mono text-[13px] leading-relaxed text-[#d6e2f5]" onPointerUp={() => window.getSelection()?.isCollapsed && inputRef.current?.focus()}>
      <div className="scroll-area flex-1 p-4" role="log" aria-live="polite" aria-label="Terminal output" tabIndex={0}>
        {lines.map((l) => (
          <pre key={l.id} className={l.kind === "input" ? "whitespace-pre-wrap text-[#7fb0ff]" : l.kind === "error" ? "whitespace-pre-wrap text-[#ff9b9b]" : "whitespace-pre-wrap"}>
            {l.text || " "}
          </pre>
        ))}
        <div ref={endRef} />
      </div>
      <form
        className="flex items-center gap-2 border-t border-white/10 px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="terminal-input" className="text-[#3ddc84]">
          guest@shivam-os <span className="text-[#7fb0ff]">~</span> $
        </label>
        <input
          id="terminal-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" && history.length) {
              e.preventDefault();
              const next = cursor === null ? history.length - 1 : Math.max(0, cursor - 1);
              setCursor(next);
              setInput(history[next] ?? "");
            } else if (e.key === "ArrowDown" && cursor !== null) {
              e.preventDefault();
              const next = cursor + 1;
              if (next >= history.length) {
                setCursor(null);
                setInput("");
              } else {
                setCursor(next);
                setInput(history[next] ?? "");
              }
            } else if (e.key === "Tab") {
              const options = complete(input);
              if (options.length === 1) {
                e.preventDefault();
                setInput(`${options[0]} `);
              } else if (options.length > 1) {
                e.preventDefault();
                setLines((prev) => [...prev, mk(options.join("   "), "output")]);
              }
            } else if (e.key === "l" && e.ctrlKey) {
              e.preventDefault();
              setLines([]);
            }
          }}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="terminal-hint"
          className="min-w-0 flex-1 bg-transparent text-[#eef2f9] caret-[#3ddc84] outline-none"
        />
        <span id="terminal-hint" className="sr-only">
          Type a command and press Enter. Type help for the list of commands.
        </span>
      </form>
    </div>
  );
}
