"use client";

import { CircleCheck, CircleX, GitCommit, RefreshCw, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import snapshot from "@/content/github-snapshot.json";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { Badge, Button, ExternalLink, LinkButton } from "@/design/ui";
import { GitHubGlyph } from "@/design/icons/Brand";
import { useOS } from "@/os/OSContext";
import { AppScroll, formatDate } from "../shared";

interface Repo {
  name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  languages: Record<string, number>;
  stars: number;
  forks: number;
  createdAt: string;
  pushedAt: string;
  defaultBranch: string;
  commits: number | null;
  latestCommit: { sha: string; message: string; date: string } | null;
}

const snapshotRepos = snapshot.repos as unknown as Repo[];

/* Languages keep one colour everywhere (fixed categorical order, validated palette). */
const LANG_SLOTS = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"];

/** Map a repository to its case study when one exists, using the case study's repository link. */
function caseStudyFor(repoName: string) {
  return projects.find((p) => p.links.some((l) => l.kind === "repo" && l.href.toLowerCase().endsWith(`/${repoName.toLowerCase()}`)));
}

export default function GitHubApp() {
  const { open } = useOS();
  const [live, setLive] = useState<{ at: string; byName: Map<string, { pushedAt: string; stars: number; description: string | null }> } | null>(null);
  const [state, setState] = useState<"loading" | "live" | "snapshot">("loading");

  const load = useCallback(() => {
    fetch(`https://api.github.com/users/${snapshot.user}/repos?per_page=100&sort=pushed`, { headers: { Accept: "application/vnd.github+json" } })
      .then((r) => {
        if (!r.ok) {
          void r.body?.cancel();
          throw new Error(String(r.status));
        }
        return r.json() as Promise<Array<{ name: string; pushed_at: string; stargazers_count: number; description: string | null; private: boolean }>>;
      })
      .then((list) => {
        setLive({ at: new Date().toISOString(), byName: new Map(list.filter((r) => !r.private).map((r) => [r.name, { pushedAt: r.pushed_at, stars: r.stargazers_count, description: r.description }])) });
        setState("live");
      })
      .catch(() => setState("snapshot"));
  }, []);

  useEffect(load, [load]);

  const refresh = () => {
    setState("loading");
    load();
  };

  const langOrder = useMemo(() => {
    const totals = new Map<string, number>();
    for (const r of snapshotRepos) for (const [l, b] of Object.entries(r.languages)) totals.set(l, (totals.get(l) ?? 0) + b);
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([l]) => l);
  }, []);
  const colorFor = (lang: string) => {
    const i = langOrder.indexOf(lang);
    return i >= 0 && i < LANG_SLOTS.length ? LANG_SLOTS[i]! : "var(--chart-ref)";
  };

  const repos: Repo[] = snapshotRepos
    .filter((r) => r.commits !== null)
    .map((r) => ({ ...r, ...(live?.byName.get(r.name) ?? {}) }))
    .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));
  const ci = snapshot.ci;

  return (
    <AppScroll wide>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl font-semibold text-fg">GitHub</h3>
          <p className="mt-1 text-[14px] text-muted">
            Public repositories of <ExternalLink href={profile.links.github}>@{snapshot.user}</ExternalLink>. Private work (e.g. IntelliGrade AI, client projects) is described in its case study instead.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={state === "live" ? "success" : state === "loading" ? "neutral" : "warning"}>
            {state === "live" ? "Live from the GitHub API" : state === "loading" ? "Checking GitHub…" : `Snapshot · ${formatDate(snapshot.fetchedAt.slice(0, 10))}`}
          </Badge>
          <Button size="sm" onClick={refresh} aria-label="Refresh from GitHub">
            <RefreshCw className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>
      {state === "snapshot" && (
        <p className="mt-2 text-[12.5px] text-muted" role="status">
          The GitHub API could not be reached (or its rate limit was hit), so this view shows the snapshot recorded on {formatDate(snapshot.fetchedAt.slice(0, 10))}.
        </p>
      )}

      {ci && (
        <section aria-labelledby="gh-ci" className="card mt-5 p-4">
          <h4 id="gh-ci" className="flex flex-wrap items-center gap-2 font-semibold text-fg">
            Latest CI run · {ci.repo}
            <Badge tone={ci.conclusion === "success" ? "success" : "danger"}>{ci.conclusion}</Badge>
          </h4>
          <p className="mt-0.5 text-[12.5px] text-subtle">
            Commit {ci.sha} · {formatDate(ci.date.slice(0, 10))} · recorded in the snapshot
          </p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {ci.jobs.map((j) => (
              <li key={j.name} className="flex items-center gap-2 text-[13px] text-fg">
                {j.conclusion === "success" ? <CircleCheck className="size-4 text-success" aria-hidden /> : <CircleX className="size-4 text-danger" aria-hidden />}
                <span>{j.name}</span>
                <span className="sr-only">: {j.conclusion}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[13px]">
            <ExternalLink href={ci.url}>View the run on GitHub</ExternalLink>
          </p>
        </section>
      )}

      <ul className="mt-5 grid gap-3 md:grid-cols-2">
        {repos.map((r) => (
          <RepoCard key={r.name} r={r} colorFor={colorFor} onCaseStudy={(slug) => open("projects", { slug })} />
        ))}
      </ul>

      <p className="mt-4 text-[12.5px] text-subtle">
        Commit counts, languages and latest commits come from the snapshot taken {formatDate(snapshot.fetchedAt.slice(0, 10))} with <code className="font-mono">npm run snapshot:github</code>; push dates and stars refresh live when the API is reachable. Empty repositories are hidden.
      </p>
    </AppScroll>
  );
}

function RepoCard({ r, colorFor, onCaseStudy }: { r: Repo; colorFor: (l: string) => string; onCaseStudy: (slug: string) => void }) {
  const langs = Object.entries(r.languages);
  const total = langs.reduce((s, [, b]) => s + b, 0);
  const top = langs.slice(0, 5);
  const study = caseStudyFor(r.name);
  return (
    <li className="card flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <h4 className="min-w-0 truncate font-mono text-[14px] font-semibold text-fg">{r.name}</h4>
        {r.stars > 0 && (
          <span className="inline-flex items-center gap-1 text-[12px] text-muted">
            <Star className="size-3.5" aria-hidden /> {r.stars}
          </span>
        )}
      </div>
      <p className="mt-1 line-clamp-2 text-[13px] text-muted">{r.description ?? study?.tagline ?? "No description on GitHub."}</p>
      {total > 0 && (
        <div className="mt-3">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-sunken" aria-hidden>
            {top.map(([l, b], i) => (
              <span key={l} style={{ width: `${(b / total) * 100}%`, background: colorFor(l), marginLeft: i ? 2 : 0 }} />
            ))}
          </div>
          <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-muted" aria-label="Languages">
            {top.map(([l, b]) => (
              <li key={l} className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full" style={{ background: colorFor(l) }} aria-hidden />
                {l} {((b / total) * 100).toFixed(1)}%
              </li>
            ))}
          </ul>
        </div>
      )}
      {r.latestCommit && (
        <p className="mt-3 flex items-start gap-1.5 text-[12.5px] text-muted">
          <GitCommit className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0">
            <span className="font-mono text-fg">{r.latestCommit.sha}</span> {r.latestCommit.message}
          </span>
        </p>
      )}
      <p className="mt-1 text-[12px] text-subtle">
        {r.commits} commit{r.commits === 1 ? "" : "s"} · last push {formatDate(r.pushedAt.slice(0, 10))} · created {formatDate(r.createdAt.slice(0, 10))}
      </p>
      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        <LinkButton href={r.url} size="sm">
          <GitHubGlyph className="size-3.5" /> Code
        </LinkButton>
        <LinkButton href={`${r.url}#readme`} size="sm">
          README
        </LinkButton>
        <LinkButton href={`${r.url}/commits/${r.defaultBranch}`} size="sm">
          Commits
        </LinkButton>
        {study && (
          <Button size="sm" onClick={() => onCaseStudy(study.slug)}>
            Case study
          </Button>
        )}
      </div>
    </li>
  );
}
