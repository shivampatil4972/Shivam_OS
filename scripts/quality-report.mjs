#!/usr/bin/env node
/**
 * Runs every quality check for real and writes public/reports/quality-report.json,
 * which the Quality Control Center displays. Nothing is assumed: a check that
 * did not run is recorded as "not-run" or "unavailable", never as passed.
 *
 *   npm run qc                       # full run (build, server, E2E, perf, links…)
 *   E2E_CHANNEL=chrome npm run qc    # use an installed Chrome instead of Playwright's
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const raw = path.join(root, "reports", "raw");
/** Repo-relative output path for child commands (absolute paths may contain spaces, which the Windows shell splits). */
const rel = (name) => `reports/raw/${name}`;
const PORT = Number(process.env.QC_PORT ?? 3201);
const BASE = `http://127.0.0.1:${PORT}`;
const channel = process.env.E2E_CHANNEL || "";
const isWin = process.platform === "win32";

rmSync(raw, { recursive: true, force: true });
mkdirSync(raw, { recursive: true });

const checks = [];
const now = () => new Date().toISOString();
const tail = (text, n = 12) => text.split(/\r?\n/).map((l) => l.trimEnd()).filter(Boolean).slice(-n);

function run(cmd, args, opts = {}) {
  const started = Date.now();
  const res = spawnSync(cmd, args, { cwd: root, shell: isWin, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: { ...process.env, ...opts.env } });
  return { code: res.status ?? 1, out: `${res.stdout ?? ""}${res.stderr ?? ""}`, ms: Date.now() - started, at: new Date(started).toISOString() };
}

function add(check) {
  checks.push({ metrics: [], details: [], ...check });
  const c = checks[checks.length - 1];
  console.log(`${c.status.toUpperCase().padEnd(12)} ${c.title} — ${c.summary}`);
}

const readJson = (file) => (existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null);

// 1. TypeScript -------------------------------------------------------------
{
  const r = run("npx", ["tsc", "--noEmit"]);
  const errors = (r.out.match(/error TS\d+/g) ?? []).length;
  add({ id: "typecheck", title: "TypeScript (strict)", category: "code", command: "npx tsc --noEmit", ranAt: r.at, durationMs: r.ms, status: r.code === 0 ? "passed" : "failed", summary: r.code === 0 ? "No type errors in strict mode." : `${errors} type errors.`, details: r.code === 0 ? [] : tail(r.out) });
}

// 2. ESLint -----------------------------------------------------------------
{
  const out = path.join(raw, "eslint.json");
  const r = run("npx", ["eslint", ".", "-f", "json", "-o", rel("eslint.json")]);
  const files = readJson(out) ?? [];
  const errors = files.reduce((s, f) => s + f.errorCount, 0);
  const warnings = files.reduce((s, f) => s + f.warningCount, 0);
  const details = files.flatMap((f) => f.messages.map((m) => `${path.relative(root, f.filePath)}:${m.line} ${m.ruleId}: ${m.message.split("\n")[0]}`)).slice(0, 20);
  add({ id: "lint", title: "ESLint (Next.js, React hooks, accessibility, TypeScript rules)", category: "code", command: "npx eslint .", ranAt: r.at, durationMs: r.ms, status: errors ? "failed" : warnings ? "warning" : r.code === 0 ? "passed" : "failed", summary: `${errors} errors, ${warnings} warnings across ${files.length} files.`, metrics: [{ label: "Files linted", value: String(files.length) }], details });
}

