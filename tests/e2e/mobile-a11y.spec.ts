import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expectNoHorizontalOverflow, onlyMobile, skipBoot, windowEl } from "./helpers";

const ROUTES = ["/", "/projects", "/projects/journex", "/ask", "/about", "/skills", "/education", "/experience", "/research", "/ai-lab", "/xray", "/github", "/terminal", "/resume", "/contact", "/settings", "/quality", "/recruiter"];

test.describe("mobile experience", () => {
  test.beforeEach(async ({ page }, info) => {
    onlyMobile(info);
    await skipBoot(page);
  });

  test("the home screen is a launcher, not a shrunken desktop", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Home screen" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Shivam Patil", exact: true })).toBeVisible();
    await expect(page.getByRole("list", { name: "Apps" }).getByRole("button")).toHaveCount(16);
    await expect(page.getByRole("toolbar", { name: "Applications" })).toBeHidden();
    await expect(page.locator('[data-window][data-app="home"]')).toBeHidden();
  });

  test("direct access to projects, résumé and contact from the dock", async ({ page }) => {
    await page.goto("/");
    const dock = page.getByRole("navigation", { name: "Quick dock" });
    for (const name of ["Projects", "Résumé", "Contact", "Search"]) await expect(dock.getByRole("button", { name })).toBeVisible();
  });

  test("apps open full-screen with clear back navigation", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("list", { name: "Apps" }).getByRole("button", { name: "About" }).click();
    const win = windowEl(page, "about");
    await expect(win).toBeVisible();
    const box = await win.boundingBox();
    const vp = page.viewportSize()!;
    expect(box!.width).toBe(vp.width);
    expect(box!.height).toBeGreaterThan(vp.height - 60);
    await expect(page).toHaveURL(/\/about$/);
    await page.getByRole("button", { name: "Home", exact: true }).click();
    await expect(page.getByRole("region", { name: "Home screen" })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test("the phone back gesture returns to the home screen", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("list", { name: "Apps" }).getByRole("button", { name: "Skills" }).click();
    await expect(windowEl(page, "skills")).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(windowEl(page, "skills")).toHaveAttribute("data-minimized", "true");
  });

  test("only one app shows at a time", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Quick dock" }).getByRole("button", { name: "Projects" }).click();
    await page.getByRole("button", { name: "Home", exact: true }).click();
    await page.getByRole("navigation", { name: "Quick dock" }).getByRole("button", { name: "Contact" }).click();
    await expect(windowEl(page, "contact")).toBeVisible();
    await expect(windowEl(page, "projects")).toBeHidden();
  });

  test("touch targets on the launcher are large enough", async ({ page }) => {
    await page.goto("/");
    const buttons = page.getByRole("list", { name: "Apps" }).getByRole("button");
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const b = await buttons.nth(i).boundingBox();
      expect(b!.height).toBeGreaterThanOrEqual(44);
      expect(b!.width).toBeGreaterThanOrEqual(44);
    }
  });

  for (const route of ROUTES) {
    test(`no horizontal overflow on ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      await expectNoHorizontalOverflow(page);
    });
  }

  test("a case study scrolls and its long tables stay inside the screen", async ({ page }) => {
    await page.goto("/projects/journex");
    await expect(page.locator("html")).toHaveAttribute("data-os-ready", "true");
    await page.getByRole("heading", { name: "Alternatives and trade-offs" }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { name: "Alternatives and trade-offs" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("accessibility", () => {
  const seen: Array<{ project: string; route: string; theme: string; violations: Array<{ id: string; impact: string | null | undefined; nodes: number; targets: string[] }>; passes: number }> = [];

  for (const theme of ["dark", "light"] as const) {
    for (const route of ROUTES) {
      test(`axe: ${route} (${theme})`, async ({ page }, info) => {
        test.setTimeout(60_000);
        await skipBoot(page);
        await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
        await page.goto(route, { waitUntil: "networkidle" });
        await page.waitForTimeout(route === "/ai-lab" ? 1200 : 300);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        seen.push({ project: info.project.name, route, theme, violations: results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 12).map((n) => n.target.join(" ")) })), passes: results.passes.length });
        const dir = path.join(process.cwd(), "reports", "raw", "a11y");
        mkdirSync(dir, { recursive: true });
        writeFileSync(path.join(dir, `${info.project.name}-${theme}-${route.replace(/\W+/g, "_") || "root"}.json`), JSON.stringify(seen[seen.length - 1]));
        const summary = serious.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")} — ${v.nodes[0]?.failureSummary?.split("\n")[1]?.trim() ?? ""}`);
        expect(summary).toEqual([]);
      });
    }
  }

  test("all headings on a case study are in a sensible order", async ({ page }) => {
    await skipBoot(page);
    await page.goto("/projects/journex");
    const levels = await page.locator("[data-app='projects'] h2, [data-app='projects'] h3, [data-app='projects'] h4").evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
    expect(levels[0]).toBe(2);
    for (let i = 1; i < levels.length; i++) expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
  });

  test("the page has exactly one h1 and a skip link", async ({ page }) => {
    await skipBoot(page);
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeAttached();
  });

  test("focus is visible on interactive controls", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop");
    await skipBoot(page);
    await page.goto("/about");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      return getComputedStyle(el).outlineStyle;
    });
    expect(outline).not.toBe("none");
  });
});

