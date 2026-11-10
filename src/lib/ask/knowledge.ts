/**
 * The knowledge base behind "Ask SHIVAM.OS": the portfolio's own verified
 * content, split into small cited passages, plus a BM25 retriever.
 *
 * Integrity rules
 * - Only content from `src/content` goes in. Nothing is summarised or
 *   paraphrased here, so every passage the model cites says what the site says.
 * - Placeholders are owner to-dos (some carry suggestions); they become
 *   "[not provided yet]" so a suggestion can never be presented as a fact.
 * - Each chunk links to the page it came from, so answers can show sources.
 */
import { awards, certifications, education, hackathons } from "@/content/education";
import { experience } from "@/content/experience";
import { PLACEHOLDER_PREFIX } from "@/content/placeholder";
import { profile } from "@/content/profile";
import { categoryLabels, getProject, projects, statusLabels } from "@/content/projects";
import { roles } from "@/content/recruiter";
import { researchItems } from "@/content/research";
import type { Project, Research } from "@/content/schema";
import { evidenceLevelLabels, skillGroupLabels, skills } from "@/content/skills";
import { xraySystems, xrayStatusLabels } from "@/content/xray";
import { normalize } from "@/lib/search";

export interface KnowledgeChunk {
  id: string;
  title: string;
  /** Same-origin path of the page this content appears on. */
  href: string;
  /** Each passage is one citable unit. */
  passages: string[];
}

export const NOT_PROVIDED = "[not provided yet]";

/** Chunks sent with every question: who Shivam is, and the list of all projects. */
export const ALWAYS_INCLUDED = ["profile", "projects-index"] as const;

export function clean(text: string): string {
  const at = text.indexOf(PLACEHOLDER_PREFIX);
  if (at === -1) return text.trim();
  const before = text.slice(0, at).trim();
  return before ? `${before} ${NOT_PROVIDED}` : NOT_PROVIDED;
}

type Passage = string | null | undefined | false;

function chunk(id: string, title: string, href: string, passages: Passage[]): KnowledgeChunk {
  // Safety net: a placeholder that slipped into a template is cut off rather than passed on.
  return { id, title, href, passages: passages.filter((p): p is string => typeof p === "string" && p.trim().length > 0).map(clean) };
}

/** One passage per item, each prefixed with its label; placeholders collapse to one "not provided" line. */
function each(label: string, items: readonly string[]): string[] {
  if (items.length === 0) return [];
  const cleaned = items.map(clean);
  const real = cleaned.filter((s) => s !== NOT_PROVIDED);
  const out = real.map((s) => `${label}: ${s}`);
  if (real.length < cleaned.length) out.push(`${label}: ${real.length ? "further details " : ""}${NOT_PROVIDED}`);
  return out;
}

const TEST_STATUS: Record<Project["testing"]["suites"][number]["status"], string> = {
  "reported-passing": "reported passing in the source named below (not re-run by this portfolio)",
  "defined-not-run-here": "defined in the repository but not run for this portfolio",
  "not-available": "no test results available",
};

const RESEARCH_STATUS: Record<Research["status"], string> = {
  draft: "Draft",
  "internal-report": "Internal report",
  submitted: "Submitted",
  accepted: "Accepted",
  published: "Published",
  "unpublished-project-research": "Unpublished project research (not a publication)",
};

const projectTitle = (slug: string) => getProject(slug)?.title ?? slug;

function profileChunk(): KnowledgeChunk {
  return chunk("profile", `${profile.name} — profile`, "/about", [
    `${profile.name} (full name ${profile.fullName}). ${profile.headline}`,
    `Roles: ${profile.roles.join(", ")}. Location: ${profile.location}.`,
    profile.summary,
    `Availability: ${profile.availability.label}. ${clean(profile.availability.detail)}`,
    `Career direction: ${profile.about.careerDirection}`,
    `Languages spoken: ${profile.languages.join(", ")}.`,
    `Contact: email ${profile.email}; GitHub ${profile.links.github}; LinkedIn ${profile.links.linkedin}; LeetCode ${profile.links.leetcode}. A phone number is not published on this site.`,
    `Résumé: a ${profile.resume.pages}-page PDF at ${profile.resume.href}, updated ${profile.resume.updated}.`,
  ]);
}