// 3. Unit tests ---------------------------------------------------------------
{
  const out = path.join(raw, "unit.json");
  const r = run("npx", ["vitest", "run", "--reporter=json", `--outputFile=${rel("unit.json")}`]);
  const j = readJson(out);
  const failedNames = j ? j.testResults.flatMap((f) => f.assertionResults.filter((a) => a.status === "failed").map((a) => `${path.relative(root, f.name)} › ${a.fullName}`)) : [];
  add({
    id: "unit",
    title: "Unit tests (Vitest)",
    category: "tests",
    command: "npx vitest run",
    ranAt: r.at,
    durationMs: r.ms,
    status: j && j.numFailedTests === 0 && r.code === 0 ? "passed" : "failed",
    summary: j ? `${j.numPassedTests} of ${j.numTotalTests} tests passed in ${j.numTotalTestSuites} suites.` : "The test run did not produce a report.",
    metrics: j ? [{ label: "Passed", value: String(j.numPassedTests) }, { label: "Failed", value: String(j.numFailedTests) }, { label: "Files", value: String(j.testResults.length) }] : [],
    details: failedNames.length ? failedNames : j ? j.testResults.map((f) => `${path.relative(root, f.name)}: ${f.assertionResults.length} tests`) : tail(r.out),
  });
}

