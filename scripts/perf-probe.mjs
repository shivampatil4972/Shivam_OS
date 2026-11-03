#!/usr/bin/env node
/**
 * Lab performance probe (not field data). Loads key pages in Chrome through
 * Playwright, with a mobile profile throttled to a slow-4G network and a 4×
 * slower CPU, and records Largest Contentful Paint, Cumulative Layout Shift,
 * total blocking time (sum of long-task time over 50 ms) and bytes transferred.
 *   node scripts/perf-probe.mjs --base http://127.0.0.1:3100 [--json out.json] [--channel chrome]
 */
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("@playwright/test");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const base = arg("--base", "http://127.0.0.1:3100").replace(/\/$/, "");
const out = arg("--json");
const channel = arg("--channel", process.env.E2E_CHANNEL || undefined);
const ROUTES = ["/", "/projects/journex", "/ai-lab"];

const PROFILES = {
  desktop: { context: { viewport: { width: 1440, height: 900 } }, cpu: 1, network: null },
  mobile: {
    context: { ...devices["Pixel 7"] },
    cpu: 4,
    // Roughly "slow 4G": 150 ms RTT, 1.6 Mbps down, 750 kbps up.
    network: { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 },
  },
};

async function measure(browser, profileName, route) {
  const profile = PROFILES[profileName];
  const context = await browser.newContext(profile.context);
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("shivam-os:booted", "1");
    } catch {}
    window.__perf = { lcp: 0, cls: 0, tbt: 0 };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__perf.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__perf.tbt += Math.max(0, e.duration - 50);
    }).observe({ type: "longtask", buffered: true });
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  if (profile.network) await cdp.send("Network.emulateNetworkConditions", profile.network);
  if (profile.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: profile.cpu });
  let bytes = 0;
  let jsBytes = 0;
  cdp.on("Network.loadingFinished", (e) => {
    bytes += e.encodedDataLength;
  });
  const types = new Map();
  cdp.on("Network.responseReceived", (e) => types.set(e.requestId, e.type));
  cdp.on("Network.loadingFinished", (e) => {
    if (types.get(e.requestId) === "Script") jsBytes += e.encodedDataLength;
  });
  const t0 = Date.now();
  await page.goto(`${base}${route}`, { waitUntil: "load", timeout: 120000 });
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(3000);
  // Interaction ends LCP observation; then read the values.
  await page.mouse.click(5, 5);
  const perf = await page.evaluate(() => window.__perf);
  await context.close();
  return {
    profile: profileName,
    route,
    lcpMs: Math.round(perf.lcp),
    cls: Number(perf.cls.toFixed(3)),
    tbtMs: Math.round(perf.tbt),
    loadMs,
    transferKB: Math.round(bytes / 1024),
    jsKB: Math.round(jsBytes / 1024),
  };
}

const browser = await chromium.launch(channel ? { channel } : {});
const browserVersion = `${channel || "chromium"} ${browser.version()}`;
const results = [];
for (const profile of Object.keys(PROFILES)) {
  for (const route of ROUTES) results.push(await measure(browser, profile, route));
}
await browser.close();

const report = {
  measuredAt: new Date().toISOString(),
  browser: browserVersion,
  method: "Lab measurement with Playwright + Chrome DevTools Protocol on the build machine; mobile = Pixel 7 emulation, 4× CPU slowdown, ~slow 4G network, cache disabled.",
  results,
};
console.table(results);
if (out) await writeFile(out, JSON.stringify(report, null, 2));
