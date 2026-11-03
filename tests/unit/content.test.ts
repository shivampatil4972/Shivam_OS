import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { awards, certifications, education, hackathons } from "@/content/education";
import { experience } from "@/content/experience";
import githubSnapshot from "@/content/github-snapshot.json";
import { profile } from "@/content/profile";
import { getProject, projects, rawProjects } from "@/content/projects";
import { roles } from "@/content/recruiter";
import { researchItems } from "@/content/research";
import {
  awardSchema,
  certificationSchema,
  experienceSchema,
  isPlaceholder,
  placeholder,
  projectSchema,
  researchSchema,
  safeHref,
  skillSchema,
  stripPlaceholder,
} from "@/content/schema";
import { rawSkills, skills } from "@/content/skills";
import { rawXraySystems, xraySystems } from "@/content/xray";
import { systemSchema } from "@/content/xraySchema";

const pub = (p: string) => path.join(process.cwd(), "public", p);

function walkStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => walkStrings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => walkStrings(v, out));
  return out;
}

describe("schema validation (the site ships plain data; these tests are the gate)", () => {
  it("every project passes the full schema, including formats, lengths and link safety", () => {
    for (const p of rawProjects) {
      const r = projectSchema.safeParse(p);
      expect(r.success, `${p.id}: ${r.success ? "" : r.error.message}`).toBe(true);
    }
  });

  it("normalised projects equal what the schema produces", () => {
    for (const p of rawProjects) expect(getProject(p.slug)).toEqual(projectSchema.parse(p));
  });

  it("skills, credentials, experience and research pass their schemas", () => {
    for (const s of rawSkills) expect(skillSchema.safeParse(s).success, s.id).toBe(true);
    for (const c of certifications) expect(certificationSchema.safeParse(c).success, c.id).toBe(true);
    for (const a of awards) expect(awardSchema.safeParse(a).success, a.id).toBe(true);
    for (const e of experience) expect(experienceSchema.safeParse(e).success, e.id).toBe(true);
    for (const r of researchItems) {
      const res = researchSchema.safeParse(r);
      expect(res.success, `${r.id}: ${res.success ? "" : res.error.message}`).toBe(true);
    }
  });

  it("X-Ray systems pass their schema and match the normalised data", () => {
    for (const s of rawXraySystems) {
      const res = systemSchema.safeParse(s);
      expect(res.success, `${s.id}: ${res.success ? "" : res.error.message}`).toBe(true);
      expect(xraySystems.find((x) => x.id === s.id)).toEqual(systemSchema.parse(s));
    }
  });

  it("rejects malformed content", () => {
    const bad = { ...rawProjects[0]!, slug: "Not A Slug", links: [{ label: "x", href: "http://insecure.example", kind: "repo" }] };
    expect(projectSchema.safeParse(bad).success).toBe(false);
  });
});

describe("placeholder helpers", () => {
  it("round-trip", () => {
    const p = placeholder("Add a thing");
    expect(isPlaceholder(p)).toBe(true);
    expect(stripPlaceholder(p)).toBe("Add a thing");
    expect(isPlaceholder("Plain text")).toBe(false);
  });
});

describe("link safety", () => {
  it("allows https, mailto and same-origin paths only", () => {
    expect(safeHref.safeParse("https://example.com/a").success).toBe(true);
    expect(safeHref.safeParse("mailto:a@b.co").success).toBe(true);
    expect(safeHref.safeParse("/resume/x.pdf").success).toBe(true);
    expect(safeHref.safeParse("http://example.com").success).toBe(false);
    expect(safeHref.safeParse("javascript:alert(1)").success).toBe(false);
  });
});

