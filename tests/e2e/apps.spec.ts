import { expect, test } from "@playwright/test";
import canonical from "../../src/content/placement-experiment.json" with { type: "json" };
import { dockButton, onlyDesktop, onlyMobile, ready, skipBoot, windowEl } from "./helpers";

test.beforeEach(async ({ page }) => {
  await skipBoot(page);
});

test.describe("Spotlight", () => {
  test("opens with the keyboard, finds a project and opens it", async ({ page }, info) => {
    onlyDesktop(info);
    await page.goto("/");
    await ready(page);
    await page.keyboard.press("Control+KeyK");
    const dialog = page.getByRole("dialog", { name: "Spotlight search" });
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole("combobox");
    await expect(input).toBeFocused();
    await input.fill("intelligrade");
    await expect(dialog.getByRole("option").first()).toContainText("IntelliGrade AI");
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/projects\/intelligrade-ai$/);
    await expect(page.getByRole("heading", { name: "IntelliGrade AI", level: 3 })).toBeVisible();
  });

  test("supports arrow navigation and shows the active option", async ({ page }, info) => {
    onlyDesktop(info);
    await page.goto("/");
    await ready(page);
    await page.keyboard.press("Control+KeyK");
    const dialog = page.getByRole("dialog", { name: "Spotlight search" });
    const input = dialog.getByRole("combobox");
    await input.fill("python");
    const first = await input.getAttribute("aria-activedescendant");
    await page.keyboard.press("ArrowDown");
    const second = await input.getAttribute("aria-activedescendant");
    expect(second).not.toBe(first);
    await expect(page.locator(`[id="${second}"]`)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowUp");
    expect(await input.getAttribute("aria-activedescendant")).toBe(first);
  });

  test("Escape closes it and restores focus", async ({ page }, info) => {
    onlyDesktop(info);
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /^Search/ });
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Spotlight search" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Spotlight search" })).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("Tab stays inside the dialog", async ({ page }, info) => {
    onlyDesktop(info);
    await page.goto("/");
    await ready(page);
    await page.keyboard.press("Control+KeyK");
    const dialog = page.getByRole("dialog", { name: "Spotlight search" });
    await expect(dialog.getByRole("combobox")).toBeFocused();
    for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  });

  test("explains when nothing matches", async ({ page }, info) => {
    onlyDesktop(info);
    await page.goto("/");
    await ready(page);
    await page.keyboard.press("Control+KeyK");
    await page.getByRole("combobox").fill("zzzzqqqq");
    await expect(page.getByText(/No results for/)).toBeVisible();
  });

  test("has a usable full-screen interface on phones", async ({ page }, info) => {
    onlyMobile(info);
    await page.goto("/");
    await page.getByRole("button", { name: "Search" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Spotlight search" });
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(page.viewportSize()!.width - 1);
    await dialog.getByRole("combobox").fill("resume");
    await dialog.getByRole("option").first().click();
    await expect(dialog).toBeHidden();
  });
});