function projectIndexChunk(): KnowledgeChunk {
  return chunk(
    "projects-index",
    "All projects (index)",
    "/projects",
    projects.map((p) => {
      const end = p.period.end === "ongoing" ? "ongoing" : p.period.end;
      return `${p.title} — ${categoryLabels[p.category]}, ${statusLabels[p.status]}, ${p.period.start} to ${end}${p.featured ? ", featured" : ""}. ${p.tagline} Technologies: ${p.technologies.slice(0, 8).join(", ")}.`;
    }),
  );
}

function projectChunks(p: Project): KnowledgeChunk[] {
  const href = `/projects/${p.slug}`;
  const end = p.period.end === "ongoing" ? "ongoing" : p.period.end;
  const teamNote = clean(p.team.note);
  const team = p.team.size === null ? teamNote || NOT_PROVIDED : `${p.team.size === 1 ? "Solo project" : `Team of ${p.team.size}`}${teamNote ? `. ${teamNote}` : ""}`;
  const secondary = p.secondaryCategories.length ? ` (also ${p.secondaryCategories.map((c) => categoryLabels[c]).join(", ")})` : "";
  return [
    chunk(`${p.slug}-overview`, `${p.title} — overview`, href, [
      `${p.title}: ${p.tagline}`,
      p.summary,
      `Category: ${categoryLabels[p.category]}${secondary}. Status: ${statusLabels[p.status]} — ${clean(p.statusNote)}`,
      `Period: ${p.period.start} to ${end}. Team: ${team}. Shivam's role: ${p.role}.`,
      `Technologies: ${p.technologies.join(", ")}.`,
      `Shivam's contribution: ${clean(p.contribution.summary)}`,
      ...each("Contribution", p.contribution.items),
      `AI assistance: ${p.aiAssistance ?? "no disclosure recorded for this project."}`,
    ]),
    chunk(`${p.slug}-problem`, `${p.title} — problem and solution`, href, [
      `Problem: ${clean(p.problem)}`,
      `Target users: ${p.targetUsers.map(clean).join("; ")}.`,
      `Solution: ${clean(p.solution)}`,
      ...each("Workflow", p.workflows),
    ]),
    chunk(`${p.slug}-architecture`, `${p.title} — architecture and implementation`, href, [
      `Architecture: ${clean(p.architecture.summary)}`,
      ...each("Data flow", p.architecture.dataFlow),
      ...p.techRationale.map((t) => `Why ${t.tech}: ${clean(t.why)}`),
      ...each("Implementation", p.implementation),
    ]),
    chunk(`${p.slug}-challenges`, `${p.title} — challenges and trade-offs`, href, [
      ...p.challenges.map((c) => `Challenge — ${c.title}: ${clean(c.detail)}`),
      ...p.tradeoffs.map((t) => `Trade-off — ${t.decision}. Alternatives: ${clean(t.alternatives)}. Cost: ${clean(t.cost)}`),
    ]),
    chunk(`${p.slug}-testing`, `${p.title} — testing, results and evidence`, href, [
      `Testing: ${clean(p.testing.summary)}`,
      ...p.testing.suites.map(
        (s) => `Test suite "${s.name}"${s.count !== null ? ` (${s.count} tests)` : ""}: ${TEST_STATUS[s.status]}${s.asOf ? `, as of ${s.asOf}` : ""}. ${clean(s.detail)} Source: ${s.source}.`,
      ),
      ...p.results.map((r) => `Result — ${r.label}: ${r.value}. ${clean(r.context)} (source: ${r.source})`),
      ...p.evidence.map((e) => `Evidence — ${e.label}: ${clean(e.note)} (verified from ${e.verifiedFrom})`),
    ]),
    chunk(`${p.slug}-limits`, `${p.title} — limitations, lessons and history`, href, [
      ...each("Limitation", p.limitations),
      ...each("Lesson", p.lessons),
      ...each("Future work", p.future),
      ...p.evolution.map((e) => `${e.date} (${e.kind}): ${e.title} — ${clean(e.detail)}`),
      p.links.length ? `Links: ${p.links.map((l) => `${l.label} (${l.href})`).join("; ")}.` : "Links: no public repository or demo is linked.",
      p.setup.note && `Setup note: ${clean(p.setup.note)}`,
    ]),
  ];
}