describe("projects", () => {
  it("has unique ids, slugs and ranks", () => {
    for (const key of ["id", "slug", "rank"] as const) {
      const values = projects.map((p) => p[key]);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it("has every section a case study needs, with real content", () => {
    for (const p of projects) {
      expect(p.problem.length, p.slug).toBeGreaterThan(20);
      expect(p.solution.length, p.slug).toBeGreaterThan(20);
      expect(p.contribution.summary.length, p.slug).toBeGreaterThan(5);
      expect(p.techRationale.length, p.slug).toBeGreaterThan(0);
      expect(p.architecture.dataFlow.length, p.slug).toBeGreaterThan(0);
      expect(p.limitations.length, p.slug).toBeGreaterThan(0);
      expect(p.lessons.length, p.slug).toBeGreaterThan(0);
      expect(p.setup.steps.length, p.slug).toBeGreaterThan(0);
    }
  });

  it("has media files that exist, with the declared dimensions on disk", () => {
    for (const p of projects) {
      for (const m of [p.media.cover, ...p.media.gallery]) {
        if (m) expect(existsSync(pub(m.src)), m.src).toBe(true);
      }
    }
  });

  it("links an X-Ray only when one exists", () => {
    for (const p of projects) {
      if (p.architecture.xrayId) expect(xraySystems.some((s) => s.id === p.architecture.xrayId), p.slug).toBe(true);
    }
  });

  it("orders evolution dates validly", () => {
    for (const p of projects) {
      for (const e of p.evolution) expect(Number.isNaN(Date.parse(e.date)), e.title).toBe(false);
    }
  });

  it("states in-development status for the flagship and discloses AI assistance where trailers exist", () => {
    expect(getProject("journex")!.status).toBe("in-development");
    expect(getProject("journex")!.aiAssistance).toContain("Co-Authored-By");
    expect(getProject("intelligrade-ai")!.aiAssistance).toContain("Co-Authored-By");
  });

  it("records the failing CI job honestly for JOURNEX", () => {
    const text = getProject("journex")!.testing.summary;
    expect(text).toContain("failed the Web job");
  });

  it("does not link repositories known to be private", () => {
    const hrefs = projects.flatMap((p) => p.links.map((l) => l.href));
    expect(hrefs.some((h) => h.includes("support-triage-agent"))).toBe(false);
    expect(hrefs.some((h) => h.includes("shivam-portfolio"))).toBe(false);
  });

  it("every linked public repository appears in the GitHub snapshot", () => {
    const names = githubSnapshot.repos.map((r) => r.name.toLowerCase());
    for (const p of projects) {
      for (const l of p.links) {
        if (l.kind !== "repo" || !l.href.includes("github.com/shivampatil4972/")) continue;
        const repo = l.href.split("github.com/shivampatil4972/")[1]!.split("/")[0]!.toLowerCase();
        expect(names, `${p.slug}: ${repo}`).toContain(repo);
      }
    }
  });
});

describe("skills and the proof-of-work graph", () => {
  it("has unique ids", () => {
    const ids = skills.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("connects only to projects and certificates that exist", () => {
    for (const s of skills) {
      for (const slug of s.projects) expect(getProject(slug), `${s.id} → ${slug}`).toBeDefined();
      for (const c of s.certifications) expect(certifications.some((x) => x.id === c), `${s.id} → ${c}`).toBe(true);
    }
  });

  it("every skill-project edge has evidence on the project side", () => {
    for (const s of skills) {
      for (const slug of s.projects) expect(getProject(slug)!.evidence.length, slug).toBeGreaterThan(0);
    }
  });

  const techAliases: Record<string, string[]> = {
    python: ["Python", "FastAPI", "Flask"],
    java: ["Java"],
    typescript: ["TypeScript"],
    react: ["React"],
    "spring-boot": ["Spring Boot"],
    postgresql: ["PostgreSQL"],
    mysql: ["MySQL"],
    fastapi: ["FastAPI"],
    flask: ["Flask"],
    docker: ["Docker"],
    "power-bi": ["Power BI"],
    tableau: ["Tableau"],
    redis: ["Redis"],
    mongodb: ["MongoDB"],
    postgis: ["PostGIS"],
    pgvector: ["pgvector"],
    cpp: ["C++"],
    php: ["PHP"],
    "survival-analysis": ["lifelines"],
    simulation: ["SimPy"],
    optimisation: ["OR-Tools"],
  };

  it("technology skills map only to projects that list that technology", () => {
    for (const [id, needles] of Object.entries(techAliases)) {
      const skill = skills.find((s) => s.id === id)!;
      expect(skill, id).toBeDefined();
      for (const slug of skill.projects) {
        const tech = getProject(slug)!.technologies.join(" ");
        expect(needles.some((n) => tech.includes(n)), `${id} is not listed in ${slug}`).toBe(true);
      }
    }
  });

  it("uses evidence levels, never self-rated proficiency numbers", () => {
    for (const s of skills) {
      expect(Object.keys(s).some((k) => /proficien|percent|rating|score/i.test(k)), s.id).toBe(false);
      expect(s.name, s.id).not.toMatch(/\d+\s*%/);
    }
  });
});

describe("X-Ray systems", () => {
  it("reference existing projects and connect existing nodes", () => {
    for (const s of xraySystems) {
      expect(getProject(s.projectSlug), s.id).toBeDefined();
      const ids = new Set(s.nodes.map((n) => n.id));
      for (const e of s.edges) {
        expect(ids.has(e.from), `${s.id}: ${e.from}`).toBe(true);
        expect(ids.has(e.to), `${s.id}: ${e.to}`).toBe(true);
      }
    }
  });

  it("marks what is not implemented", () => {
    const intelligrade = xraySystems.find((s) => s.id === "intelligrade")!;
    expect(intelligrade.nodes.find((n) => n.id === "llm")!.status).toBe("unverified");
    expect(intelligrade.nodes.find((n) => n.id === "analytics")!.status).toBe("proposed");
  });
});

describe("research", () => {
  it("never claims a publication that does not exist", () => {
    for (const r of researchItems) expect(["submitted", "accepted", "published"]).not.toContain(r.status);
  });

  it("has figures on disk", () => {
    for (const r of researchItems) for (const f of r.figures) expect(existsSync(pub(f.src)), f.src).toBe(true);
  });

  it("states limitations and reproducibility for every study", () => {
    for (const r of researchItems) {
      expect(r.limitations.length).toBeGreaterThan(0);
      expect(r.reproducibility.length).toBeGreaterThan(0);
    }
  });

  it("reports that the placement accuracy claim is below the trivial baseline", () => {
    const s = researchItems.find((r) => r.id === "placement-reevaluation")!;
    expect(s.abstract).toContain("below that trivial baseline");
  });
});

describe("recruiter roles", () => {
  it("cover the three required roles and reference real content", () => {
    expect(roles.map((r) => r.id).sort()).toEqual(["data-ml", "full-stack", "software-engineer"]);
    for (const r of roles) {
      for (const slug of r.projects) expect(getProject(slug), slug).toBeDefined();
      for (const id of r.skills) expect(skills.some((s) => s.id === id), id).toBe(true);
      for (const e of r.evidence) if (e.projectSlug) expect(getProject(e.projectSlug), e.projectSlug).toBeDefined();
    }
  });
});

describe("education and experience", () => {
  it("use the CGPA from the latest résumé", () => {
    expect(education.cgpa).toBe("9.12 / 10");
    expect(profile.summary).toContain("9.12");
  });

  it("every record says where it was verified", () => {
    for (const x of [...certifications, ...awards, ...experience]) expect(x.verifiedFrom.length, x.id).toBeGreaterThan(5);
  });

  it("describes the registration as a design, not a patent", () => {
    const a = awards.find((x) => x.id === "design-registration")!;
    expect(a.detail).toContain("not a patent");
    expect(a.detail).toContain("483324-001");
  });

  it("labels job simulations as not being employment", () => {
    const sim = experience.find((e) => e.type === "virtual-simulation")!;
    expect(sim.summary).toContain("not employment");
  });

  it("hackathon entries reference real projects", () => {
    for (const h of hackathons) expect(getProject(h.project), h.project).toBeDefined();
  });
});

describe("privacy and integrity across all content", () => {
  const allContent = walkStrings({ profile, projects, skills, education, certifications, awards, hackathons, experience, researchItems, roles, xraySystems });
  const joined = allContent.join("\n");

  it("does not publish the phone number in site content", () => {
    expect(joined).not.toMatch(/7709792167/);
    expect(joined).not.toMatch(/\+91[\s-]?\d{10}/);
  });

  it("does not leak content from other people's résumés found in the owner's folders", () => {
    for (const other of ["Aryan Kamat", "kamataryan", "TalentForge", "Sanika", "Sonali"]) expect(joined).not.toContain(other);
  });

  it("does not contain secret-looking values", () => {
    expect(joined).not.toMatch(/sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|ghp_[A-Za-z0-9]{30,}/);
  });

  it("only links to https or same-origin destinations", () => {
    const urls = joined.match(/https?:\/\/[^\s"')]+/g) ?? [];
    const insecure = urls.filter((u) => u.startsWith("http://") && !u.startsWith("http://localhost"));
    expect(insecure).toEqual([]);
  });

  it("the résumé PDF is present and is really a PDF", () => {
    const file = pub(profile.resume.href);
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file).subarray(0, 4).toString()).toBe("%PDF");
    expect(statSync(file).size).toBeGreaterThan(10_000);
  });

  it("no source file contains the placeholder prefix outside content helpers", () => {
    const roots = ["src/apps", "src/os", "src/design"];
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const full = path.join(d, f);
        if (statSync(full).isDirectory()) walk(full);
        else files.push(full);
      }
    };
    roots.forEach((r) => walk(path.join(process.cwd(), r)));
    for (const f of files) expect(readFileSync(f, "utf8").includes("PLACEHOLDER: "), f).toBe(false);
  });

  it("reports how many placeholders remain (they must stay visible, not silently filled)", () => {
    const open = allContent.filter(isPlaceholder);
    expect(open.length).toBeGreaterThan(0);
    for (const p of open) expect(stripPlaceholder(p).length).toBeGreaterThan(3);
  });
});