// 4. Production build -------------------------------------------------------------
const build = run("npx", ["next", "build"]);
{
  const pages = /Generating static pages[^(]*\((\d+)\/(\d+)\)/.exec(build.out);
  add({ id: "build", title: "Production build (next build)", category: "code", command: "npx next build", ranAt: build.at, durationMs: build.ms, status: build.code === 0 ? "passed" : "failed", summary: build.code === 0 ? `Built successfully${pages ? `; ${pages[2]} pages prerendered as static HTML` : ""}.` : "The build failed.", metrics: pages ? [{ label: "Static pages", value: pages[2] }] : [], details: build.code === 0 ? [] : tail(build.out, 20) });
}

// 5. Serve the build for browser-based checks ------------------------------------------
let server = null;
async function startServer() {
  server = spawn("npx", ["next", "start", "-p", String(PORT)], { cwd: root, shell: isWin, stdio: "ignore" });
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}
function stopServer() {
  if (!server) return;
  if (isWin) spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  else server.kill("SIGTERM");
}

const serverUp = build.code === 0 && (await startServer());
const browserEnv = { E2E_BASE_URL: BASE, ...(channel ? { E2E_CHANNEL: channel } : {}) };

if (serverUp) {
  // 6. End-to-end tests (desktop + mobile) and accessibility scans ------------------------
  const r = run("npx", ["playwright", "test"], { env: browserEnv });
  const j = readJson(path.join(raw, "e2e.json"));
  const stats = j?.stats ?? null;
  const failures = [];
  const walk = (suite, trail = []) => {
    for (const s of suite.suites ?? []) walk(s, [...trail, s.title]);
    for (const spec of suite.specs ?? []) for (const t of spec.tests) if (t.status === "unexpected") failures.push(`[${t.projectName}] ${[...trail, spec.title].filter(Boolean).join(" › ")}`);
  };
  if (j) walk(j);
  const projects = new Map();
  if (j) {
    const count = (suite) => {
      for (const s of suite.suites ?? []) count(s);
      for (const spec of suite.specs ?? []) for (const t of spec.tests) if (t.status !== "skipped") projects.set(t.projectName, (projects.get(t.projectName) ?? 0) + 1);
    };
    count(j);
  }
  add({
    id: "e2e",
    title: "End-to-end tests (Playwright, desktop 1440×900 and Pixel 7)",
    category: "tests",
    command: "npx playwright test",
    ranAt: r.at,
    durationMs: r.ms,
    status: !stats ? "failed" : stats.unexpected > 0 ? "failed" : stats.flaky > 0 ? "warning" : "passed",
    summary: stats ? `${stats.expected} passed, ${stats.unexpected} failed, ${stats.flaky} flaky (${stats.skipped} skipped because they apply to the other viewport).` : "The E2E run did not produce a report.",
    metrics: [...projects.entries()].map(([name, n]) => ({ label: `${name} tests run`, value: String(n) })),
    details: failures.length ? failures : stats ? [] : tail(r.out),
  });

  // Accessibility (axe-core), from the scans the E2E suite wrote.
  const dir = path.join(raw, "a11y");
  const scans = existsSync(dir) ? readdirSync(dir).map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8"))) : [];
  const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const rules = new Map();
  for (const s of scans) for (const v of s.violations) {
    byImpact[v.impact ?? "minor"] = (byImpact[v.impact ?? "minor"] ?? 0) + v.nodes;
    rules.set(`${v.id} (${v.impact})`, (rules.get(`${v.id} (${v.impact})`) ?? 0) + v.nodes);
  }
  const total = Object.values(byImpact).reduce((a, b) => a + b, 0);
  const routes = new Set(scans.map((s) => s.route));
  add({
    id: "a11y",
    title: "Accessibility (axe-core, WCAG 2.2 A/AA rules)",
    category: "accessibility",
    command: "npx playwright test tests/e2e/mobile-a11y.spec.ts",
    ranAt: scans.length ? r.at : null,
    durationMs: null,
    status: !scans.length ? "not-run" : byImpact.critical + byImpact.serious > 0 ? "failed" : total > 0 ? "warning" : "passed",
    summary: scans.length ? `${scans.length} scans of ${routes.size} routes (light and dark, desktop and mobile): ${total === 0 ? "no violations found" : `${total} affected elements`}.` : "No scans were recorded.",
    metrics: Object.entries(byImpact).map(([k, v]) => ({ label: k, value: String(v) })),
    details: [...[...rules.entries()].map(([k, v]) => `${k}: ${v} elements`), "Automated rules catch only part of WCAG; keyboard, focus and reduced-motion behaviour is covered by the E2E suite, screen-reader testing is listed separately."],
  });

  // 7. Performance (lab) -------------------------------------------------------------------
  const perfOut = path.join(raw, "perf.json");
  const p = run("node", ["scripts/perf-probe.mjs", "--base", BASE, "--json", rel("perf.json"), ...(channel ? ["--channel", channel] : [])]);
  const perf = readJson(perfOut);
  if (perf) {
    const bad = perf.results.filter((x) => x.lcpMs > 2500 || x.cls > 0.1 || x.tbtMs > 200);
    add({
      id: "performance",
      title: "Performance (lab: LCP, CLS, blocking time, bytes)",
      category: "performance",
      command: "node scripts/perf-probe.mjs",
      ranAt: p.at,
      durationMs: p.ms,
      status: bad.length === 0 ? "passed" : "warning",
      summary: bad.length === 0 ? "Every measured page is within LCP ≤ 2.5 s, CLS ≤ 0.1 and blocking time ≤ 200 ms." : `${bad.length} of ${perf.results.length} measurements exceed a target (LCP 2.5 s, CLS 0.1, blocking time 200 ms).`,
      metrics: perf.results.map((x) => ({ label: `${x.profile} ${x.route}`, value: `LCP ${(x.lcpMs / 1000).toFixed(2)} s · CLS ${x.cls} · TBT ${x.tbtMs} ms · JS ${x.jsKB} KB` })),
      details: [perf.method, perf.browser ? `Browser: ${perf.browser}` : null, "These are lab numbers from one machine, not field data from real visitors."].filter(Boolean),
    });
  } else {
    add({ id: "performance", title: "Performance (lab)", category: "performance", command: "node scripts/perf-probe.mjs", ranAt: p.at, durationMs: p.ms, status: "failed", summary: "The performance probe did not complete.", details: tail(p.out) });
  }

  // 8. Links ----------------------------------------------------------------------------------
  const linkOut = path.join(raw, "links.json");
  const l = run("node", ["scripts/check-links.mjs", "--base", BASE, "--json", rel("links.json")]);
  const links = readJson(linkOut);
  if (links) {
    add({
      id: "links",
      title: "Broken links (content, repositories, pages and assets)",
      category: "links",
      command: "node scripts/check-links.mjs",
      ranAt: l.at,
      durationMs: l.ms,
      status: links.broken.length ? "failed" : links.unverifiable.length ? "warning" : "passed",
      summary: `${links.ok} of ${links.total} links responded successfully; ${links.broken.length} broken; ${links.unverifiable.length} could not be verified because the site blocks automated requests.`,
      metrics: [{ label: "External", value: String(links.external) }, { label: "Internal", value: String(links.internal) }],
      details: [...links.broken.map((b) => `BROKEN ${b.status || "ERR"} ${b.url}`), ...links.unverifiable.map((u) => `Unverifiable (HTTP ${u.status}) ${u.url}`)],
    });
  } else {
    add({ id: "links", title: "Broken links", category: "links", command: "node scripts/check-links.mjs", ranAt: l.at, durationMs: l.ms, status: "failed", summary: "The link check did not complete.", details: tail(l.out) });
  }
} else {
  for (const [id, title, category] of [["e2e", "End-to-end tests", "tests"], ["a11y", "Accessibility (axe-core)", "accessibility"], ["performance", "Performance (lab)", "performance"], ["links", "Broken links", "links"]]) {
    add({ id, title, category, command: "—", ranAt: null, durationMs: null, status: "not-run", summary: "Skipped because the production build or server was not available." });
  }
}
stopServer();

// 9. Dependencies ---------------------------------------------------------------------------
{
  const audit = (args) => {
    const r = run("npm", ["audit", "--json", ...args]);
    try {
      return { r, j: JSON.parse(r.out.slice(r.out.indexOf("{"))) };
    } catch {
      return { r, j: null };
    }
  };
  const prod = audit(["--omit=dev"]);
  const all = audit([]);
  const pv = prod.j?.metadata?.vulnerabilities;
  const av = all.j?.metadata?.vulnerabilities;
  if (pv && av) {
    const serious = (v) => v.high + v.critical;
    const devOnly = av.total - pv.total;
    const pkgs = Object.values(all.j.vulnerabilities ?? {});
    const roots = [...new Set(pkgs.filter((x) => x.via.some((y) => typeof y !== "string")).map((x) => `${x.name} (${x.severity}): ${x.via.filter((y) => typeof y !== "string").map((y) => y.title).join("; ")}`))];
    add({
      id: "dependencies",
      title: "Dependency audit (npm audit)",
      category: "dependencies",
      command: "npm audit --omit=dev && npm audit",
      ranAt: prod.r.at,
      durationMs: prod.r.ms + all.r.ms,
      status: serious(pv) > 0 ? "failed" : av.total > 0 ? "warning" : "passed",
      summary: `Production dependencies: ${pv.total === 0 ? "no known vulnerabilities" : `${pv.total} advisories`}. Development tooling: ${devOnly === 0 ? "none" : `${devOnly} advisories (${av.moderate} moderate, ${av.high} high, ${av.critical} critical across all packages)`}.`,
      metrics: [
        { label: "Production advisories", value: String(pv.total) },
        { label: "Dev-only advisories", value: String(devOnly) },
        { label: "High/critical (all)", value: String(serious(av)) },
      ],
      details: [...roots, ...(devOnly ? ["Dev-only advisories affect tools that run on developer and CI machines (ESLint), not code shipped to visitors."] : [])],
    });
  } else {
    add({ id: "dependencies", title: "Dependency audit (npm audit)", category: "dependencies", command: "npm audit --json", ranAt: prod.r.at, durationMs: prod.r.ms, status: "unavailable", summary: "npm audit did not return a report (it needs network access to the registry).", details: tail(prod.r.out, 5) });
  }
}

// 10. Content placeholders --------------------------------------------------------------------
{
  const dir = path.join(root, "src", "content");
  const files = [];
  const walk = (d) => readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : files.push(path.join(d, e.name))));
  walk(dir);
  const items = [];
  for (const f of files) {
    if (!/\.ts$/.test(f) || /schema|placeholder/.test(f)) continue;
    for (const m of readFileSync(f, "utf8").matchAll(/placeholder\(\s*"((?:[^"\\]|\\.)*)"\s*\)/g)) items.push(`${path.relative(root, f)}: ${m[1]}`);
  }
  add({ id: "content", title: "Content integrity (open placeholders)", category: "content", command: "scan of src/content for placeholder()", ranAt: now(), durationMs: null, status: items.length ? "warning" : "passed", summary: items.length ? `${items.length} details are marked as editable placeholders for the owner to confirm; none is presented as fact.` : "No open placeholders.", metrics: [{ label: "Open placeholders", value: String(items.length) }], details: items });
}

