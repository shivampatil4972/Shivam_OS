import { beforeEach, describe, expect, it } from "vitest";
import { getPrefs, initPrefs, resetPrefs, setPrefs } from "@/os/state/prefs";
import { DEFAULT_PREFS, PREFS_BOOT_SCRIPT, PREFS_KEY, loadPrefs, parsePrefs, resolveTheme } from "@/os/state/prefsCore";

describe("preference parsing", () => {
  it("returns defaults for missing or non-object input", () => {
    expect(parsePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(parsePrefs("nope")).toEqual(DEFAULT_PREFS);
  });

  it("keeps valid values and replaces invalid ones individually", () => {
    const p = parsePrefs({ theme: "light", accent: "not-a-colour", glass: 42, wallpaper: "tide", dockMagnify: "yes" });
    expect(p.theme).toBe("light");
    expect(p.wallpaper).toBe("tide");
    expect(p.accent).toBe(DEFAULT_PREFS.accent);
    expect(p.glass).toBe(DEFAULT_PREFS.glass);
    expect(p.dockMagnify).toBe(DEFAULT_PREFS.dockMagnify);
  });

  it("ignores unknown keys", () => {
    expect(parsePrefs({ evil: true })).toEqual(DEFAULT_PREFS);
  });

  it("resolves the system theme", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});

describe("persistence", () => {
  beforeEach(() => resetPrefs());

  it("loads defaults when storage is empty", () => {
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });

  it("survives corrupted storage", () => {
    window.localStorage.setItem(PREFS_KEY, "{not json");
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });

  it("persists changes and applies them to <html>", () => {
    setPrefs({ theme: "light", accent: "violet", wallpaper: "graphite", glass: "solid", motion: "off" });
    const root = document.documentElement;
    expect(root.dataset.theme).toBe("light");
    expect(root.dataset.accent).toBe("violet");
    expect(root.dataset.wallpaper).toBe("graphite");
    expect(root.dataset.glass).toBe("solid");
    expect(root.dataset.motion).toBe("off");
    const saved = JSON.parse(window.localStorage.getItem(PREFS_KEY)!);
    expect(saved.theme).toBe("light");
    expect(loadPrefs().accent).toBe("violet");
  });

  it("a new session restores the saved theme", () => {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ ...DEFAULT_PREFS, theme: "light" }));
    initPrefs();
    expect(loadPrefs().theme).toBe("light");
  });

  it("reset restores defaults and clears storage", () => {
    setPrefs({ theme: "light", accent: "pink" });
    resetPrefs();
    expect(getPrefs()).toEqual(DEFAULT_PREFS);
    expect(window.localStorage.getItem(PREFS_KEY)).toBeNull();
  });

  it("rejects invalid values passed to setPrefs", () => {
    setPrefs({ accent: "chartreuse" as never });
    expect(getPrefs().accent).toBe(DEFAULT_PREFS.accent);
  });
});

describe("pre-paint boot script", () => {
  const runScript = () => new Function(PREFS_BOOT_SCRIPT)();

  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-skip-boot");
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("applies the saved theme before hydration", () => {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ theme: "light", accent: "cyan" }));
    runScript();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.dataset.accent).toBe("cyan");
  });

  it("does not throw on corrupted storage and falls back to valid values", () => {
    window.localStorage.setItem(PREFS_KEY, "%%%");
    expect(runScript).not.toThrow();
    expect(["dark", "light"]).toContain(document.documentElement.dataset.theme);
    expect(document.documentElement.dataset.accent).toBe("blue");
  });

  it("skips the intro when disabled or already seen this session", () => {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ showBoot: false }));
    runScript();
    expect(document.documentElement.dataset.skipBoot).toBe("true");
    document.documentElement.removeAttribute("data-skip-boot");
    window.localStorage.clear();
    runScript();
    expect(document.documentElement.dataset.skipBoot).toBeUndefined();
    window.sessionStorage.setItem("shivam-os:booted", "1");
    runScript();
    expect(document.documentElement.dataset.skipBoot).toBe("true");
  });
});
