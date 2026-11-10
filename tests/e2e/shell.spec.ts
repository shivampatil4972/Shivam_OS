import { expect, test } from "@playwright/test";
import { dockButton, geometry, onlyDesktop, ready, skipBoot, watchErrors, windowEl } from "./helpers";

test.describe("boot screen", () => {
  test("shows briefly, can be skipped and never blocks for long", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Skip intro" })).toBeVisible();
    await page.getByRole("button", { name: "Skip intro" }).click();
    await expect(page.getByRole("button", { name: "Skip intro" })).toBeHidden();
  });

  test("disappears on its own within about two seconds", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".boot")).toBeHidden({ timeout: 3000 });
  });

  test("does not appear again in the same session", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Skip intro" }).click();
    await page.reload();
    await expect(page.locator(".boot")).toBeHidden();
  });

  test("“Don't show again” persists across sessions", async ({ page, context }) => {
    await page.goto("/");
    await page.getByRole("checkbox", { name: "Don't show again" }).check();
    await page.getByRole("button", { name: "Skip intro" }).click();
    const next = await context.newPage();
    await next.goto("/");
    await expect(next.locator(".boot")).toBeHidden();
  });

  test("deep links skip the boot screen entirely", async ({ page }) => {
    await page.goto("/projects/journex");
    await expect(page.locator(".boot")).toHaveCount(0);
  });
});