// 11. Checks this project does not run (stated explicitly) -------------------------------------------
add({ id: "screen-reader", title: "Manual screen-reader testing (NVDA, VoiceOver)", category: "accessibility", command: "manual", ranAt: null, durationMs: null, status: "not-run", summary: "Not performed. Automated axe scans and keyboard tests do not replace testing with assistive technology." });
add({ id: "real-devices", title: "Real-device testing (iOS Safari, Android Chrome)", category: "tests", command: "manual", ranAt: null, durationMs: null, status: "not-run", summary: "Not performed. Mobile behaviour is tested in Chrome's Pixel 7 emulation only; WebKit/Safari has not been tested." });
add({ id: "contact-delivery", title: "Contact form delivery through a live provider", category: "tests", command: "—", ranAt: null, durationMs: null, status: process.env.FORMSPREE_FORM_ID || process.env.RESEND_API_KEY ? "not-run" : "unavailable", summary: "No mail provider is configured for this build, so real delivery has not been exercised. The form says so instead of claiming success; the delivery code is unit-tested against a stubbed provider." });
await (async () => {
  const base = { id: "ci", title: "Continuous integration on GitHub Actions", category: "tests", command: ".github/workflows/ci.yml" };
  const remote = spawnSync("git", ["remote", "get-url", "origin"], { cwd: root, encoding: "utf8" }).stdout?.trim() ?? "";
  const slug = /github\.com[/:]([^/]+\/[^/.]+)/.exec(remote)?.[1];
  if (!slug) {
    add({ ...base, ranAt: null, durationMs: null, status: "unavailable", summary: "The repository has no GitHub remote, so CI has not run." });
    return;
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${slug}/actions/runs?per_page=1`, { headers: { Accept: "application/vnd.github+json" } });
    const run = res.ok ? (await res.json()).workflow_runs?.[0] : null;
    if (!run) {
      add({ ...base, ranAt: null, durationMs: null, status: "not-run", summary: `No workflow run found for ${slug}.` });
      return;
    }
    const done = run.status === "completed";
    add({
      ...base,
      ranAt: run.run_started_at ?? run.created_at,
      durationMs: done ? Date.parse(run.updated_at) - Date.parse(run.run_started_at ?? run.created_at) : null,
      status: !done ? "not-run" : run.conclusion === "success" ? "passed" : "failed",
      summary: done ? `Latest run on ${run.head_branch} (${run.head_sha.slice(0, 7)}): ${run.conclusion}. Typecheck, lint, unit tests, build and the Playwright suite on Ubuntu.` : `Latest run on ${run.head_branch} (${run.head_sha.slice(0, 7)}) is still ${run.status}.`,
      details: [run.html_url],
    });
  } catch {
    add({ ...base, ranAt: null, durationMs: null, status: "unavailable", summary: "The GitHub API could not be reached to read the latest CI run." });
  }
})();

// Report ---------------------------------------------------------------------------------------
let commit = null;
const g = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8" });
if (g.status === 0) commit = g.stdout.trim();
const perf = readJson(path.join(raw, "perf.json"));
const report = {
  generatedAt: now(),
  commit,
  environment: { node: process.version, platform: `${process.platform} ${process.arch}`, browser: perf?.browser ?? null },
  checks,
};
const outFile = path.join(root, "public", "reports", "quality-report.json");
mkdirSync(path.dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(report, null, 2) + "\n");
console.log(`\nWrote ${path.relative(root, outFile)} (${checks.length} checks).`);
process.exit(checks.some((c) => c.status === "failed") ? 1 : 0);
