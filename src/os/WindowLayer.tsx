"use client";

import dynamic from "next/dynamic";
import { useMemo, type ComponentType } from "react";
import type { AppId } from "./apps";
import { useOSState } from "./OSContext";
import { shallowEqualArray } from "./state/store";
import { useInitialContent } from "./InitialContent";
import { Window } from "./Window";

export interface AppProps {
  params: Record<string, string>;
  windowId: string;
}

function Loading() {
  return (
    <div className="grid h-full place-items-center text-sm text-muted" role="status">
      Loading…
    </div>
  );
}

/** Each app is code-split; only opened apps load their JavaScript. */
const APP_COMPONENTS: Record<AppId, ComponentType<AppProps>> = {
  home: dynamic(() => import("@/apps/home/HomeApp"), { loading: Loading }),
  projects: dynamic(() => import("@/apps/projects/ProjectsApp"), { loading: Loading }),
  ask: dynamic(() => import("@/apps/ask/AskApp"), { loading: Loading }),
  about: dynamic(() => import("@/apps/about/AboutApp"), { loading: Loading }),
  skills: dynamic(() => import("@/apps/skills/SkillsApp"), { loading: Loading }),
  education: dynamic(() => import("@/apps/education/EducationApp"), { loading: Loading }),
  experience: dynamic(() => import("@/apps/experience/ExperienceApp"), { loading: Loading }),
  research: dynamic(() => import("@/apps/research/ResearchApp"), { loading: Loading }),
  "ai-lab": dynamic(() => import("@/apps/ai-lab/AILabApp"), { loading: Loading }),
  xray: dynamic(() => import("@/apps/xray/XRayApp"), { loading: Loading }),
  github: dynamic(() => import("@/apps/github/GitHubApp"), { loading: Loading }),
  terminal: dynamic(() => import("@/apps/terminal/TerminalApp"), { loading: Loading }),
  resume: dynamic(() => import("@/apps/resume/ResumeApp"), { loading: Loading }),
  contact: dynamic(() => import("@/apps/contact/ContactApp"), { loading: Loading }),
  settings: dynamic(() => import("@/apps/settings/SettingsApp"), { loading: Loading }),
  quality: dynamic(() => import("@/apps/quality/QualityApp"), { loading: Loading }),
  recruiter: dynamic(() => import("@/apps/recruiter/RecruiterApp"), { loading: Loading }),
};

export function WindowLayer() {
  const ids = useOSState((s) => s.wm.windows.map((w) => w.id), shallowEqualArray);
  return (
    <div className="pointer-events-none fixed inset-0 z-10 *:pointer-events-auto">
      {ids.map((id) => (
        <WindowSlot key={id} id={id} />
      ))}
    </div>
  );
}

function WindowSlot({ id }: { id: string }) {
  const win = useOSState((s) => s.wm.windows.find((w) => w.id === id));
  const focused = useOSState((s) => s.wm.focusedId === id);
  const app = win?.app;
  const params = win?.params;
  // The route's server-rendered app, while the window still shows what the route opened.
  const initial = useInitialContent(app, params);
  // A stable element lets React skip the app subtree when only geometry or focus change,
  // so a server-rendered app is never re-rendered before its code has hydrated.
  const content = useMemo(() => {
    if (initial) return initial;
    if (!app || !params) return null;
    const Content = APP_COMPONENTS[app];
    return <Content params={params} windowId={id} />;
  }, [initial, app, params, id]);
  if (!win) return null;
  return (
    <Window win={win} focused={focused}>
      {content}
    </Window>
  );
}