function aboutChunk(): KnowledgeChunk {
  const a = profile.about;
  return chunk("about", "About Shivam — journey, interests and philosophy", "/about", [
    a.intro,
    ...each("Journey", a.journey),
    ...each("Interest", a.interests),
    ...each("Engineering philosophy", a.philosophy),
    ...each("Leadership", a.leadership),
    ...each("Learning goals", a.learningGoals),
    ...each("Outside engineering", a.personal),
  ]);
}

function educationChunks(): KnowledgeChunk[] {
  return [
    chunk("education", "Education", "/education", [
      `Degree: ${education.degree} at ${education.institution}, ${education.period} (${education.graduation}).`,
      `Affiliating university: ${clean(education.university)}`,
      `CGPA: ${education.cgpa} (source: ${education.cgpaSource}).`,
      ...education.school.map((s) => `${s.level}: completed ${s.year}.`),
      `CS foundations studied: ${education.foundations.join(", ")}.`,
      ...each("Coursework", education.coursework),
      `Academic projects: ${education.academicProjects.map(projectTitle).join(", ")}.`,
    ]),
    chunk(
      "certifications",
      "Certifications",
      "/education",
      certifications.map((c) => `${c.title} — ${c.issuer}${c.date === "undated" ? " (date not listed)" : ` (${c.date})`}; ${c.kind.replace("-", " ")}.`),
    ),
    chunk("awards", "Awards, recognitions and hackathons", "/education", [
      ...awards.map((a) => `${a.title} (${clean(a.date)}): ${clean(a.detail)}`),
      ...hackathons.map((h) => `Hackathon — ${h.name}, ${h.date}: built ${projectTitle(h.project)}; result: ${clean(h.result)}.`),
    ]),
  ];
}

function experienceChunks(): KnowledgeChunk[] {
  return experience.map((e) =>
    chunk(`exp-${e.id}`, `${e.role} — ${e.organization}`, "/experience", [
      `${e.role} at ${e.organization} (${e.type.replace("-", " ")}). Dates: ${clean(e.start)} to ${clean(e.end)}. Location: ${clean(e.location)}.`,
      e.summary,
      ...each("Responsibility", e.responsibilities),
      ...each("Contribution", e.contributions),
      e.technologies.length ? `Technologies: ${e.technologies.join(", ")}.` : null,
      ...each("Outcome", e.outcomes),
      ...each("Lesson", e.lessons),
    ]),
  );
}

function skillChunks(): KnowledgeChunk[] {
  const groups = [...new Set(skills.map((s) => s.group))];
  return groups.map((group) =>
    chunk(
      `skills-${group}`,
      `Skills — ${skillGroupLabels[group]}`,
      "/skills",
      skills
        .filter((s) => s.group === group)
        .map((s) => {
          const level = evidenceLevelLabels[s.evidenceLevel];
          const used = s.projects.length ? ` Used in: ${s.projects.map(projectTitle).join(", ")}.` : "";
          return `${s.name} — evidence: ${level.label} (${level.description.toLowerCase()}).${used}${s.note ? ` ${clean(s.note)}` : ""}`;
        }),
    ),
  );
}