test.describe("SEO and security", () => {
  test("security headers are present", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("default-src 'self'");
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("the résumé may be framed by this origin only", async ({ request }) => {
    const res = await request.get("/resume/Shivam_Patil_Resume.pdf");
    expect(res.headers()["x-frame-options"]).toBe("SAMEORIGIN");
  });

  test("sitemap and robots are served and consistent", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/projects/journex");
    expect(sitemap).toContain("/ai-lab");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Sitemap:");
    expect(robots).toContain("Disallow: /api/");
  });

  test("pages have titles, descriptions, canonicals and social metadata", async ({ page }) => {
    await skipBoot(page);
    await page.goto("/projects/intelligrade-ai");
    await expect(page).toHaveTitle(/IntelliGrade AI/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /teacher approves/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/projects\/intelligrade-ai$/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /IntelliGrade/);
  });

  test("the root page declares a Person in JSON-LD and an icon", async ({ page }) => {
    await skipBoot(page);
    await page.goto("/");
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(ld!)).toMatchObject({ "@type": "Person", name: "Shivam Ashok Patil" });
    await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute("href", /icon/);
  });

  test("the social image and manifest are served", async ({ request }) => {
    const og = await request.get("/opengraph-image");
    expect(og.status()).toBe(200);
    expect(og.headers()["content-type"]).toContain("image/png");
    const m = await request.get("/manifest.webmanifest");
    expect((await m.json()).short_name).toBe("SHIVAM.OS");
  });

  test("the contact API refuses cross-origin and invalid requests", async ({ request }) => {
    const bad = await request.post("/api/contact", { data: { name: "x" }, headers: { origin: "https://evil.example" } });
    expect(bad.status()).toBe(403);
    const invalid = await request.post("/api/contact", { data: { name: "x" } });
    expect(invalid.status()).toBe(422);
  });

  test("no secret is exposed in the client bundle", async ({ page }) => {
    await skipBoot(page);
    const bodies: string[] = [];
    page.on("response", async (res) => {
      if (res.url().includes("/_next/static/") && res.url().endsWith(".js")) bodies.push(await res.text().catch(() => ""));
    });
    await page.goto("/contact", { waitUntil: "networkidle" });
    const all = bodies.join("\n");
    expect(all).not.toContain("RESEND_API_KEY");
    expect(all).not.toContain("FORMSPREE_FORM_ID");
  });

  test("the app works from a server-rendered page (content in the initial HTML)", async ({ request }) => {
    const html = await (await request.get("/projects/journex")).text();
    expect(html).toContain("Problem and motivation");
    expect(html).toContain("completed rides per 100 searches");
  });

  test("server-rendered windows are visible before JavaScript runs", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/projects/journex");
    const section = page.locator('[data-window][data-app="projects"] section').first();
    await expect(section).toBeVisible();
    expect(Number(await section.evaluate((el) => getComputedStyle(el).opacity))).toBe(1);
    await expect(page.getByRole("heading", { name: "JOURNEX (VAYORA)", level: 3 })).toBeVisible();
    await ctx.close();
  });
});
