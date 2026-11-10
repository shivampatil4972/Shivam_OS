"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { Wallpaper } from "@/design/Wallpaper";
import { ActivityPill } from "./ActivityPill";
import { InitialContentProvider } from "./InitialContent";
import { Desktop, MobileHome } from "./Desktop";
import { Dock } from "./Dock";
import { MenuBar } from "./MenuBar";
import { OSProvider } from "./OSContext";
import { PointerEffects } from "./PointerEffects";
import { BootScreen, DesktopContextMenu, Overview, ShortcutsDialog } from "./Overlays";
import type { Intent } from "./routes";
import { Spotlight } from "./Spotlight";
import { initPrefs, useReducedMotion } from "./state/prefs";
import { createInitialOSState } from "./state/store";
import { WindowLayer } from "./WindowLayer";

function initialFor(intent: Intent) {
  if (intent.type === "desktop") return createInitialOSState([{ app: "home", auto: true }]);
  return createInitialOSState([{ app: intent.app, params: intent.params }]);
}

export function OSRoot({ intent, initialContent }: { intent: Intent; initialContent?: ReactNode }) {
  const [initial] = useState(() => initialFor(intent));
  const first = initial.wm.windows[0];
  useEffect(() => {
    initPrefs();
  }, []);
  const reduced = useReducedMotion();
  return (
    <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion={reduced ? "always" : "never"}>
      <OSProvider initial={initial}>
        <a href="#main-window" className="sr-only-focusable fixed top-1 left-1 z-[70] rounded-md bg-accent-strong px-3 py-1.5 text-sm text-white">
          Skip to content
        </a>
        <Wallpaper />
        <MenuBar />
        <Desktop />
        <MobileHome />
        <main id="main-window" tabIndex={-1} className="outline-none">
          <InitialContentProvider value={first && initialContent ? { app: first.app, params: first.params, node: initialContent } : null}>
            <WindowLayer />
          </InitialContentProvider>
        </main>
        <Dock />
        <ActivityPill />
        <Spotlight />
        <Overview />
        <DesktopContextMenu />
        <ShortcutsDialog />
        <PointerEffects />
        <p id="window-move-hint" className="sr-only">
          Use the arrow keys to move this window.
        </p>
        {intent.type === "desktop" && <BootScreen />}
      </OSProvider>
    </MotionConfig>
    </LazyMotion>
  );
}