function researchChunks(r: Research): KnowledgeChunk[] {
  return [
    chunk(`research-${r.id}`, `Research — ${r.title}`, "/research", [
      `${r.title}. Research question: ${r.question}`,
      `Status: ${RESEARCH_STATUS[r.status]}. ${clean(r.statusNote)}`,
      r.projectSlug && `Part of the project ${projectTitle(r.projectSlug)}.`,
      r.abstract,
      ...each("Method", r.methodology),
      ...each("Dataset", r.dataset),
      ...each("Baseline", r.baselines),
      `Metrics: ${r.metrics.join(", ")}.`,
    ]),
    chunk(`research-${r.id}-results`, `Research — ${r.title}: results and limitations`, "/research", [
      `Results (${r.results.caption}):`,
      ...r.results.rows.map((row) => r.results.columns.map((c, i) => `${c}: ${row[i] ?? "—"}`).join(", ")),
      ...each("Finding", r.results.findings),
      ...each("Limitation", r.limitations),
      ...each("Reproducibility", r.reproducibility),
      `Contributions: ${clean(r.contributions)}`,
      `As of ${r.asOf}.`,
    ]),
  ];
}

function xrayChunks(): KnowledgeChunk[] {
  return xraySystems.map((s) =>
    chunk(`xray-${s.id}`, `Architecture — ${s.title}`, `/xray?system=${encodeURIComponent(s.id)}`, [
      `${s.title} (project ${projectTitle(s.projectSlug)}): ${s.summary}`,
      s.rule,
      ...s.nodes.map(
        (n) => `Component ${n.label} (${n.tech}) — ${xrayStatusLabels[n.status].label}: ${clean(n.responsibility)}${n.tradeoff ? ` Trade-off: ${clean(n.tradeoff)}` : ""}`,
      ),
      `Source: ${s.sourceNote}`,
    ]),
  );
}

function roleChunks(): KnowledgeChunk[] {
  return roles.map((r) =>
    chunk(`role-${r.id}`, `Recruiter view — ${r.title}`, `/recruiter?role=${r.id}`, [
      `${r.title}: ${r.pitch}`,
      `Most relevant projects: ${r.projects.map(projectTitle).join(", ")}.`,
      ...r.evidence.map((e) => `${e.label}: ${e.detail}`),
    ]),
  );
}

function siteChunk(): KnowledgeChunk {
  return chunk("site", "About SHIVAM.OS (this site)", "/", [
    "SHIVAM.OS is Shivam Patil's portfolio website, presented as an iOS-inspired developer operating system with apps for projects, skills, education, experience, research and contact.",
    "Ask SHIVAM.OS answers questions with Gemini, an AI model by Google, using only this portfolio's content, and shows the sources of each answer.",
    "The Quality Control app shows dated reports of this site's tests, accessibility checks, performance measurements and link checks, including checks that were not run.",
  ]);
}

let cached: KnowledgeChunk[] | null = null;

export function buildKnowledge(): KnowledgeChunk[] {
  if (cached) return cached;
  cached = [
    profileChunk(),
    projectIndexChunk(),
    aboutChunk(),
    ...educationChunks(),
    ...experienceChunks(),
    ...skillChunks(),
    ...projects.flatMap(projectChunks),
    ...researchItems.flatMap(researchChunks),
    ...xrayChunks(),
    ...roleChunks(),
    siteChunk(),
  ].filter((c) => c.passages.length > 0);
  return cached;
}

/* ------------------------------------------------------------------ */
/* Retrieval: BM25 over passages, with the title counted three times.  */
/* ------------------------------------------------------------------ */

const STOPWORDS = new Set(
  "a an and any are as at be been but by can could did do does doing for from had has have he her him his how i if in into is it its me my of on or our she so than that the their them then there these they this those to us was we were what when where which while who whom why will with would you your about tell know give list show shivam patil shivam's please".split(" "),
);

/** Visitor vocabulary mapped onto the words the content uses. */
const ALIASES: Record<string, string[]> = {
  ml: ["machine", "learn"],
  ai: ["ai", "llm", "machine", "learn"],
  genai: ["ai", "llm"],
  js: ["javascript"],
  ts: ["typescript"],
  cv: ["resume"],
  gpa: ["cgpa"],
  grade: ["cgpa"],
  marks: ["cgpa"],
  college: ["college", "institution", "education"],
  degree: ["degree", "education"],
  graduate: ["graduat", "2027"],
  graduation: ["graduat", "2027"],
  job: ["internship", "experience"],
  work: ["internship", "experience", "project"],
  intern: ["internship"],
  hire: ["availability", "role"],
  available: ["availability"],
  certificate: ["certification"],
  certified: ["certification"],
  patent: ["patent", "design", "registration"],
  database: ["database", "postgresql", "mysql", "mongodb", "sql"],
  backend: ["backend", "api", "spring", "express", "fastapi"],
  frontend: ["frontend", "react", "typescript"],
  cloud: ["cloud", "aws"],
  team: ["team"],
  contact: ["contact", "email"],
  phone: ["phone", "contact"],
};

