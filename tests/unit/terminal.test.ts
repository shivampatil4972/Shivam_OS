import { describe, expect, it } from "vitest";
import { projects } from "@/content/projects";
import { COMMANDS, complete, execute, suggest, tokenize } from "@/lib/terminal";

describe("terminal parsing", () => {
  it("tokenizes words and quoted strings", () => {
    expect(tokenize("open  xray")).toEqual(["open", "xray"]);
    expect(tokenize(`projects "placement portal"`)).toEqual(["projects", "placement portal"]);
    expect(tokenize("   ")).toEqual([]);
  });

  it("ignores empty input", () => {
    expect(execute("   ")).toEqual({ lines: [] });
  });

  it("is case-insensitive for command names", () => {
    expect(execute("HELP").error).toBeUndefined();
  });
});

describe("required commands", () => {
  it.each(["help", "about", "projects", "skills", "education", "experience", "research", "resume", "contact"])("%s produces output", (cmd) => {
    const out = execute(cmd);
    expect(out.error).toBeUndefined();
    expect(out.lines.join("\n").length).toBeGreaterThan(10);
  });

  it("help lists every command", () => {
    const text = execute("help").lines.join("\n");
    for (const c of Object.keys(COMMANDS)) expect(text).toContain(c);
  });

  it("projects lists all projects by slug", () => {
    const text = execute("projects").lines.join("\n");
    for (const p of projects) expect(text).toContain(p.slug);
  });

  it("contact shows the email and profile links", () => {
    const text = execute("contact").lines.join("\n");
    expect(text).toContain("@gmail.com");
    expect(text).toContain("github.com/shivampatil4972");
  });

  it("never prints placeholder markers", () => {
    for (const cmd of ["about", "experience", "education", "research"]) {
      expect(execute(cmd).lines.join("\n")).not.toContain("PLACEHOLDER:");
    }
  });
});

describe("effects are returned as data", () => {
  it("projects <slug> opens the case study", () => {
    expect(execute("projects journex").effect).toEqual({ kind: "open", app: "projects", params: { slug: "journex" } });
  });

  it("projects matches partial names", () => {
    expect(execute("projects intelli").effect).toMatchObject({ params: { slug: "intelligrade-ai" } });
  });

  it("open launches known apps and rejects unknown ones", () => {
    expect(execute("open xray").effect).toEqual({ kind: "open", app: "xray" });
    const bad = execute("open nothing");
    expect(bad.error).toBe(true);
    expect(bad.effect).toBeUndefined();
  });

  it("theme validates its argument", () => {
    expect(execute("theme light").effect).toEqual({ kind: "theme", theme: "light" });
    expect(execute("theme neon").error).toBe(true);
  });

  it("resume opens by default and downloads with a flag", () => {
    expect(execute("resume").effect).toEqual({ kind: "open", app: "resume" });
    expect(execute("resume --download").effect).toMatchObject({ kind: "download" });
  });

  it("clear returns a clear effect", () => {
    expect(execute("clear").effect).toEqual({ kind: "clear" });
  });

  it("history prints what it is given", () => {
    expect(execute("history", ["about", "skills"]).lines.join("\n")).toContain("skills");
    expect(execute("history", []).lines[0]).toContain("no history");
  });
});

describe("safety and errors", () => {
  it("does not execute anything for shell-like input", () => {
    for (const cmd of ["rm -rf /", "sudo reboot", "bash", "eval 1+1"]) {
      const out = execute(cmd);
      expect(out.error).toBe(true);
      expect(out.effect).toBeUndefined();
      expect(out.lines[0]).toContain("not available");
    }
  });

  it("treats script injection as an unknown command", () => {
    const out = execute("<script>alert(1)</script>");
    expect(out.error).toBe(true);
    expect(out.effect).toBeUndefined();
  });

  it("gives helpful suggestions for typos", () => {
    expect(suggest("projcts")).toBe("projects");
    expect(execute("skils").lines[0]).toContain("skills");
    expect(execute("zzzzzzzz").lines[0]).toContain("command not found");
    expect(execute("zzzzzzzz").lines[1]).toContain("help");
  });

  it("reports missing and unknown arguments helpfully", () => {
    expect(execute("open").error).toBe(true);
    expect(execute("projects nosuchproject").error).toBe(true);
    expect(execute("skills nosuchgroup").error).toBe(true);
  });
});

describe("tab completion", () => {
  it("completes command names", () => {
    expect(complete("pro")).toEqual(["projects"]);
    expect(complete("")).toEqual(Object.keys(COMMANDS));
  });

  it("completes arguments", () => {
    expect(complete("open xr")).toEqual(["open xray"]);
    expect(complete("projects jour")).toEqual(["projects journex"]);
    expect(complete("theme li")).toEqual(["theme light"]);
  });

  it("offers nothing for commands without arguments", () => {
    expect(complete("about x")).toEqual([]);
  });
});
