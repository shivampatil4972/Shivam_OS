import { awards, certifications } from "@/content/education";
import { experience } from "@/content/experience";
import { profile } from "@/content/profile";
import { categoryLabels, projects, statusLabels } from "@/content/projects";
import { roles } from "@/content/recruiter";
import { researchItems } from "@/content/research";
import { skillGroupLabels, skills } from "@/content/skills";
import { APP_IDS, APPS, type AppId } from "@/os/apps";
import type { SearchEntry } from "./search";

export type SearchAction =
  | { kind: "open"; app: AppId; params?: Record<string, string> }
  | { kind: "external"; href: string }
  | { kind: "copy"; text: string; label: string }
  | { kind: "download"; href: string; fileName: string }
  | { kind: "toggle-theme" };

export type OSSearchEntry = SearchEntry<SearchAction>;

let cache: OSSearchEntry[] | null = null;

export function buildSearchIndex(): OSSearchEntry[] {
  if (cache) return cache;
  const entries: OSSearchEntry[] = [];

  for (const id of APP_IDS) {
    const app = APPS[id];
    entries.push({ id: `app-${id}`, group: "Apps", title: app.title, subtitle: app.description, keywords: app.keywords, action: { kind: "open", app: id }, boost: 25 });
  }

  for (const p of projects) {
    entries.push({
      id: `project-${p.slug}`,
      group: "Projects",
      title: p.title,
      subtitle: `${categoryLabels[p.category]} · ${statusLabels[p.status]} — ${p.tagline}`,
      keywords: [...p.technologies, p.category, ...p.secondaryCategories, p.status, "project"],
      action: { kind: "open", app: "projects", params: { slug: p.slug } },
      boost: p.featured ? 15 : 5,
    });
  }

  for (const s of skills) {
    entries.push({
      id: `skill-${s.id}`,
      group: "Skills",
      title: s.name,
      subtitle: `${skillGroupLabels[s.group]} · used in ${s.projects.length} project${s.projects.length === 1 ? "" : "s"}`,
      keywords: [s.group, "skill"],
      action: { kind: "open", app: "skills", params: { skill: s.id } },
    });
  }

  for (const r of researchItems) {
    entries.push({ id: `research-${r.id}`, group: "Research", title: r.title, subtitle: r.question, keywords: ["research", ...r.metrics], action: { kind: "open", app: "research", params: { item: r.id } }, boost: 5 });
  }

  for (const e of experience) {
    entries.push({ id: `exp-${e.id}`, group: "Experience", title: `${e.role} — ${e.organization}`, subtitle: e.summary, keywords: [...e.technologies, e.type], action: { kind: "open", app: "experience" } });
  }

  for (const c of certifications) {
    entries.push({ id: `cert-${c.id}`, group: "Credentials", title: c.title, subtitle: c.issuer, keywords: ["certificate", "certification", c.kind], action: { kind: "open", app: "education" } });
  }
  for (const a of awards) {
    entries.push({ id: `award-${a.id}`, group: "Credentials", title: a.title, subtitle: "Award", keywords: ["award", "achievement"], action: { kind: "open", app: "education" } });
  }

  for (const role of roles) {
    entries.push({ id: `role-${role.id}`, group: "Recruiter Mode", title: `Recruiter view: ${role.title}`, subtitle: role.pitch, keywords: ["hire", "recruiter", "role"], action: { kind: "open", app: "recruiter", params: { role: role.id } } });
  }

  entries.push(
    { id: "act-resume", group: "Actions", title: "Download résumé (PDF)", subtitle: `Updated ${profile.resume.updated}`, keywords: ["cv", "resume", "pdf"], action: { kind: "download", href: profile.resume.href, fileName: profile.resume.fileName }, boost: 20 },
    { id: "act-email", group: "Actions", title: "Copy email address", subtitle: profile.email, keywords: ["email", "contact", "mail"], action: { kind: "copy", text: profile.email, label: "Email address" }, boost: 10 },
    { id: "act-linkedin", group: "Actions", title: "Open LinkedIn profile", subtitle: profile.links.linkedin, keywords: ["linkedin", "social", "profile"], action: { kind: "external", href: profile.links.linkedin } },
    { id: "act-github", group: "Actions", title: "Open GitHub profile", subtitle: profile.links.github, keywords: ["github", "code", "repositories"], action: { kind: "external", href: profile.links.github } },
    { id: "act-theme", group: "Actions", title: "Toggle light / dark mode", keywords: ["theme", "dark", "light", "appearance"], action: { kind: "toggle-theme" } },
    { id: "act-experiment", group: "Actions", title: "Run the placement experiment", subtitle: "AI Lab", keywords: ["ml", "model", "experiment", "baseline"], action: { kind: "open", app: "ai-lab" } },
  );

  cache = entries;
  return entries;
}

/** Shown before the visitor types anything. */
export const SUGGESTED_IDS = ["project-journex", "app-recruiter", "app-ask", "act-resume", "app-ai-lab", "app-xray", "act-email"];
