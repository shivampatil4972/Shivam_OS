import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import AboutApp from "@/apps/about/AboutApp";
import AILabApp from "@/apps/ai-lab/AILabApp";
import AskApp from "@/apps/ask/AskApp";
import ContactApp from "@/apps/contact/ContactApp";
import EducationApp from "@/apps/education/EducationApp";
import ExperienceApp from "@/apps/experience/ExperienceApp";
import GitHubApp from "@/apps/github/GitHubApp";
import QualityApp from "@/apps/quality/QualityApp";
import RecruiterApp from "@/apps/recruiter/RecruiterApp";
import ResearchApp from "@/apps/research/ResearchApp";
import ResumeApp from "@/apps/resume/ResumeApp";
import SettingsApp from "@/apps/settings/SettingsApp";
import SkillsApp from "@/apps/skills/SkillsApp";
import TerminalApp from "@/apps/terminal/TerminalApp";
import XRayApp from "@/apps/xray/XRayApp";
import { APP_IDS, APPS, isAppId, type AppId } from "@/os/apps";
import { OSRoot } from "@/os/OSRoot";
import type { AppProps } from "@/os/WindowLayer";

/** Each route server-renders the app it opens; the browser loads only that app's code. */
const ROUTE_APPS: Record<Exclude<AppId, "home" | "projects">, ComponentType<AppProps>> = {
  ask: AskApp,
  about: AboutApp,
  skills: SkillsApp,
  education: EducationApp,
  experience: ExperienceApp,
  research: ResearchApp,
  "ai-lab": AILabApp,
  xray: XRayApp,
  github: GitHubApp,
  terminal: TerminalApp,
  resume: ResumeApp,
  contact: ContactApp,
  settings: SettingsApp,
  quality: QualityApp,
  recruiter: RecruiterApp,
};

export const dynamicParams = false;

export function generateStaticParams() {
  return APP_IDS.filter((id) => id !== "home" && id !== "projects").map((app) => ({ app }));
}

export async function generateMetadata({ params }: { params: Promise<{ app: string }> }): Promise<Metadata> {
  const { app } = await params;
  if (!isAppId(app)) return {};
  return {
    title: APPS[app].title,
    description: APPS[app].description,
    alternates: { canonical: `/${app}` },
    openGraph: { title: `${APPS[app].title} — SHIVAM.OS`, description: APPS[app].description, url: `/${app}` },
  };
}

export default async function AppPage({ params }: { params: Promise<{ app: string }> }) {
  const { app } = await params;
  if (!isAppId(app) || app === "home" || app === "projects") notFound();
  const Content = ROUTE_APPS[app];
  return <OSRoot intent={{ type: "app", app }} initialContent={<Content params={{}} windowId={`win-${app}`} />} />;
}
