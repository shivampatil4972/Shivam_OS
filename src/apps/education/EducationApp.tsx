"use client";

import { Award, GraduationCap, Medal, Trophy } from "lucide-react";
import { awards, certifications, education, hackathons } from "@/content/education";
import { getProject } from "@/content/projects";
import { Badge, Chip, ExternalLink, Txt } from "@/design/ui";
import { useOS } from "@/os/OSContext";
import { AppScroll, Section, formatMonth } from "../shared";

const KIND_LABEL = { course: "Course", "job-simulation": "Job simulation", badge: "Badge", assessment: "Assessment" } as const;

export default function EducationApp() {
  const { open } = useOS();
  return (
    <AppScroll>
      <h3 className="font-display text-2xl font-semibold text-fg">Education & credentials</h3>

      <section aria-labelledby="edu-degree" className="card mt-4 flex gap-4 p-5">
        <GraduationCap className="mt-1 size-8 shrink-0 text-accent-text" aria-hidden />
        <div>
          <h4 id="edu-degree" className="font-display text-lg font-semibold text-fg">
            {education.degree}
          </h4>
          <p className="text-[14px] text-fg">{education.institution}</p>
          <p className="text-[13px] text-muted">
            <Txt>{education.university}</Txt>
          </p>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[13.5px]">
            <div>
              <dt className="inline text-subtle">Period: </dt>
              <dd className="inline text-fg">{education.period}</dd>
            </div>
            <div>
              <dt className="inline text-subtle">Graduation: </dt>
              <dd className="inline text-fg">{education.graduation}</dd>
            </div>
            <div>
              <dt className="inline text-subtle">CGPA: </dt>
              <dd className="inline font-semibold text-fg">{education.cgpa}</dd>
            </div>
          </dl>
          <p className="mt-1 text-[12px] text-subtle">Source: {education.cgpaSource}</p>
        </div>
      </section>

      <Section title="Foundations and coursework" id="edu-coursework">
        <div className="flex flex-wrap gap-1.5">
          {education.foundations.map((f) => (
            <Chip key={f}>{f}</Chip>
          ))}
        </div>
        <p className="mt-2 text-[14px]">
          <Txt>{education.coursework[0]!}</Txt>
        </p>
      </Section>

      <Section title="Academic projects" id="edu-projects">
        <div className="flex flex-wrap gap-1.5">
          {education.academicProjects.map((slug) => (
            <Chip key={slug} onClick={() => open("projects", { slug })}>
              {getProject(slug)?.title ?? slug}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="School" id="edu-school">
        <ul className="space-y-1 text-[14px] text-fg">
          {education.school.map((s) => (
            <li key={s.level}>
              {s.level} — {s.year} <span className="text-[12px] text-subtle">({s.source})</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Awards and recognition" id="edu-awards">
        <ul className="grid gap-2 sm:grid-cols-2">
          {awards.map((a) => (
            <li key={a.id} className="card flex gap-3 p-3.5">
              <Trophy className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
              <div>
                <p className="font-semibold text-fg">{a.title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
                  <Txt>{a.detail}</Txt>
                </p>
                <p className="mt-1 text-[12px] text-subtle">
                  <Txt>{a.date}</Txt> · {a.verifiedFrom}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Certifications" id="edu-certs">
        <ul className="divide-y divide-hairline rounded-xl border border-hairline">
          {certifications.map((c) => (
            <li key={c.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
              <Award className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-fg">{c.title}</p>
                <p className="text-[13px] text-muted">
                  {c.issuer}
                  {c.date !== "undated" && ` · ${formatMonth(c.date)}`}
                </p>
                {c.id === "aws-academy-ml" && (
                  <p className="mt-0.5 text-[13px]">
                    <ExternalLink href="https://www.credly.com/go/inaI0ENY">Verify on Credly</ExternalLink>
                  </p>
                )}
              </div>
              <div className="flex gap-1.5">
                <Badge>{KIND_LABEL[c.kind]}</Badge>
                {!c.onResume && <Badge tone="info">Not on résumé</Badge>}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[12.5px] text-subtle">Certificates are listed only where the résumé or a certificate file confirms them. Course certificates show completion, not a measured skill level.</p>
      </Section>

      <Section title="Hackathons" id="edu-hackathons">
        <ul className="grid gap-2 sm:grid-cols-2">
          {hackathons.map((h) => (
            <li key={h.name} className="card p-3.5">
              <div className="flex items-start gap-3">
                <Medal className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden />
                <div>
                  <p className="font-semibold text-fg">{h.name}</p>
                  <p className="text-[13px] text-muted">{h.date}</p>
                  <button type="button" onClick={() => open("projects", { slug: h.project })} className="mt-1 text-[13px] font-medium text-accent-text underline underline-offset-2">
                    {getProject(h.project)?.title}
                  </button>
                  <p className="mt-1 text-[13px]">
                    <Txt>{h.result}</Txt>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Research experience" id="edu-research">
        <p className="text-[14px] text-fg">
          Simulation-based research inside the JOURNEX final-year project and engineering benchmarks in IntelliGrade AI.{" "}
          <button type="button" onClick={() => open("research")} className="font-medium text-accent-text underline underline-offset-2">
            Open the Research Lab
          </button>
        </p>
      </Section>
    </AppScroll>
  );
}
