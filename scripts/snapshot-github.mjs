#!/usr/bin/env node
/**
 * Records a dated snapshot of the owner's public GitHub repositories for the
 * GitHub Explorer's offline fallback. Every number comes from the GitHub REST
 * API at the time this script runs; nothing is estimated.
 * Usage: node scripts/snapshot-github.mjs   (optional GITHUB_TOKEN raises the rate limit)
 */
import { writeFile } from "node:fs/promises";

const USER = "shivampatil4972";
const API = "https://api.github.com";
const headers = { Accept: "application/vnd.github+json", "User-Agent": "shivam-os-snapshot" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function get(path) {
  const res = await fetch(`${API}${path}`, { headers });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return { data: await res.json(), headers: res.headers };
}

async function commitCount(repo) {
  const res = await fetch(`${API}/repos/${USER}/${repo}/commits?per_page=1`, { headers });
  if (!res.ok) return null;
  const link = res.headers.get("link");
  if (!link) return (await res.json()).length;
  const m = /page=(\d+)>; rel="last"/.exec(link);
  return m ? Number(m[1]) : null;
}

async function main() {
  const { data: repos } = await get(`/users/${USER}/repos?per_page=100&sort=pushed`);
  const out = [];
  for (const r of repos) {
    if (r.private || r.fork) continue;
    const [{ data: languages }, commits, latest] = await Promise.all([
      get(`/repos/${USER}/${r.name}/languages`).catch(() => ({ data: {} })),
      commitCount(r.name),
      get(`/repos/${USER}/${r.name}/commits?per_page=1`).then((x) => x.data[0]).catch(() => null),
    ]);
    out.push({
      name: r.name,
      description: r.description,
      url: r.html_url,
      homepage: r.homepage || null,
      language: r.language,
      languages,
      stars: r.stargazers_count,
      forks: r.forks_count,
      createdAt: r.created_at,
      pushedAt: r.pushed_at,
      defaultBranch: r.default_branch,
      commits,
      latestCommit: latest ? { sha: latest.sha.slice(0, 7), message: latest.commit.message.split("\n")[0], date: latest.commit.author.date } : null,
    });
  }
  let ci = null;
  try {
    const { data } = await get(`/repos/${USER}/VAYORA-/actions/runs?per_page=1`);
    const run = data.workflow_runs?.[0];
    if (run) {
      const { data: jobs } = await get(`/repos/${USER}/VAYORA-/actions/runs/${run.id}/jobs`);
      ci = {
        repo: "VAYORA-",
        sha: run.head_sha.slice(0, 7),
        conclusion: run.conclusion,
        date: run.created_at,
        url: run.html_url,
        jobs: jobs.jobs.map((j) => ({ name: j.name, conclusion: j.conclusion })),
      };
    }
  } catch (err) {
    console.warn("CI lookup failed:", err.message);
  }
  const snapshot = { user: USER, fetchedAt: new Date().toISOString(), repos: out, ci };
  await writeFile(new URL("../src/content/github-snapshot.json", import.meta.url), JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`Saved ${out.length} public repositories (fetched ${snapshot.fetchedAt}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
