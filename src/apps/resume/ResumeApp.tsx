"use client";

import { Download, ExternalLink, Printer } from "lucide-react";
import { useState } from "react";
import { awards, certifications, education } from "@/content/education";
import { experience } from "@/content/experience";
import { profile } from "@/content/profile";
import { getProject } from "@/content/projects";
import { isPlaceholder } from "@/content/placeholder";
import { skillGroupLabels, skills } from "@/content/skills";
import { Button, LinkButton, TabPanel, Tabs } from "@/design/ui";
import { publishActivity } from "@/os/state/activity";
import { useMediaQuery } from "@/os/useMediaQuery";
import { formatDate } from "../shared";

const RESUME_PROJECTS = ["journex", "support-triage-agent", "dypcet-placement-analytics", "placement-prediction-portal", "intelligrade-ai"];

export default function ResumeApp() {
  // Most mobile browsers cannot render a PDF inside a frame, so phones start on the text version.
  const isPhone = useMediaQuery("(max-width: 767px)");
  const [chosen, setTab] = useState<"pdf" | "text" | null>(null);
  const tab = chosen ?? (isPhone ? "text" : "pdf");

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-4 py-3">
        <div className="mr-auto">
          <p className="font-semibold text-fg">{profile.resume.fileName}</p>
          <p className="text-[12.5px] text-muted">
            Updated {formatDate(profile.resume.updated)} · {profile.resume.pages} page · PDF
          </p>
        </div>
        <LinkButton
          href={profile.resume.href}
          download={profile.resume.fileName}
          external={false}
          variant="primary"
          className="h-9"
          onClick={() => publishActivity({ kind: "info", title: "Résumé download started", detail: profile.resume.fileName })}
        >
          <Download className="size-4" aria-hidden /> Download
        </LinkButton>
        <LinkButton href={profile.resume.href} external className="h-9">
          <ExternalLink className="size-4" aria-hidden /> Open PDF
        </LinkButton>
        <Button
          className="h-9"
          onClick={() => {
            setTab("text");
            requestAnimationFrame(() => window.print());
          }}
        >
          <Printer className="size-4" aria-hidden /> Print
        </Button>
      </div>
      <div className="px-4 pt-3">
        <Tabs
          label="Résumé format"
          idBase="resume"
          value={tab}
          onChange={setTab}
          items={[
            { id: "pdf", label: "PDF preview" },
            { id: "text", label: "Accessible text version" },
          ]}
        />
      </div>
      <div className="min-h-0 flex-1 p-4">
        {tab === "pdf" ? (
          <TabPanel idBase="resume" id="pdf" className="h-full">
            <iframe src={`${profile.resume.href}#view=FitH`} title={`Résumé of ${profile.name} (PDF)`} className="h-full min-h-[420px] w-full rounded-xl border border-hairline bg-white" />
          </TabPanel>
        ) : (
          <TabPanel idBase="resume" id="text" className="scroll-area h-full rounded-xl border border-hairline bg-white text-[#111827]">
            <ResumeText />
          </TabPanel>
        )}
      </div>
    </div>
  );
}

function ResumeText() {
  const groups = ["languages", "frontend", "backend", "databases", "ai-ml", "data-science", "cloud-devops", "testing"] as const;
  return (
    <article data-print-root className="mx-auto max-w-[760px] p-8 font-sans text-[13px] leading-relaxed text-[#111827]">
      <header className="border-b border-[#d1d5db] pb-3 text-center">
        <h3 className="text-[24px] font-bold tracking-wide">{profile.fullName.toUpperCase()}</h3>
        <p className="text-[14px]">{profile.roles.join(" | ")}</p>
        <p className="mt-1 text-[12.5px] text-[#374151]">
          {profile.email} · {profile.links.github.replace("https://", "")} · {profile.links.linkedin.replace("https://www.", "")} · {profile.location}
        </p>
      </header>
      <ResumeSection title="Summary">
        <p>{profile.summary}</p>
      </ResumeSection>
      <ResumeSection title="Education">
        <p className="font-semibold">{education.institution}</p>
        <p>
          {education.degree} | {education.period} | CGPA {education.cgpa}
        </p>
      </ResumeSection>
      <ResumeSection title="Experience">
        {experience
          .filter((e) => e.type === "internship")
          .map((e) => (
            <div key={e.id} className="mb-2">
              <p className="font-semibold">
                {e.organization} — {e.role}
              </p>
              <ul className="list-disc pl-5">
                {e.responsibilities.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          ))}
      </ResumeSection>
      <ResumeSection title="Projects">
        {RESUME_PROJECTS.map((slug) => getProject(slug))
          .filter((p) => p !== undefined)
          .map((p) => (
            <div key={p.slug} className="mb-2">
              <p className="font-semibold">{p.title}</p>
              <p className="text-[12px] text-[#4b5563] italic">{p.technologies.slice(0, 8).join(", ")}</p>
              <p>{p.tagline}</p>
            </div>
          ))}
      </ResumeSection>
      <ResumeSection title="Technical skills">
        <dl className="grid grid-cols-[150px_1fr] gap-x-3 gap-y-0.5">
          {groups.map((g) => (
            <div key={g} className="contents">
              <dt className="font-semibold">{skillGroupLabels[g]}</dt>
              <dd>
                {skills
                  .filter((s) => s.group === g)
                  .map((s) => s.name)
                  .join(", ")}
              </dd>
            </div>
          ))}
        </dl>
      </ResumeSection>
      <ResumeSection title="Achievements">
        <ul className="list-disc pl-5">
          {awards
            .filter((a) => !isPlaceholder(a.detail) || !isPlaceholder(a.title))
            .map((a) => (
              <li key={a.id}>{a.title}</li>
            ))}
        </ul>
      </ResumeSection>
      <ResumeSection title="Leadership">
        <ul className="list-disc pl-5">
          {profile.about.leadership.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </ResumeSection>
      <ResumeSection title="Certifications">
        <p>{certifications.map((c) => `${c.title} — ${c.issuer}`).join(" | ")}</p>
      </ResumeSection>
      <p className="mt-4 text-[11px] text-[#6b7280]">Generated from the same verified content as SHIVAM.OS. The PDF (updated {formatDate(profile.resume.updated)}) is the authoritative version.</p>
    </article>
  );
}

function ResumeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h4 className="mb-1 border-b border-[#d1d5db] text-[13px] font-bold tracking-wider text-[#1e3a5f] uppercase">{title}</h4>
      {children}
    </section>
  );
}
