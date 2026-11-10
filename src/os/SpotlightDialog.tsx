"use client";

import { CornerDownLeft, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AppIcon } from "@/design/icons/AppIcon";
import { cn } from "@/lib/cn";
import { search } from "@/lib/search";
import { buildSearchIndex, SUGGESTED_IDS, type OSSearchEntry } from "@/lib/searchIndex";
import { runSearchAction } from "./actions";
import { useOS } from "./OSContext";
import { publishActivity } from "./state/activity";
import { useModalDialog } from "./useDialog";

const ASK_ENTRY_ID = "ask-question";

export default function SpotlightDialog() {
  const os = useOS();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const [active, setActive] = useState(0);
  const dialog = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const announced = useRef("");
  const close = () => os.store.dispatch({ type: "spotlight", open: false });
  useModalDialog(dialog, true, close, input);

  const index = useMemo(() => buildSearchIndex(), []);
  const results: OSSearchEntry[] = useMemo(() => {
    const q = deferred.trim();
    if (!q) return SUGGESTED_IDS.map((id) => index.find((e) => e.id === id)).filter((e): e is OSSearchEntry => Boolean(e));
    const found = search(index, deferred, 40);
    // A question (several words) can also go to Ask SHIVAM.OS.
    if (q.length < 8 || !q.includes(" ")) return found;
    const askEntry: OSSearchEntry = {
      id: ASK_ENTRY_ID,
      group: "Ask SHIVAM.OS",
      title: `Ask: “${q.slice(0, 120)}”`,
      subtitle: "Get an answer that cites this portfolio",
      action: { kind: "open", app: "ask", params: { q: q.slice(0, 400) } },
    };
    return q.endsWith("?") ? [askEntry, ...found] : [...found, askEntry];
  }, [deferred, index]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (entry: OSSearchEntry | undefined) => {
    if (!entry) return;
    if (query.trim() && announced.current !== query) {
      announced.current = query;
      publishActivity({ kind: "search", title: `“${query.trim()}”`, detail: `${results.length} result${results.length === 1 ? "" : "s"}` });
    }
    close();
    // A fresh token lets the same question be asked again from Spotlight.
    const action = entry.id === ASK_ENTRY_ID && entry.action.kind === "open" ? { ...entry.action, params: { ...entry.action.params, t: String(Date.now()) } } : entry.action;
    runSearchAction(os, action);
  };

  const groups: Array<{ name: string; items: Array<{ entry: OSSearchEntry; index: number }> }> = [];
  results.forEach((entry, i) => {
    const name = query.trim() ? entry.group : "Suggestions";
    let g = groups.find((x) => x.name === name);
    if (!g) groups.push((g = { name, items: [] }));
    g.items.push({ entry, index: i });
  });

  const activeId = results[active] ? `spot-opt-${results[active]!.id}` : undefined;

  return (
    <div className="scrim-in fixed inset-0 z-[60] flex items-start justify-center bg-black/30 px-4 pt-[12vh] backdrop-blur-[2px] max-md:p-0" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Spotlight search"
        className="spotlight-in glass glass-edge w-full max-w-[640px] overflow-hidden rounded-[20px] shadow-[var(--shadow-window)] max-md:h-full max-md:max-w-none max-md:rounded-none"
      >
        <div className="flex items-center gap-3 border-b border-hairline px-4 max-md:pt-[env(safe-area-inset-top)]">
          <Search className="size-5 shrink-0 text-muted" aria-hidden />
          <input
            ref={input}
            role="combobox"
            aria-expanded="true"
            aria-controls="spotlight-results"
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-label="Search apps, projects, skills, research and actions"
            placeholder="Search apps, projects, skills, research…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(results.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                choose(results[active]);
              }
            }}
            className="h-14 w-full bg-transparent text-[17px] text-fg outline-none placeholder:text-subtle"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" onClick={close} className="rounded-md px-2 py-1 text-[12px] text-muted hover:bg-hover md:hidden">
            Cancel
          </button>
          <kbd className="hidden rounded-md border border-hairline px-1.5 py-0.5 text-[11px] text-subtle md:block" aria-hidden>
            esc
          </kbd>
        </div>
        <ul id="spotlight-results" ref={listRef} role="listbox" aria-label="Results" className="scroll-area max-h-[min(60vh,460px)] p-2 max-md:max-h-[calc(100dvh-60px)]">
          {results.length === 0 && (
            <li role="presentation" className="px-3 py-8 text-center text-sm text-muted">
              No results for “{query}”. Try a technology, a project name or “résumé”.
            </li>
          )}
          {groups.map((g) => (
            <li key={g.name} role="presentation">
              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-subtle uppercase" aria-hidden>
                {g.name}
              </p>
              <ul role="group" aria-label={g.name}>
                {g.items.map(({ entry, index }) => (
                  <li
                    key={entry.id}
                    id={`spot-opt-${entry.id}`}
                    role="option"
                    aria-selected={index === active}
                    data-index={index}
                    onPointerMove={() => setActive(index)}
                    onClick={() => choose(entry)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2",
                      index === active ? "bg-accent-strong text-white" : "text-fg",
                    )}
                  >
                    <EntryIcon entry={entry} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium">{entry.title}</span>
                      {entry.subtitle && <span className={cn("block truncate text-[12.5px]", index === active ? "text-white/80" : "text-muted")}>{entry.subtitle}</span>}
                    </span>
                    {index === active && <CornerDownLeft className="size-4 shrink-0 opacity-80" aria-hidden />}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="sr-only" role="status" aria-live="polite">
          {query.trim() ? `${results.length} results` : ""}
        </p>
      </div>
    </div>
  );
}

function EntryIcon({ entry }: { entry: OSSearchEntry }) {
  const a = entry.action;
  if (a.kind === "open") return <AppIcon app={a.app} size={30} />;
  return <AppIcon app="spotlight" size={30} />;
}
