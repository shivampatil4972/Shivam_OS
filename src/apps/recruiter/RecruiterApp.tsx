"use client";

import { ArrowRight, Download, Mail } from "lucide-react";
import { profile } from "@/content/profile";
import { getProject } from "@/content/projects";
import { roles, type RoleId } from "@/content/recruiter";
import { skills } from "@/content/skills";
import { Badge, Button, Chip, LinkButton, TabPanel, Tabs } from "@/design/ui";
import { useOS } from "@/os/OSContext";
import type { AppProps } from "@/os/WindowLayer";
import { AppScroll, ProjectCover, ProjectStatus } from "../shared";

export default function RecruiterApp({ params }: AppProps) {
  const { setParams, open } = useOS();
  const role = roles.find((r) => r.id === params.role) ?? roles[0]!;

  return (
    <AppScroll wide>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold tracking-wider text-accent-text uppercase">Recruiter Mode</p>
          <h3 className="font-display text-2xl font-semibold text-fg">{profile.name} for your role</h3>
          <p className="mt-1 max-w-2xl text-[14px] text-muted">Pick the role you are hiring for. Everything here links to verified evidence; the rest of the OS stays one click away.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={profile.resume.href} download={profile.resume.fileName} external={false} variant="primary" className="h-9">
            <Download className="size-4" aria-hidden /> Résumé
          </LinkButton>
          <Button className="h-9" onClick={(e) => open("contact", undefined, { trigger: e.currentTarget })}>
            <Mail className="size-4" aria-hidden /> Contact
          </Button>
        </div>
      </div>

      <Tabs
        className="mt-4"
        label="Role"
        idBase="recruiter"
        value={role.id}
        onChange={(id: RoleId) => setParams("recruiter", { role: id })}
        items={roles.map((r) => ({ id: r.id, label: r.title }))}
      />

      <TabPanel idBase="recruiter" id={role.id} className="mt-5">
        <p className="rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-[15px] leading-relaxed text-fg">{role.pitch}</p>

        <div className="mt-4 flex flex-wrap gap-2 text-[13px]">
          <Badge tone="success">{profile.availability.label}</Badge>
          <Badge>CGPA 9.12 / 10</Badge>
          <Badge>{profile.location}</Badge>
        </div>

        <h4 className="mt-6 mb-3 font-display text-[17px] font-semibold text-fg">Most relevant projects</h4>
        <ul className="grid gap-3 md:grid-cols-2">
          {role.projects
            .map((slug) => getProject(slug))
            .filter((p) => p !== undefined)
            .map((p) => (
              <li key={p.slug}>
                <button type="button" onClick={(e) => open("projects", { slug: p.slug }, { trigger: e.currentTarget })} className="card flex h-full w-full gap-3 overflow-hidden p-3 text-left transition-colors hover:bg-hover">
                  <ProjectCover project={p} className="aspect-[4/3] w-28 shrink-0 rounded-lg" sizes="112px" />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-fg">{p.title}</span>
                      <ProjectStatus project={p} />
                    </span>
                    <span className="mt-1 line-clamp-3 block text-[13px] text-muted">{p.tagline}</span>
                  </span>
                </button>
              </li>
            ))}
        </ul>

        <h4 className="mt-6 mb-3 font-display text-[17px] font-semibold text-fg">Evidence worth checking</h4>
        <ul className="grid gap-3 md:grid-cols-2">
          {role.evidence.map((ev) => (
            <li key={ev.label} className="card p-4">
              <p className="font-semibold text-fg">{ev.label}</p>
              <p className="mt-1 text-[13.5px] text-muted">{ev.detail}</p>
              <button
                type="button"
                onClick={(e) => (ev.app ? open(ev.app, undefined, { trigger: e.currentTarget }) : ev.projectSlug && open("projects", { slug: ev.projectSlug }, { trigger: e.currentTarget }))}
                className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-accent-text"
              >
                Inspect <ArrowRight className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>

        <h4 className="mt-6 mb-3 font-display text-[17px] font-semibold text-fg">Key skills</h4>
        <div className="flex flex-wrap gap-1.5">
          {role.skills.map((id) => {
            const s = skills.find((x) => x.id === id);
            return s ? (
              <Chip key={id} onClick={() => open("skills", { skill: id })}>
                {s.name}
              </Chip>
            ) : null;
          })}
        </div>

        <h4 className="mt-6 mb-2 font-display text-[17px] font-semibold text-fg">Good interview questions</h4>
        <ul className="space-y-1.5 text-[14px] text-fg">
          {role.questions.map((q) => (
            <li key={q}>“{q}”</li>
          ))}
        </ul>
      </TabPanel>
    </AppScroll>
  );
}
