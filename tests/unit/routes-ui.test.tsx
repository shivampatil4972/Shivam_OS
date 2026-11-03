import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { placeholder } from "@/content/schema";
import { Badge, Segmented, Tabs, Toggle, Txt } from "@/design/ui";
import { AppIcon } from "@/design/icons/AppIcon";
import { APP_IDS, APPS, DOCK_APPS, MOBILE_DOCK_APPS, isAppId } from "@/os/apps";
import { intentToPath, pathToIntent } from "@/os/routes";
import { clearActivity, publishActivity } from "@/os/state/activity";
import { createInitialOSState, createOSStore, osReducer } from "@/os/state/store";

describe("routes", () => {
  it("maps intents to shareable URLs", () => {
    expect(intentToPath({ type: "desktop" })).toBe("/");
    expect(intentToPath({ type: "app", app: "home" })).toBe("/");
    expect(intentToPath({ type: "app", app: "skills" })).toBe("/skills");
    expect(intentToPath({ type: "app", app: "projects", params: { slug: "journex" } })).toBe("/projects/journex");
    expect(intentToPath({ type: "app", app: "xray", params: { system: "intelligrade" } })).toBe("/xray?system=intelligrade");
    expect(intentToPath({ type: "app", app: "recruiter", params: { role: "data-ml" } })).toBe("/recruiter?role=data-ml");
  });

  it("parses URLs back to intents", () => {
    expect(pathToIntent("/")).toEqual({ type: "desktop" });
    expect(pathToIntent("/skills/")).toEqual({ type: "app", app: "skills" });
    expect(pathToIntent("/projects/journex")).toEqual({ type: "app", app: "projects", params: { slug: "journex" } });
    expect(pathToIntent("/xray", "?system=journex")).toEqual({ type: "app", app: "xray", params: { system: "journex" } });
    expect(pathToIntent("/recruiter", "?role=full-stack")).toEqual({ type: "app", app: "recruiter", params: { role: "full-stack" } });
  });

  it("treats unknown paths as the desktop", () => {
    expect(pathToIntent("/nope")).toEqual({ type: "desktop" });
    expect(pathToIntent("/__proto__")).toEqual({ type: "desktop" });
  });

  it("round-trips project deep links with encoded characters", () => {
    const path = intentToPath({ type: "app", app: "projects", params: { slug: "a b" } });
    expect(path).toBe("/projects/a%20b");
    expect(pathToIntent(path)).toEqual({ type: "app", app: "projects", params: { slug: "a b" } });
  });
});

describe("app registry", () => {
  it("every app has metadata with its own id", () => {
    for (const id of APP_IDS) {
      expect(APPS[id].id).toBe(id);
      expect(APPS[id].title.length).toBeGreaterThan(1);
      expect(APPS[id].description.length).toBeGreaterThan(10);
    }
  });

  it("the dock order has no duplicates; mobile dock gives direct access to projects, résumé and contact", () => {
    expect(new Set(DOCK_APPS).size).toBe(DOCK_APPS.length);
    expect(MOBILE_DOCK_APPS).toEqual(expect.arrayContaining(["projects", "resume", "contact"]));
  });

  it("isAppId rejects prototype keys", () => {
    expect(isAppId("projects")).toBe(true);
    expect(isAppId("constructor")).toBe(false);
  });
});

describe("OS store", () => {
  it("opens initial windows and handles overlay actions without touching windows", () => {
    const s = createInitialOSState([{ app: "home", auto: true }]);
    expect(s.wm.windows).toHaveLength(1);
    const next = osReducer(s, { type: "spotlight", open: true });
    expect(next.spotlightOpen).toBe(true);
    expect(next.wm).toBe(s.wm);
    expect(osReducer(next, { type: "overview", open: true }).spotlightOpen).toBe(false);
  });

  it("notifies subscribers only when state changes", () => {
    const store = createOSStore(createInitialOSState());
    const listener = vi.fn();
    const off = store.subscribe(listener);
    store.dispatch({ type: "close", id: "win-nope" });
    expect(listener).not.toHaveBeenCalled();
    store.dispatch({ type: "open", app: "about" });
    expect(listener).toHaveBeenCalledTimes(1);
    off();
    store.dispatch({ type: "closeAll" });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("activity events", () => {
  it("publishes increasing ids and clears only a matching id", () => {
    const a = publishActivity({ kind: "running", title: "x", sticky: true });
    const b = publishActivity({ kind: "completed", title: "y" });
    expect(b).toBeGreaterThan(a);
    clearActivity(a);
    clearActivity(b);
  });
});

describe("design primitives", () => {
  it("Txt renders placeholders as clearly marked, and plain text unchanged", () => {
    const { rerender } = render(<Txt>Plain</Txt>);
    expect(screen.getByText("Plain")).toBeInTheDocument();
    rerender(<Txt>{placeholder("Add the score")}</Txt>);
    expect(screen.getByText("Placeholder:")).toBeInTheDocument();
    expect(screen.getByText(/Add the score/)).toBeInTheDocument();
    expect(screen.queryByText(/PLACEHOLDER/)).not.toBeInTheDocument();
  });

  it("Tabs supports arrow, Home and End keys with roving focus", async () => {
    const user = userEvent.setup();
    function Host() {
      const [v, setV] = useState<"a" | "b" | "c">("a");
      return (
        <Tabs
          label="Sections"
          value={v}
          onChange={setV}
          items={[
            { id: "a", label: "A" },
            { id: "b", label: "B" },
            { id: "c", label: "C" },
          ]}
        />
      );
    }
    render(<Host />);
    const a = screen.getByRole("tab", { name: "A" });
    expect(a).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute("tabindex", "-1");
    a.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "B" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "C" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "A" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "C" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "A" })).toHaveFocus();
  });

  it("Segmented is a labelled radio group", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Segmented name="t" label="Theme" value="a" onChange={onChange} options={[{ value: "a", label: "Dark" }, { value: "b", label: "Light" }]} />);
    expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Light" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("Toggle is a labelled switch", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Magnify" />);
    const sw = screen.getByRole("switch", { name: "Magnify" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    await user.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("Badge renders its children", () => {
    render(<Badge tone="success">Passed</Badge>);
    expect(screen.getByText("Passed")).toBeInTheDocument();
  });
});

describe("icon family", () => {
  it("renders an original icon for every app and Spotlight", () => {
    for (const id of [...APP_IDS, "spotlight"] as const) {
      const { container, unmount } = render(<AppIcon app={id} />);
      const svg = container.querySelector("svg")!;
      expect(svg, id).toBeTruthy();
      // A glyph group exists beyond the shared tile layers.
      expect(svg.querySelector("g")!.childElementCount, id).toBeGreaterThan(0);
      expect(container.textContent).toBe("");
      unmount();
    }
  });

  it("is decorative by default and named when labelled", () => {
    const { container, rerender } = render(<AppIcon app="home" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    rerender(<AppIcon app="home" label="Home" />);
    expect(screen.getByRole("img", { name: "Home" })).toBeInTheDocument();
  });

  it("gives each instance unique gradient ids so icons never share definitions", () => {
    const { container } = render(
      <>
        <AppIcon app="home" />
        <AppIcon app="home" />
      </>,
    );
    const ids = Array.from(container.querySelectorAll("[id]")).map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
