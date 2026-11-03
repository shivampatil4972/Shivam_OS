#!/usr/bin/env node
/**
 * Captures the README screenshots from a running build.
 *   npm run build && npm start            # in one terminal
 *   node scripts/readme-screenshots.mjs [--base http://127.0.0.1:3000] [--channel chrome]
 * Writes optimised WebP files to docs/readme/.
 */
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const { chromium } = require("@playwright/test");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "docs", "readme");
mkdirSync(out, { recursive: true });

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const base = arg("--base", "http://127.0.0.1:3000").replace(/\/$/, "");
const channel = arg("--channel", process.env.E2E_CHANNEL || undefined);

const browser = await chromium.launch(channel ? { channel } : {});

async function shot(name, { route, width = 1440, height = 900, scheme = "dark", mobile = false, prepare, element, outWidth = 1600 }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: mobile ? 3 : 2,
    colorScheme: scheme,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: "reduce",
  });
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem("shivam-os:booted", "1");
    } catch {}
  });
  const page = await context.newPage();
  await page.goto(`${base}${route}`, { waitUntil: "load" });
  await page.locator('html[data-os-ready="true"]').waitFor({ state: "attached" });
  await page.waitForTimeout(600);
  if (prepare) await prepare(page);
  await page.waitForTimeout(500);
  const buffer = element ? await page.locator(element).first().screenshot() : await page.screenshot();
  const file = path.join(out, `${name}.webp`);
  const info = await sharp(buffer).resize({ width: outWidth, withoutEnlargement: true }).webp({ quality: 86, effort: 6 }).toFile(file);
  console.log(`${path.relative(root, file)}  ${info.width}x${info.height}  ${Math.round(info.size / 1024)} KB`);
  await context.close();
}

await shot("hero", { route: "/" });
await shot("dock", { route: "/", element: 'nav[aria-label="Dock"]', outWidth: 1400 });
await shot("case-study", { route: "/projects/journex", scheme: "light" });
await shot("ai-lab", { route: "/ai-lab", prepare: (p) => p.getByText("Test accuracy").waitFor({ timeout: 20000 }) });
await shot("xray", { route: "/xray", prepare: (p) => p.getByRole("button", { name: /core-api/ }).click() });
await shot("spotlight", {
  route: "/",
  prepare: async (p) => {
    await p.keyboard.press("Control+KeyK");
    await p.getByRole("combobox").waitFor();
    await p.keyboard.type("placement");
  },
});
await shot("skills-graph", {
  route: "/skills",
  scheme: "light",
  prepare: async (p) => {
    await p.getByRole("tab", { name: "Proof-of-Work graph" }).click();
    await p.getByRole("list", { name: "Skills" }).getByRole("button", { name: "Survival analysis" }).click();
  },
});
await shot("quality", { route: "/quality", prepare: (p) => p.getByText("Report generated").waitFor() });
await shot("research", { route: "/research" });
await shot("mobile-home", { route: "/", width: 390, height: 844, mobile: true, outWidth: 640 });
await shot("mobile-case", { route: "/projects/journex", width: 390, height: 844, mobile: true, outWidth: 640 });
await shot("mobile-ai-lab", { route: "/ai-lab", width: 390, height: 844, mobile: true, outWidth: 640, prepare: (p) => p.getByText("Test accuracy").waitFor({ timeout: 20000 }) });

await browser.close();