function stem(token: string): string {
  if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 3 && token.endsWith("s") && !/(ss|us|is)$/.test(token)) return token.slice(0, -1);
  return token;
}

export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const raw of normalize(text).split(" ")) {
    const token = raw.replace(/^[.]+|[.]+$/g, "");
    if (!token || STOPWORDS.has(token)) continue;
    out.push(token.includes(".") ? token : stem(token));
    if (token.includes(".")) for (const part of token.split(".")) if (part && !STOPWORDS.has(part)) out.push(stem(part));
  }
  return out;
}

function queryTokens(query: string): string[] {
  const tokens = new Set<string>();
  for (const raw of normalize(query).split(" ")) {
    const token = raw.replace(/^[.]+|[.]+$/g, "");
    if (!token || STOPWORDS.has(token)) continue;
    const alias = ALIASES[token] ?? ALIASES[stem(token)];
    if (alias) alias.forEach((a) => tokens.add(stem(a)));
    tokenize(token).forEach((t) => tokens.add(t));
  }
  return [...tokens];
}

interface Indexed {
  chunk: KnowledgeChunk;
  tf: Map<string, number>;
  length: number;
}

export interface Retriever {
  retrieve(query: string, options?: { limit?: number; charBudget?: number }): KnowledgeChunk[];
  score(query: string): Array<{ id: string; score: number }>;
}

export function createRetriever(chunks: KnowledgeChunk[]): Retriever {
  const docs: Indexed[] = chunks.map((c) => {
    const titleTokens = tokenize(c.title);
    const tokens = [...titleTokens, ...titleTokens, ...titleTokens, ...c.passages.flatMap(tokenize)];
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    return { chunk: c, tf, length: tokens.length };
  });
  const df = new Map<string, number>();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  const avg = docs.reduce((s, d) => s + d.length, 0) / Math.max(1, docs.length);
  const N = docs.length;
  const k1 = 1.2;
  const b = 0.75;

  const score = (query: string) => {
    const q = queryTokens(query);
    return docs
      .map((d) => {
        let s = 0;
        for (const t of q) {
          const f = d.tf.get(t);
          if (!f) continue;
          const n = df.get(t) ?? 0;
          const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
          s += (idf * (f * (k1 + 1))) / (f + k1 * (1 - b + (b * d.length) / avg));
        }
        return { id: d.chunk.id, score: s };
      })
      .sort((x, y) => y.score - x.score);
  };

  const byId = new Map(chunks.map((c) => [c.id, c]));
  const size = (c: KnowledgeChunk) => c.title.length + c.passages.reduce((s, p) => s + p.length, 0);

  return {
    score,
    retrieve(query, { limit = 8, charBudget = 30_000 } = {}) {
      const picked: KnowledgeChunk[] = [];
      let used = 0;
      for (const id of ALWAYS_INCLUDED) {
        const c = byId.get(id);
        if (c) {
          picked.push(c);
          used += size(c);
        }
      }
      let added = 0;
      for (const { id, score: s } of score(query)) {
        if (added >= limit || s <= 0) break;
        if ((ALWAYS_INCLUDED as readonly string[]).includes(id)) continue;
        const c = byId.get(id)!;
        if (used + size(c) > charBudget) continue;
        picked.push(c);
        used += size(c);
        added += 1;
      }
      return picked;
    },
  };
}

let retriever: Retriever | null = null;

export function retrieve(query: string, options?: { limit?: number; charBudget?: number }): KnowledgeChunk[] {
  retriever ??= createRetriever(buildKnowledge());
  return retriever.retrieve(query, options);
}
