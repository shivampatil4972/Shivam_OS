"use client";

import { Check, RotateCcw } from "lucide-react";
import { Button, Segmented, Toggle } from "@/design/ui";
import { cn } from "@/lib/cn";
import { publishActivity } from "@/os/state/activity";
import { ACCENTS, WALLPAPERS, resetPrefs, setPrefs, usePrefs, type Prefs } from "@/os/state/prefs";
import { switchTheme } from "@/os/themeTransition";
import { AppScroll } from "../shared";

const ACCENT_SWATCH: Record<Prefs["accent"], string> = {
  blue: "#3d82ff",
  violet: "#8b6cff",
  cyan: "#20c4e8",
  green: "#34c57a",
  orange: "#ff9a3c",
  pink: "#ff5d8f",
  graphite: "#9aa6b8",
};

const WALLPAPER_LABEL: Record<Prefs["wallpaper"], string> = { aurora: "Aurora", graphite: "Graphite ridge", tide: "Navy tide", mist: "Silver mist" };

export default function SettingsApp() {
  const prefs = usePrefs();
  return (
    <AppScroll>
      <h3 className="font-display text-2xl font-semibold text-fg">Settings</h3>
      <p className="mt-1 text-[14px] text-muted">Saved in this browser only. Nothing is sent anywhere.</p>

      <Group title="Appearance">
        <Row label="Theme">
          <Segmented
            name="theme"
            label="Theme"
            value={prefs.theme}
            onChange={(theme) => switchTheme(theme, document.activeElement instanceof HTMLElement ? document.activeElement : null)}
            options={[
              { value: "system", label: "Automatic" },
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
            ]}
          />
        </Row>
        <Row label="Glass" hint="Solid is the most readable and the lightest on the GPU.">
          <Segmented
            name="glass"
            label="Glass material"
            value={prefs.glass}
            onChange={(glass) => setPrefs({ glass })}
            options={[
              { value: "clear", label: "Clear" },
              { value: "balanced", label: "Balanced" },
              { value: "tinted", label: "Tinted" },
              { value: "solid", label: "Solid" },
            ]}
          />
        </Row>
        <Row label="Accent colour">
          <fieldset>
            <legend className="sr-only">Accent colour</legend>
            <div className="flex flex-wrap gap-2.5">
              {ACCENTS.map((a) => (
                <label key={a} className="relative cursor-pointer" title={a}>
                  <input type="radio" name="accent" value={a} checked={prefs.accent === a} onChange={() => setPrefs({ accent: a })} className="peer sr-only" />
                  <span className="sr-only">{a}</span>
                  <span
                    aria-hidden
                    className="grid size-8 place-items-center rounded-full ring-offset-2 ring-offset-[var(--surface-solid)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent-ring)]"
                    style={{ background: ACCENT_SWATCH[a] }}
                  >
                    {prefs.accent === a && <Check className="size-4 text-white" strokeWidth={3} />}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </Row>
        <Row label="Wallpaper">
          <fieldset>
            <legend className="sr-only">Wallpaper</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {WALLPAPERS.map((w) => (
                <label key={w} className="cursor-pointer">
                  <input type="radio" name="wallpaper" value={w} checked={prefs.wallpaper === w} onChange={() => setPrefs({ wallpaper: w })} className="peer sr-only" />
                  <span
                    aria-hidden
                    className={cn(
                      `wp-thumb-${w} block aspect-[16/10] rounded-xl border-2 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--accent-ring)]`,
                      prefs.wallpaper === w ? "border-accent" : "border-transparent",
                    )}
                  />
                  <span className="mt-1 block text-center text-[12.5px] text-fg">{WALLPAPER_LABEL[w]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </Row>
      </Group>

      <Group title="Motion">
        <Row label="Animation" hint="“Automatic” follows your system's reduce-motion setting.">
          <Segmented
            name="motion"
            label="Animation level"
            value={prefs.motion}
            onChange={(motion) => setPrefs({ motion })}
            options={[
              { value: "system", label: "Automatic" },
              { value: "full", label: "Full" },
              { value: "reduced", label: "Reduced" },
              { value: "off", label: "Off" },
            ]}
          />
        </Row>
        <Row label="Start-up">
          <Toggle checked={prefs.showBoot} onChange={(showBoot) => setPrefs({ showBoot })} label="Show the intro once per visit" />
        </Row>
      </Group>

      <Group title="Dock">
        <Row label="Size">
          <Segmented
            name="dock-size"
            label="Dock size"
            value={prefs.dockSize}
            onChange={(dockSize) => setPrefs({ dockSize })}
            options={[
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
            ]}
          />
        </Row>
        <Row label="Magnification">
          <Toggle checked={prefs.dockMagnify} onChange={(dockMagnify) => setPrefs({ dockMagnify })} label="Magnify icons under the pointer" description="Disabled automatically when motion is reduced." />
        </Row>
      </Group>

      <Group title="Help">
        <Row label="Quick start">
          <Toggle checked={prefs.showTips} onChange={(showTips) => setPrefs({ showTips })} label="Show the quick-start panel on Home" description="Shortcuts to projects, Ask SHIVAM.OS, Recruiter Mode and search." />
        </Row>
      </Group>

      <div className="mt-8 flex items-center justify-between rounded-2xl border border-hairline p-4">
        <div>
          <p className="font-medium text-fg">Reset all settings</p>
          <p className="text-[13px] text-muted">Restore the defaults for theme, glass, accent, wallpaper, motion, dock and quick start.</p>
        </div>
        <Button
          variant="danger"
          onClick={() => {
            resetPrefs();
            publishActivity({ kind: "info", title: "Settings reset", detail: "Defaults restored" });
          }}
        >
          <RotateCcw className="size-4" aria-hidden /> Reset
        </Button>
      </div>
    </AppScroll>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6" aria-label={title}>
      <h4 className="mb-2 text-[12px] font-semibold tracking-wider text-subtle uppercase">{title}</h4>
      <div className="divide-y divide-hairline rounded-2xl border border-hairline bg-sunken">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 p-4 md:grid-cols-[160px_1fr] md:items-center">
      <div>
        <p className="text-[14px] font-medium text-fg">{label}</p>
        {hint && <p className="text-[12px] text-muted">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