test.describe("window manager", () => {
  test.beforeEach(async ({ page }, info) => {
    onlyDesktop(info);
    await skipBoot(page);
    await page.goto("/");
    await expect(windowEl(page, "home")).toBeVisible();
    await ready(page);
  });

  test("the Home window opens on the desktop with real content", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Shivam Patil", level: 3 })).toBeVisible();
    await expect(page.getByRole("link", { name: /Download résumé/ })).toBeVisible();
  });

  test("the dock opens apps, updates the URL and marks them as open", async ({ page }) => {
    await dockButton(page, "Skills").click();
    await expect(windowEl(page, "skills")).toBeVisible();
    await expect(page).toHaveURL(/\/skills$/);
    await expect(dockButton(page, "Skills (open)")).toBeVisible();
    await expect(page).toHaveTitle(/Skills/);
  });

  test("closing a window removes it and returns focus to the dock icon", async ({ page }) => {
    const button = dockButton(page, "About");
    await button.click();
    await expect(windowEl(page, "about")).toBeVisible();
    await page.getByRole("button", { name: "Close About" }).click();
    await expect(windowEl(page, "about")).toHaveCount(0);
    await expect(button).toBeFocused();
  });

  test("minimize hides the window and the dock restores it", async ({ page }) => {
    await dockButton(page, "About").click();
    await page.getByRole("button", { name: "Minimize About" }).click();
    await expect(windowEl(page, "about")).toHaveAttribute("data-minimized", "true");
    await expect(windowEl(page, "about").getByRole("heading", { name: "Engineering journey" })).toBeHidden();
    await dockButton(page, /About/).click();
    await expect(windowEl(page, "about")).toHaveAttribute("data-minimized", "false");
    await expect(windowEl(page, "about").getByRole("heading", { name: "Engineering journey" })).toBeVisible();
  });

  test("maximize fills the workspace and restore returns the previous size", async ({ page }) => {
    await dockButton(page, "About").click();
    const win = windowEl(page, "about");
    const before = await geometry(win);
    await page.getByRole("button", { name: "Maximize About" }).click();
    await expect(win).toHaveAttribute("data-maximized", "true");
    const max = await geometry(win);
    expect(max.width).toBeGreaterThan(before.width);
    await page.getByRole("button", { name: "Restore About size" }).click();
    await expect(win).toHaveAttribute("data-maximized", "false");
    const after = await geometry(win);
    expect(Math.round(after.width)).toBe(Math.round(before.width));
  });

  test("double-clicking the title bar maximizes", async ({ page }) => {
    await dockButton(page, "About").click();
    await windowEl(page, "about").getByRole("heading", { name: "About", level: 2 }).dblclick();
    await expect(windowEl(page, "about")).toHaveAttribute("data-maximized", "true");
  });

  test("dragging the title bar moves the window", async ({ page }) => {
    const win = windowEl(page, "home");
    const before = await geometry(win);
    await page.mouse.move(before.x + before.width / 2, before.y + 20);
    await page.mouse.down();
    await page.mouse.move(before.x + before.width / 2 + 120, before.y + 90, { steps: 6 });
    await page.mouse.up();
    const after = await geometry(win);
    expect(after.x - before.x).toBeCloseTo(120, -1);
    expect(after.y - before.y).toBeCloseTo(70, -1);
  });

  test("a window cannot be dragged out of reach", async ({ page }) => {
    const win = windowEl(page, "home");
    const before = await geometry(win);
    const vp = page.viewportSize()!;
    await page.mouse.move(before.x + before.width / 2, before.y + 20);
    await page.mouse.down();
    await page.mouse.move(vp.width - 2, vp.height - 2, { steps: 8 });
    await page.mouse.up();
    const after = await geometry(win);
    expect(after.x).toBeLessThan(vp.width - 60);
    expect(after.y).toBeLessThan(vp.height - 30);
    await page.mouse.move(after.x + 60, after.y + 20);
    await page.mouse.down();
    await page.mouse.move(after.x + 60, -500, { steps: 8 });
    await page.mouse.up();
    const top = await geometry(win);
    expect(top.y).toBeGreaterThanOrEqual(34);
  });

  test("the resize handle changes the window size", async ({ page }) => {
    const win = windowEl(page, "home");
    const before = await geometry(win);
    const handle = page.getByRole("button", { name: /Resize Home/ });
    const h = await geometry(handle);
    await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
    await page.mouse.down();
    await page.mouse.move(h.x - 80, h.y - 60, { steps: 5 });
    await page.mouse.up();
    const after = await geometry(win);
    expect(after.width).toBeLessThan(before.width - 40);
    expect(after.height).toBeLessThan(before.height - 30);
  });

  test("windows can be moved and resized with the keyboard", async ({ page }) => {
    const win = windowEl(page, "home");
    const before = await geometry(win);
    await win.getByRole("heading", { name: "Home", level: 2 }).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    const moved = await geometry(win);
    expect(moved.x).toBeGreaterThan(before.x);
    expect(moved.y).toBeGreaterThan(before.y);
    await page.getByRole("button", { name: /Resize Home/ }).focus();
    await page.keyboard.press("ArrowLeft");
    const resized = await geometry(win);
    expect(resized.width).toBeLessThan(moved.width);
  });

  test("clicking a background window brings it to the front", async ({ page }) => {
    await dockButton(page, "Terminal").click();
    const term = windowEl(page, "terminal");
    await expect(term).toHaveAttribute("data-focused", "true");
    const home = await geometry(windowEl(page, "home"));
    await page.mouse.click(home.x + 12, home.y + home.height - 40);
    await expect(windowEl(page, "home")).toHaveAttribute("data-focused", "true");
    await expect(term).toHaveAttribute("data-focused", "false");
    const z = async (app: string) => Number(await windowEl(page, app).evaluate((el) => (el as HTMLElement).style.zIndex));
    expect(await z("home")).toBeGreaterThan(await z("terminal"));
  });

  test("keyboard shortcuts close, minimize, maximize and snap the focused window", async ({ page }) => {
    await dockButton(page, "About").click();
    const win = windowEl(page, "about");
    await page.keyboard.press("Alt+Shift+KeyF");
    await expect(win).toHaveAttribute("data-maximized", "true");
    await page.keyboard.press("Alt+Shift+KeyF");
    await page.keyboard.press("Alt+Shift+ArrowLeft");
    expect(Math.round((await geometry(win)).x)).toBe(8);
    await page.keyboard.press("Alt+Shift+KeyM");
    await expect(win).toHaveAttribute("data-minimized", "true");
    await page.keyboard.press("Alt+Shift+Digit4");
    await expect(win).toHaveAttribute("data-minimized", "false");
    await page.keyboard.press("Alt+Shift+KeyW");
    await expect(win).toHaveCount(0);
  });

  test("the window overview lists windows and focuses the chosen one", async ({ page }) => {
    await dockButton(page, "About").click();
    await page.keyboard.press("Alt+Shift+KeyO");
    const dialog = page.getByRole("dialog", { name: "Open windows" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /^Home/ }).click();
    await expect(dialog).toBeHidden();
    await expect(windowEl(page, "home")).toHaveAttribute("data-focused", "true");
  });

  test("Escape closes the overview", async ({ page }) => {
    await page.keyboard.press("Alt+Shift+KeyO");
    await expect(page.getByRole("dialog", { name: "Open windows" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Open windows" })).toBeHidden();
  });

  test("the keyboard shortcuts dialog opens and is dismissable", async ({ page }) => {
    await page.keyboard.press("Alt+Shift+Slash");
    await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeHidden();
  });

  test("the desktop context menu can change the wallpaper", async ({ page }) => {
    await page.getByRole("button", { name: "Close Home" }).click();
    await page.mouse.click(700, 500, { button: "right" });
    const menu = page.getByRole("menu", { name: "Desktop" });
    await expect(menu).toBeVisible();
    const before = await page.evaluate(() => document.documentElement.dataset.wallpaper);
    await menu.getByRole("menuitem", { name: "Change wallpaper" }).click();
    await expect(menu).toBeHidden();
    const after = await page.evaluate(() => document.documentElement.dataset.wallpaper);
    expect(after).not.toBe(before);
  });

  test("the menu bar menus work with the keyboard", async ({ page }) => {
    const apps = page.getByRole("button", { name: /^Apps/ });
    await apps.focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("menu", { name: "Apps" });
    await expect(menu).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await expect(menu.getByRole("menuitem", { name: "Projects" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(apps).toBeFocused();
    await apps.click();
    await menu.getByRole("menuitem", { name: "Settings" }).click();
    await expect(windowEl(page, "settings")).toBeVisible();
  });

  test("resizing the browser keeps windows reachable", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 600 });
    const box = await geometry(windowEl(page, "home"));
    expect(box.x).toBeLessThan(900 - 60);
    expect(box.y).toBeLessThan(600 - 30);
    expect(box.y).toBeGreaterThanOrEqual(34);
  });

  test("browser back returns to the previously opened app", async ({ page }) => {
    await dockButton(page, "Skills").click();
    await dockButton(page, "About").click();
    await expect(page).toHaveURL(/\/about$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/skills$/);
    await expect(windowEl(page, "skills")).toHaveAttribute("data-focused", "true");
  });

  test("the activity pill reports real events", async ({ page }) => {
    await dockButton(page, "Skills").click();
    await expect(page.getByRole("status").filter({ hasText: "Skills" }).first()).toBeAttached();
  });
});

test("no route throws or logs a console error", async ({ page }, info) => {
  test.setTimeout(120_000);
  onlyDesktop(info);
  await skipBoot(page);
  const errors = watchErrors(page);
  for (const route of ["/", "/projects", "/projects/journex", "/about", "/skills", "/education", "/experience", "/research", "/ai-lab", "/xray", "/github", "/terminal", "/resume", "/contact", "/settings", "/quality", "/recruiter"]) {
    await page.goto(route, { waitUntil: "load" });
    await page.waitForTimeout(250);
  }
  expect(errors).toEqual([]);
});
