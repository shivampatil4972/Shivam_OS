#!/usr/bin/env node
/**
 * Broken-link check. Collects every URL in the content layer and the GitHub
 * snapshot, plus every same-origin page and asset, and requests each one.
 *   node scripts/check-links.mjs [--base http://127.0.0.1:3100] [--json out.json]
 * Internal URLs are checked only when --base is given (a running server).
 */
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const base = arg("--base");
const jsonOut = arg("--json");

// Sites that refuse automated requests: a non-2xx from them proves nothing either way.
const BOT_BLOCKED = [/^https:\/\/(www\.)?linkedin\.com\//, /^https:\/\/(www\.)?credly\.com\//, /^https:\/\/leetcode\.com\//];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir)) {
    const full = path.join(dir, entry);
    if ((await stat(full)).isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function collect() {
  const files = [...(await walk(path.join(root, "src/content"))), path.join(root, "src/lib/site.ts")];
  const external = new Set();
  const internal = new Set(["/", "/sitemap.xml", "/robots.txt", "/manifest.webmanifest", "/opengraph-image", "/icon.svg"]);
  for (const file of files) {
    const text = await readFile(file, "utf8");
    for (const m of text.matchAll(/https:\/\/[^\s"'`)<>\]]+/g)) {
      let url = m[0].replace(/[.,;]+$/, "");
      if (url.includes("${")) continue; // template strings are expanded below via the snapshot and content scans
      if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}/i.test(url)) continue; // not a URL (e.g. a bare "https://" literal)
      external.add(url);
    }
    for (const m of text.matchAll(/["'`](\/(?:images|research|resume|data)\/[^"'`\s]+)["'`]/g)) internal.add(m[1]);
  }
  // Repository links built from templates: verify through the snapshot's real URLs.
  const snapshot = JSON.parse(await readFile(path.join(root, "src/content/github-snapshot.json"), "utf8"));
  for (const r of snapshot.repos) external.add(r.url);
  if (snapshot.ci?.url) external.add(snapshot.ci.url);
  // Expand the known template helpers used in project content.
  const journex = await readFile(path.join(root, "src/content/projects/journex.ts"), "utf8");
  for (const m of journex.matchAll(/(?:blob|tree)\("([^"]+)"\)/g)) {
    external.add(`https://github.com/shivampatil4972/VAYORA-/${journex.includes(`blob("${m[1]}")`) && m[0].startsWith("blob") ? "blob" : "tree"}/HEAD/${m[1]}`);
  }
  for (const m of journex.matchAll(/commit\("([0-9a-f]{7})"\)/g)) external.add(`https://github.com/shivampatil4972/VAYORA-/commit/${m[1]}`);
  // Every app route and case study from the sitemap source.
  const apps = ["projects", "about", "skills", "education", "experience", "research", "ai-lab", "xray", "github", "terminal", "resume", "contact", "settings", "quality", "recruiter"];
  apps.forEach((a) => internal.add(`/${a}`));
  const projectFiles = await walk(path.join(root, "src/content/projects"));
  for (const f of projectFiles) {
    const text = await readFile(f, "utf8");
    for (const m of text.matchAll(/\bslug: "([a-z0-9-]+)"/g)) internal.add(`/projects/${m[1]}`);
  }
  return { external: [...external].sort(), internal: [...internal].sort() };
}

async function check(url) {
  const started = Date.now();
  for (const method of ["HEAD", "GET"]) {
    try {
      const res = await fetch(url, { method, redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "User-Agent": "shivam-os-link-check/1.0" } });
      if (method === "HEAD" && (res.status === 405 || res.status === 403 || res.status === 404 || res.status === 429)) continue;
      if (method === "GET") await res.body?.cancel();
      return { url, status: res.status, ok: res.ok, ms: Date.now() - started };
    } catch (err) {
      if (method === "GET") return { url, status: 0, ok: false, error: err.message, ms: Date.now() - started };
    }
  }
  return { url, status: 0, ok: false, error: "unreachable", ms: Date.now() - started };
}

async function pool(items, size, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (i < items.length) {
        const item = items[i++];
        out.push(await fn(item));
      }
    }),
  );
  return out;
}

const { external, internal } = await collect();
const targets = [...external, ...(base ? internal.map((p) => `${base.replace(/\/$/, "")}${p}`) : [])];
const results = await pool(targets, 8, check);
const blocked = results.filter((r) => !r.ok && BOT_BLOCKED.some((re) => re.test(r.url)));
const broken = results.filter((r) => !r.ok && !BOT_BLOCKED.some((re) => re.test(r.url)));
const summary = {
  checkedAt: new Date().toISOString(),
  total: results.length,
  external: external.length,
  internal: base ? internal.length : 0,
  ok: results.filter((r) => r.ok).length,
  broken: broken.map((r) => ({ url: r.url, status: r.status, error: r.error })),
  unverifiable: blocked.map((r) => ({ url: r.url, status: r.status })),
};
console.log(`Checked ${summary.total} links: ${summary.ok} OK, ${broken.length} broken, ${blocked.length} unverifiable (bot-blocked).`);
for (const b of broken) console.log(`  BROKEN ${b.status || "ERR"} ${b.url}${b.error ? ` (${b.error})` : ""}`);
for (const b of blocked) console.log(`  UNVERIFIABLE ${b.status} ${b.url}`);
if (jsonOut) await writeFile(jsonOut, JSON.stringify(summary, null, 2));
process.exit(broken.length ? 1 : 0);