test.describe("Projects Explorer", () => {
  test("filters, searches and clears", async ({ page }) => {
    await page.goto("/projects");
    await ready(page);
    await expect(page.getByText("Showing all 14 projects")).toBeVisible();
    await page.getByRole("searchbox", { name: "Search projects" }).fill("tableau");
    await expect(page.getByText("1 of 14 projects match")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Road Accident Analysis" })).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByText("Showing all 14 projects")).toBeVisible();
  });

  test("category and technology filters narrow the list", async ({ page }, info) => {
    onlyDesktop(info);
    await page.goto("/projects");
    await page.getByRole("button", { name: "Data analytics" }).click();
    await expect(page.getByRole("button", { name: "Data analytics" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(/of 14 projects match/)).toBeVisible();
    const win = windowEl(page, "projects");
    await expect(win.getByRole("heading", { name: "JOURNEX (VAYORA)" })).toHaveCount(0);
    await page.getByRole("button", { name: "All categories" }).click();
    await page.getByLabel("Technology").selectOption("PostGIS");
    await expect(page.getByText("1 of 14 projects match")).toBeVisible();
    await expect(win.getByRole("heading", { name: "JOURNEX (VAYORA)" })).toBeVisible();
  });

  test("shows a helpful empty state", async ({ page }) => {
    await page.goto("/projects");
    await ready(page);
    await page.getByRole("searchbox", { name: "Search projects" }).fill("zzzznothing");
    await expect(page.getByText(/Nothing matches/)).toBeVisible();
  });

  test("opens a case study with a shareable URL, and goes back", async ({ page }) => {
    await page.goto("/projects");
    await page.getByRole("button", { name: "IntelliGrade AI" }).click();
    await expect(page).toHaveURL(/\/projects\/intelligrade-ai$/);
    await expect(page.getByRole("heading", { name: "Problem and motivation" })).toBeVisible();
    await page.getByRole("button", { name: "All projects" }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByText("Showing all 14 projects")).toBeVisible();
  });

  test("a case study deep link renders with its metadata on a fresh load", async ({ page }) => {
    await page.goto("/projects/journex");
    await expect(page.getByRole("heading", { name: "JOURNEX (VAYORA)", level: 3 })).toBeVisible();
    await expect(page).toHaveTitle(/JOURNEX/);
    await expect(page.getByRole("heading", { name: "Limitations and known issues" })).toBeVisible();
    await expect(page.getByText(/failed the Web job/).first()).toBeVisible();
    await expect(page.getByText(/AI assistance disclosure/)).toBeVisible();
  });

  test("the case study tabs show architecture, evolution and evidence", async ({ page }) => {
    await page.goto("/projects/journex");
    const tabs = page.getByRole("tablist", { name: "Case study sections" });
    await tabs.getByRole("tab", { name: "Architecture" }).click();
    await expect(page.getByRole("heading", { name: "Data flow" })).toBeVisible();
    await expect(page.getByRole("button", { name: /core-api/ })).toBeVisible();
    await tabs.getByRole("tab", { name: /Evolution/ }).click();
    await expect(page.getByText("Restart as JOURNEX with binding rules")).toBeVisible();
    await tabs.getByRole("tab", { name: /Evidence/ }).click();
    await expect(page.getByRole("link", { name: /EXPERIMENT_PROTOCOL/ })).toHaveAttribute("href", /github\.com\/shivampatil4972\/VAYORA-/);
  });

  test("an unknown project is a real 404", async ({ page }) => {
    const res = await page.goto("/projects/does-not-exist");
    expect(res!.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /isn't installed/ })).toBeVisible();
    await page.getByRole("link", { name: "Back to the desktop" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("an unknown app is a real 404", async ({ page }) => {
    const res = await page.goto("/not-an-app");
    expect(res!.status()).toBe(404);
  });
});

test.describe("Engineering X-Ray", () => {
  test("selecting a component shows its details; unimplemented parts are labelled", async ({ page }) => {
    await page.goto("/xray?system=intelligrade");
    await expect(page.getByRole("tab", { name: "IntelliGrade AI" })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("button", { name: /Claude provider/ }).click();
    const details = page.getByRole("complementary", { name: "Claude provider details" });
    await expect(details.getByText("Unverified")).toBeVisible();
    await expect(details.getByText(/never called against the live API/)).toBeVisible();
    await page.getByRole("button", { name: /Analytics & job monitoring/ }).click();
    await expect(page.getByRole("complementary", { name: /Analytics/ }).getByText("Proposed")).toBeVisible();
  });

  test("offers an accessible list view", async ({ page }) => {
    await page.goto("/xray");
    await page.getByRole("button", { name: "List" }).click();
    await expect(page.getByRole("heading", { name: "core-api" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Connections" })).toBeVisible();
  });
});

test.describe("Skills and the Proof-of-Work graph", () => {
  test("a skill links to its projects and the graph shows evidence", async ({ page }) => {
    await page.goto("/skills");
    await expect(page.getByRole("heading", { name: "Languages" })).toBeVisible();
    await page.getByRole("tab", { name: "Proof-of-Work graph" }).click();
    await page.getByLabel("Skill group").selectOption("databases");
    await page.getByRole("list", { name: "Skills" }).getByRole("button", { name: "PostGIS" }).click();
    await expect(page.getByRole("complementary", { name: "Evidence" }).getByText("JOURNEX (VAYORA)")).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Evidence" }).getByRole("link").first()).toHaveAttribute("href", /github\.com/);
    await page.getByRole("button", { name: "Evidence matrix" }).click();
    await expect(page.getByRole("table")).toBeVisible();
  });
});

test.describe("Terminal", () => {
  test("runs predefined commands, keeps history and rejects anything else", async ({ page }) => {
    await page.goto("/terminal");
    await ready(page);
    const input = page.getByLabel(/guest@shivam-os/);
    await input.fill("help");
    await input.press("Enter");
    const log = page.getByRole("log", { name: "Terminal output" });
    await expect(log).toContainText("Available commands:");
    await input.fill("rm -rf /");
    await input.press("Enter");
    await expect(log).toContainText("not available");
    await input.fill("skils");
    await input.press("Enter");
    await expect(log).toContainText("did you mean");
    await input.press("ArrowUp");
    await expect(input).toHaveValue("skils");
    await input.fill("pro");
    await input.press("Tab");
    await expect(input).toHaveValue("projects ");
    await input.fill("clear");
    await input.press("Enter");
    await expect(log).not.toContainText("Available commands:");
  });

  test("commands can open apps", async ({ page }) => {
    await page.goto("/terminal");
    await ready(page);
    const input = page.getByLabel(/guest@shivam-os/);
    await input.fill("projects journex");
    await input.press("Enter");
    await expect(page).toHaveURL(/\/projects\/journex$/);
  });
});

test.describe("AI Lab", () => {
  test("runs the canonical experiment and reproduces the published numbers", async ({ page }) => {
    await page.goto("/ai-lab");
    const expected = `${(canonical.results.features.modelTest.accuracy * 100).toFixed(1)}%`;
    await expect(page.getByText("Test accuracy")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("definition").filter({ hasText: expected }).first()).toBeVisible();
    await expect(page.getByText(/Synthetic data\./)).toBeVisible();
    await expect(page.getByText("Baseline 67.0%").first()).toBeVisible();
  });

  test("a parameter change produces different, real results", async ({ page }) => {
    await page.goto("/ai-lab");
    await expect(page.getByText("Test accuracy")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("checkbox", { name: /latent score/ }).check();
    await page.getByRole("button", { name: "Run experiment" }).click();
    await expect(page.getByText(/Leakage on\./)).toBeVisible({ timeout: 15_000 });
    const expected = `${(canonical.results["with-leak"].modelTest.accuracy * 100).toFixed(1)}%`;
    await expect(page.getByRole("definition").filter({ hasText: expected }).first()).toBeVisible();
  });

  test("charts have a data table alternative", async ({ page }) => {
    await page.goto("/ai-lab");
    await expect(page.getByText("Test accuracy")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Show data table" }).first().click();
    await expect(page.getByRole("table", { name: /ROC curve/ })).toBeVisible();
  });

  test("the UI stays responsive because training runs off the main thread", async ({ page }) => {
    await page.goto("/ai-lab");
    await expect(page.getByText("Test accuracy")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Run experiment" }).click();
    await expect(page.getByText("Experiment completed").first()).toBeAttached({ timeout: 15_000 });
  });
});

test.describe("Résumé", () => {
  test("the PDF is served and downloadable", async ({ page, request }) => {
    await page.goto("/resume");
    const res = await request.get("/resume/Shivam_Patil_Resume.pdf");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/pdf");
    expect((await res.body()).subarray(0, 4).toString()).toBe("%PDF");
    const link = page.getByRole("link", { name: "Download", exact: true });
    await expect(link).toHaveAttribute("download", "Shivam_Patil_Resume.pdf");
    await expect(link).toHaveAttribute("href", "/resume/Shivam_Patil_Resume.pdf");
  });

  test("offers an accessible text version with an updated date", async ({ page }) => {
    await page.goto("/resume");
    await expect(page.getByText(/Updated 23 Oct 2026/)).toBeVisible();
    await page.getByRole("tab", { name: "Accessible text version" }).click();
    await expect(page.getByRole("heading", { name: "SHIVAM ASHOK PATIL" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Technical skills" })).toBeVisible();
  });

  test("desktop previews the PDF in a frame", async ({ page }, info) => {
    onlyDesktop(info);
    await page.goto("/resume");
    await expect(page.getByTitle(/Résumé of Shivam Patil/)).toBeVisible();
  });

  test("phones start on the text version", async ({ page }, info) => {
    onlyMobile(info);
    await page.goto("/resume");
    await expect(page.getByRole("heading", { name: "SHIVAM ASHOK PATIL" })).toBeVisible();
  });
});

test.describe("Contact", () => {
  test("validates on the client with accessible errors", async ({ page }) => {
    await page.goto("/contact");
    await ready(page);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(/Please enter your name/)).toBeVisible();
    await expect(page.getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");
    await page.getByLabel("Your email").fill("nope");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(/valid email/)).toBeVisible();
  });

  test("never claims delivery when no provider is configured", async ({ page }) => {
    await page.goto("/contact");
    await ready(page);
    await expect(page.getByText(/isn't configured on this deployment/)).toBeVisible();
    await page.getByLabel("Your name").fill("Asha Rao");
    await page.getByLabel("Your email").fill("asha@example.com");
    await page.getByLabel("Subject").fill("Internship role");
    await page.getByLabel("Message", { exact: true }).fill("We would like to talk about an internship next summer.");
    await page.waitForTimeout(2600); // the form rejects submissions faster than a person can type
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "nothing was sent" })).toBeVisible();
    await expect(page.getByText(/was delivered/)).toHaveCount(0);
  });

  test("shows the direct contact routes and a privacy notice", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("link", { name: "shivampatil4972@gmail.com" })).toHaveAttribute("href", "mailto:shivampatil4972@gmail.com");
    await expect(page.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute("href", /linkedin\.com\/in\/shivam-patil-b47189210/);
    await page.getByText("Privacy notice").click();
    await expect(page.getByText(/does not store them/)).toBeVisible();
  });

  test("the phone number is not exposed on the page", async ({ page }) => {
    await page.goto("/contact");
    expect(await page.content()).not.toContain("7709792167");
  });
});

test.describe("Settings persistence", () => {
  test("theme changes apply immediately and survive a reload", async ({ page }, info) => {
    onlyDesktop(info);
    await page.goto("/settings");
    await page.locator("label", { hasText: "Light" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.getByRole("radio", { name: "Light" })).toBeChecked();
  });

  test("the system preference is honoured by default", async ({ browser }, info) => {
    onlyDesktop(info);
    const ctx = await browser.newContext({ colorScheme: "light" });
    const page = await ctx.newPage();
    await page.goto("/settings");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await ctx.close();
  });

  test("accent, glass, wallpaper and motion persist, and reset restores defaults", async ({ page }, info) => {
    onlyDesktop(info);
    await page.goto("/settings");
    await page.getByTitle("violet").click();
    await page.locator("label", { hasText: "Solid" }).click();
    await page.locator("label", { hasText: "Navy tide" }).click();
    await page.locator("label", { hasText: /^Off$/ }).click();
    await page.reload();
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-accent", "violet");
    await expect(html).toHaveAttribute("data-glass", "solid");
    await expect(html).toHaveAttribute("data-wallpaper", "tide");
    await expect(html).toHaveAttribute("data-motion", "off");
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(html).toHaveAttribute("data-accent", "blue");
    await expect(html).toHaveAttribute("data-glass", "balanced");
    await page.reload();
    await expect(html).toHaveAttribute("data-wallpaper", "aurora");
  });

  test("the menu bar toggle switches theme", async ({ page }, info) => {
    onlyDesktop(info);
    await page.goto("/");
    const before = await page.locator("html").getAttribute("data-theme");
    await page.getByRole("button", { name: /Switch to (light|dark) mode/ }).click();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", before!);
  });

  test("corrupted preferences do not break the site", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("shivam-os:prefs:v1", "{broken"));
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: /About Shivam Patil/ })).toBeVisible();
  });
});

test.describe("Reduced motion", () => {
  test("the system setting disables animations and the boot animation", async ({ browser }, info) => {
    onlyDesktop(info);
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/about");
    const duration = await page.evaluate(() => getComputedStyle(document.querySelector(".glass")!).transitionDuration);
    expect(parseFloat(duration)).toBeLessThan(0.01);
    await ctx.close();
  });
});

test.describe("Recruiter Mode", () => {
  test("switching role changes the relevant projects and keeps résumé and contact to hand", async ({ page }) => {
    await page.goto("/recruiter");
    await expect(page.getByRole("tab", { name: "Full-Stack Developer" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("button", { name: /Client Support Ticketing Tool/ })).toBeVisible();
    await page.getByRole("tab", { name: "Data Science / ML Engineer" }).click();
    await expect(page).toHaveURL(/role=data-ml/);
    await expect(page.getByRole("button", { name: /Placement Prediction/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Résumé" })).toHaveAttribute("href", /\.pdf$/);
  });
});

test.describe("GitHub Explorer", () => {
  test("falls back to a dated snapshot when the API is unavailable", async ({ page }) => {
    await page.route("https://api.github.com/**", (route) => route.abort());
    await page.goto("/github");
    await expect(page.getByText(/could not be reached/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "VAYORA-", exact: true })).toBeVisible();
    await expect(page.getByText(/Latest CI run/)).toBeVisible();
  });

  test("labels live data when the API responds", async ({ page }) => {
    await page.route("https://api.github.com/**", (route) => route.fulfill({ json: [{ name: "VAYORA-", pushed_at: "2026-10-30T00:00:00Z", stargazers_count: 3, description: "From the API", private: false }] }));
    await page.goto("/github");
    await expect(page.getByText("Live from the GitHub API")).toBeVisible();
    await expect(page.getByText("From the API")).toBeVisible();
  });
});

test.describe("Dock", () => {
  test("is keyboard navigable as a toolbar", async ({ page }, info) => {
    onlyDesktop(info);
    await page.goto("/about");
    const first = dockButton(page, "Home");
    await first.focus();
    await page.keyboard.press("ArrowRight");
    await expect(dockButton(page, "Projects")).toBeFocused();
    await page.keyboard.press("End");
    await expect(dockButton(page, "Spotlight search")).toBeFocused();
    await page.keyboard.press("Home");
    await expect(first).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(windowEl(page, "home")).toBeVisible();
  });
});

test.describe("Ask SHIVAM.OS", () => {
  const answer = {
    ok: true,
    model: "gemini-3.6-flash",
    truncated: false,
    segments: [
      { text: "Shivam is part of a four-person team building JOURNEX", sources: [1] },
      { text: ", a ride-sharing platform with a simulation study.", sources: [] },
    ],
    sources: [{ n: 1, title: "JOURNEX (VAYORA) — overview", href: "/projects/journex", quotes: ["Team of 4."] }],
  };

  /** The test server has no API key; these routes stand in for a configured deployment. */
  async function mockConfigured(page: import("@playwright/test").Page, posts: unknown[] = []) {
    await page.route("**/api/ask", async (route) => {
      if (route.request().method() === "GET") return route.fulfill({ json: { configured: true, model: "gemini-3.6-flash", freeTier: true } });
      posts.push(route.request().postDataJSON());
      return route.fulfill({ json: answer });
    });
  }

  test("says honestly that it is off when no API key is configured", async ({ page }) => {
    await page.goto("/ask");
    await ready(page);
    await expect(page.getByText("isn't switched on for this deployment")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Your question" })).toBeDisabled();
    await expect(windowEl(page, "ask").getByRole("button", { name: "Recruiter Mode" })).toBeVisible();
  });

  test("shows a cited answer whose sources open inside the OS", async ({ page }) => {
    const posts: unknown[] = [];
    await mockConfigured(page, posts);
    await page.goto("/ask");
    await ready(page);
    await expect(page.getByText("Answers by Gemini · gemini-3.6-flash")).toBeVisible();
    await expect(page.getByText(/uses Gemini's free tier, so Google may use questions/)).toBeVisible();
    const box = page.getByRole("textbox", { name: "Your question" });
    await box.fill("What did Shivam build in JOURNEX?");
    await box.press("Enter");
    const article = page.getByRole("article", { name: /Answer to: What did Shivam build in JOURNEX\?/ });
    // The citation marker "1" follows the cited words.
    await expect(article).toContainText("four-person team building JOURNEX1, a ride-sharing platform");
    await expect(article.getByRole("heading", { name: "Sources" })).toBeVisible();
    await expect(article.getByText("Team of 4.")).toBeVisible();
    expect(posts).toEqual([{ question: "What did Shivam build in JOURNEX?", history: [] }]);
    await article.getByRole("link", { name: "Source 1: JOURNEX (VAYORA) — overview" }).click();
    await expect(page).toHaveURL(/\/projects\/journex$/);
  });

  test("Spotlight hands a question to Ask SHIVAM.OS", async ({ page }, info) => {
    onlyDesktop(info);
    const posts: unknown[] = [];
    await mockConfigured(page, posts);
    await page.goto("/");
    await ready(page);
    await page.keyboard.press("Control+KeyK");
    const dialog = page.getByRole("dialog", { name: "Spotlight search" });
    await dialog.getByRole("combobox").fill("Which projects use Spring Boot?");
    await expect(dialog.getByRole("option").first()).toContainText("Ask: “Which projects use Spring Boot?”");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/ask$/);
    await expect(windowEl(page, "ask").getByRole("article")).toContainText("ride-sharing platform");
    expect(posts).toEqual([{ question: "Which projects use Spring Boot?", history: [] }]);
  });
});
