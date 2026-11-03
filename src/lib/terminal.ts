import { certifications, education } from "@/content/education";
import { experience } from "@/content/experience";
import { profile } from "@/content/profile";
import { getProject, projects, statusLabels } from "@/content/projects";
import { researchItems } from "@/content/research";
import { isPlaceholder } from "@/content/placeholder";
import { skillGroupLabels, skills } from "@/content/skills";
import { APP_IDS, isAppId, type AppId } from "@/os/apps";

/**
 * A safe, predefined command set. Input is parsed into a command name and
 * arguments and dispatched to pure functions — nothing is ever evaluated or
 * executed, and effects (opening an app, changing theme) are returned as data.
 */
export type TerminalEffect =
  | { kind: "open"; app: AppId; params?: Record<string, string> }
  | { kind: "theme"; theme: "dark" | "light" | "system" }
  | { kind: "clear" }
  | { kind: "download"; href: string; fileName: string };

export interface TerminalOutput {
  lines: string[];
  effect?: TerminalEffect;
  error?: boolean;
}

export const COMMANDS: Record<string, { usage: string; summary: string }> = {
  help: { usage: "help", summary: "List available commands" },
  about: { usage: "about", summary: "Who Shivam is" },
  projects: { usage: "projects [name]", summary: "List projects, or open one" },
  skills: { usage: "skills [group]", summary: "Skills grouped by area" },
  education: { usage: "education", summary: "Degree, CGPA and certifications" },
  experience: { usage: "experience", summary: "Internships and leadership roles" },
  research: { usage: "research", summary: "Research questions and status" },
  resume: { usage: "resume [--download]", summary: "Open or download the résumé" },
  contact: { usage: "contact", summary: "Email and profile links" },
  open: { usage: "open <app>", summary: "Open any app (e.g. open xray)" },
  theme: { usage: "theme <dark|light|system>", summary: "Change the appearance" },
  whoami: { usage: "whoami", summary: "Print the current visitor" },
  history: { usage: "history", summary: "Show previous commands" },
  clear: { usage: "clear", summary: "Clear the screen" },
};

export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) tokens.push(m[1] ?? m[2] ?? m[3] ?? "");
  return tokens;
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0]![j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length]![b.length]!;
}

export function suggest(name: string): string | null {
  let best: string | null = null;
  let score = Infinity;
  for (const c of Object.keys(COMMANDS)) {
    const d = levenshtein(name, c);
    if (d < score) {
      score = d;
      best = c;
    }
  }
  return score <= 2 ? best : null;
}

export function complete(partial: string): string[] {
  const tokens = tokenize(partial);
  if (tokens.length <= 1 && !partial.endsWith(" ")) {
    return Object.keys(COMMANDS).filter((c) => c.startsWith((tokens[0] ?? "").toLowerCase()));
  }
  const [cmd, arg = ""] = tokens;
  if (cmd === "open") return APP_IDS.filter((a) => a.startsWith(arg)).map((a) => `open ${a}`);
  if (cmd === "projects") return projects.filter((p) => p.slug.startsWith(arg)).map((p) => `projects ${p.slug}`);
  if (cmd === "theme") return ["dark", "light", "system"].filter((t) => t.startsWith(arg)).map((t) => `theme ${t}`);
  return [];
}

const clean = (s: string) => (isPlaceholder(s) ? "(to be confirmed)" : s);

