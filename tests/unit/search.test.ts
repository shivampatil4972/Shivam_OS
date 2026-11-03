import { describe, expect, it } from "vitest";
import { projects } from "@/content/projects";
import { DEFAULT_PROJECT_QUERY, filterProjects } from "@/lib/projectFilter";
import { isSubsequence, normalize, search, type SearchEntry } from "@/lib/search";
import { buildSearchIndex, SUGGESTED_IDS } from "@/lib/searchIndex";

const entries: SearchEntry<string>[] = [
  { id: "a", group: "Apps", title: "Projects", keywords: ["work"], action: "a", boost: 10 },
  { id: "b", group: "Projects", title: "Placement Portal", subtitle: "Flask and MySQL", keywords: ["python"], action: "b" },
  { id: "c", group: "Skills", title: "PostgreSQL", keywords: ["database"], action: "c" },
];

describe("search", () => {
  it("normalizes accents and punctuation", () => {
    expect(normalize("Résumé — PDF!")).toBe("resume pdf");
    expect(normalize("C++ & Node.js")).toBe("c++ node.js");
  });

  it("detects subsequences", () => {
    expect(isSubsequence("pgs", "postgresql")).toBe(true);
    expect(isSubsequence("zzz", "postgresql")).toBe(false);
  });

  it("returns nothing for an empty query", () => {
    expect(search(entries, "   ")).toEqual([]);
  });

  it("ranks title prefixes above weaker matches", () => {
    const r = search(entries, "p");
    expect(r[0]!.id).toBe("a");
    expect(r.map((x) => x.id)).toContain("c");
  });

  it("matches keywords and subtitles", () => {
    expect(search(entries, "python").map((x) => x.id)).toEqual(["b"]);
    expect(search(entries, "mysql").map((x) => x.id)).toEqual(["b"]);
  });

  it("requires every token to match", () => {
    expect(search(entries, "placement mysql").map((x) => x.id)).toEqual(["b"]);
    expect(search(entries, "placement database")).toEqual([]);
  });

  it("tolerates small typos through subsequence matching", () => {
    expect(search(entries, "postgrsql").map((x) => x.id)).toContain("c");
  });

  it("respects the limit", () => {
    expect(search(entries, "p", 1)).toHaveLength(1);
  });
});

describe("the OS search index", () => {
  const index = buildSearchIndex();

  it("has unique ids", () => {
    const ids = index.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("finds apps, projects, skills, research and actions", () => {
    expect(search(index, "journex")[0]!.id).toBe("project-journex");
    expect(search(index, "resume").some((e) => e.id === "act-resume")).toBe(true);
    expect(search(index, "postgis").some((e) => e.id === "skill-postgis")).toBe(true);
    expect(search(index, "survival").some((e) => e.group === "Skills")).toBe(true);
    expect(search(index, "ocr engine").some((e) => e.id === "research-intelligrade-ocr-benchmark")).toBe(true);
    expect(search(index, "recruiter").some((e) => e.id === "app-recruiter")).toBe(true);
  });

  it("every suggested entry exists", () => {
    for (const id of SUGGESTED_IDS) expect(index.some((e) => e.id === id)).toBe(true);
  });
});

describe("project filtering", () => {
  const q = DEFAULT_PROJECT_QUERY;

  it("returns everything by default, featured first and in rank order", () => {
    const r = filterProjects(projects, q);
    expect(r).toHaveLength(projects.length);
    expect(r[0]!.slug).toBe("journex");
    const firstNon = r.findIndex((p) => !p.featured);
    expect(r.slice(firstNon).every((p) => !p.featured)).toBe(true);
  });

  it("filters by category including secondary categories", () => {
    const r = filterProjects(projects, { ...q, category: "research" });
    expect(r.map((p) => p.slug)).toContain("journex");
    expect(r.every((p) => p.category === "research" || p.secondaryCategories.includes("research"))).toBe(true);
  });

  it("filters by status", () => {
    const r = filterProjects(projects, { ...q, status: "hackathon" });
    expect(r.map((p) => p.slug).sort()).toEqual(["neuroroute-ai", "support-triage-agent"]);
  });

  it("filters by exact technology", () => {
    const r = filterProjects(projects, { ...q, tech: "Tableau" });
    expect(r.map((p) => p.slug)).toEqual(["road-accident-analysis"]);
  });

  it("searches text across title, summary and technologies", () => {
    expect(filterProjects(projects, { ...q, text: "kolhapur pune" }).map((p) => p.slug)).toContain("journex");
    expect(filterProjects(projects, { ...q, text: "tesseract" }).map((p) => p.slug)).toEqual(expect.arrayContaining(["intelligrade-ai", "neuroroute-ai"]));
    expect(filterProjects(projects, { ...q, text: "tableau" }).map((p) => p.slug)).toEqual(["road-accident-analysis"]);
    expect(filterProjects(projects, { ...q, text: "no-such-thing-xyz" })).toEqual([]);
  });

  it("combines filters", () => {
    const r = filterProjects(projects, { ...q, category: "full-stack", tech: "MySQL" });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((p) => p.technologies.includes("MySQL"))).toBe(true);
  });

  it("sorts by title and by recency, with ongoing work first", () => {
    const titles = filterProjects(projects, { ...q, sort: "title" }).map((p) => p.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
    const recent = filterProjects(projects, { ...q, sort: "newest" });
    expect(recent[0]!.period.end).toBe("ongoing");
  });
});
