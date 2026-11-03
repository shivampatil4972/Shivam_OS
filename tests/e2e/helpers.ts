import { expect, type Locator, type Page, type TestInfo, test } from "@playwright/test";

/** Pretend the intro has already been seen in this session. */
export async function skipBoot(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("shivam-os:booted", "1");
    } catch {
      // ignore
    }
  });
}

/** Waits until the OS has hydrated (global shortcuts and handlers are live). */
export async function ready(page: Page) {
  await expect(page.locator("html")).toHaveAttribute("data-os-ready", "true");
}

export const onlyDesktop = (info: TestInfo) => test.skip(info.project.name !== "desktop", "Desktop window-manager behaviour");
export const onlyMobile = (info: TestInfo) => test.skip(info.project.name !== "mobile", "Mobile behaviour");

export function windowEl(page: Page, app: string): Locator {
  return page.locator(`[data-window][data-app="${app}"]`);
}

export function dockButton(page: Page, name: string | RegExp): Locator {
  return page.getByRole("toolbar", { name: "Applications" }).getByRole("button", { name });
}

export async function geometry(el: Locator) {
  const box = await el.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

/** Fails if the page can scroll horizontally. */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

/** Collects uncaught errors and console errors for the page's lifetime. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|Content Security Policy/.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  return errors;
}