export function execute(input: string, history: string[] = []): TerminalOutput {
  const tokens = tokenize(input.trim());
  if (tokens.length === 0) return { lines: [] };
  const [rawCmd, ...args] = tokens;
  const cmd = rawCmd!.toLowerCase();

  switch (cmd) {
    case "help":
      return {
        lines: [
          "Available commands:",
          ...Object.values(COMMANDS).map((c) => `  ${c.usage.padEnd(28)} ${c.summary}`),
          "",
          "Tip: Tab completes, ↑/↓ browse history. Only these commands exist — nothing else runs.",
        ],
      };
    case "about":
      return { lines: [`${profile.fullName} — ${profile.roles.join(" · ")}`, profile.location, "", profile.summary, "", `Availability: ${profile.availability.label}`] };
    case "whoami":
      return { lines: ["guest — a visitor to SHIVAM.OS (read-only session)"] };
    case "projects": {
      if (args.length > 0) {
        const q = args.join(" ").toLowerCase();
        const match = getProject(q) ?? projects.find((p) => p.title.toLowerCase().includes(q) || p.slug.includes(q));
        if (!match) return { lines: [`projects: no project matches “${args.join(" ")}”. Run “projects” to list them.`], error: true };
        return { lines: [`Opening ${match.title}…`], effect: { kind: "open", app: "projects", params: { slug: match.slug } } };
      }
      return {
        lines: [
          `${projects.length} projects (open one with “projects <slug>”):`,
          ...projects.map((p) => `  ${p.slug.padEnd(34)} ${statusLabels[p.status].padEnd(15)} ${p.title}`),
        ],
      };
    }
    case "skills": {
      const group = args[0]?.toLowerCase();
      const groups = Object.entries(skillGroupLabels).filter(([g, label]) => !group || g.startsWith(group) || label.toLowerCase().startsWith(group));
      if (groups.length === 0) return { lines: [`skills: unknown group “${args[0]}”. Groups: ${Object.keys(skillGroupLabels).join(", ")}`], error: true };
      return {
        lines: groups.flatMap(([g, label]) => {
          const list = skills.filter((s) => s.group === g);
          return list.length ? [`${label}:`, `  ${list.map((s) => s.name).join(", ")}`] : [];
        }),
      };
    }
    case "education":
      return {
        lines: [
          education.degree,
          `${education.institution} · ${education.period} · CGPA ${education.cgpa}`,
          "",
          "Certifications:",
          ...certifications.map((c) => `  • ${c.title} — ${c.issuer}`),
        ],
      };
    case "experience":
      return { lines: experience.flatMap((e) => [`• ${e.role} — ${e.organization} (${clean(e.start)} – ${clean(e.end)})`, `  ${e.summary}`]) };
    case "research":
      return { lines: researchItems.flatMap((r) => [`• ${r.title}`, `  status: ${r.status.replace(/-/g, " ")} · as of ${r.asOf}`]) };
    case "resume":
      if (args.includes("--download") || args.includes("-d")) {
        return { lines: [`Downloading ${profile.resume.fileName} (updated ${profile.resume.updated})…`], effect: { kind: "download", href: profile.resume.href, fileName: profile.resume.fileName } };
      }
      return { lines: [`Opening the résumé (updated ${profile.resume.updated}). Use “resume --download” to save the PDF.`], effect: { kind: "open", app: "resume" } };
    case "contact":
      return { lines: [`email     ${profile.email}`, `linkedin  ${profile.links.linkedin}`, `github    ${profile.links.github}`, `leetcode  ${profile.links.leetcode}`, "", "Run “open contact” for the message form."] };
    case "open": {
      const target = args[0]?.toLowerCase();
      if (!target) return { lines: ["open: missing app name. Try “open projects”.", `Apps: ${APP_IDS.join(", ")}`], error: true };
      if (!isAppId(target)) return { lines: [`open: unknown app “${target}”.`, `Apps: ${APP_IDS.join(", ")}`], error: true };
      return { lines: [`Opening ${target}…`], effect: { kind: "open", app: target } };
    }
    case "theme": {
      const t = args[0]?.toLowerCase();
      if (t !== "dark" && t !== "light" && t !== "system") return { lines: ["theme: choose dark, light or system."], error: true };
      return { lines: [`Theme set to ${t}.`], effect: { kind: "theme", theme: t } };
    }
    case "history":
      return { lines: history.length ? history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`) : ["(no history yet)"] };
    case "clear":
      return { lines: [], effect: { kind: "clear" } };
    case "sudo":
    case "rm":
    case "bash":
    case "sh":
    case "eval":
      return { lines: [`${cmd}: not available — this terminal only runs its predefined, read-only commands.`], error: true };
    default: {
      const hint = suggest(cmd);
      return { lines: [`command not found: ${rawCmd}${hint ? ` — did you mean “${hint}”?` : ""}`, "Type “help” for the list of commands."], error: true };
    }
  }
}
