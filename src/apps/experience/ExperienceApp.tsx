"use client";

import { Building2, Users } from "lucide-react";
import { experience } from "@/content/experience";
import { isPlaceholder } from "@/content/placeholder";
import { Badge, Chip, Txt } from "@/design/ui";
import { AppScroll, BulletList, formatMonth } from "../shared";

const TYPE_LABEL = { internship: "Internship", leadership: "Leadership", "virtual-simulation": "Virtual simulation", teaching: "Mentoring" } as const;

function period(start: string, end: string) {
  const fmt = (v: string) => (/^\d{4}-\d{2}$/.test(v) ? formatMonth(v) : v);
  if (isPlaceholder(start) || isPlaceholder(end)) return null;
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function ExperienceApp() {
  const work = experience.filter((e) => e.type === "internship" || e.type === "virtual-simulation");
  const leadership = experience.filter((e) => e.type === "leadership" || e.type === "teaching");
  return (
    <AppScroll>
      <h3 className="font-display text-2xl font-semibold text-fg">Experience</h3>
      <p className="mt-1 text-[14px] text-muted">Internships, leadership roles and job simulations. Simulations are labelled as learning programmes, not employment.</p>

      <h4 className="mt-6 mb-3 flex items-center gap-2 font-display text-[17px] font-semibold text-fg">
        <Building2 className="size-5 text-accent-text" aria-hidden /> Internships and simulations
      </h4>
      <ol className="relative space-y-4 border-l border-hairline-strong pl-6">
        {work.map((e) => (
          <Entry key={e.id} e={e} />
        ))}
      </ol>

      <h4 className="mt-8 mb-3 flex items-center gap-2 font-display text-[17px] font-semibold text-fg">
        <Users className="size-5 text-accent-text" aria-hidden /> Leadership and mentoring
      </h4>
      <ol className="relative space-y-4 border-l border-hairline-strong pl-6">
        {leadership.map((e) => (
          <Entry key={e.id} e={e} />
        ))}
      </ol>
    </AppScroll>
  );
}

function Entry({ e }: { e: (typeof experience)[number] }) {
  const when = period(e.start, e.end);
  return (
    <li className="relative">
      <span className="absolute top-2 -left-[31px] size-3 rounded-full bg-accent ring-4 ring-[var(--surface-solid)]" aria-hidden />
      <article className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h5 className="font-semibold text-fg">{e.role}</h5>
          <Badge tone={e.type === "virtual-simulation" ? "info" : "accent"}>{TYPE_LABEL[e.type]}</Badge>
        </div>
        <p className="text-[14px] text-fg">{e.organization}</p>
        <p className="text-[12.5px] text-subtle">
          {when ?? <Txt>{isPlaceholder(e.start) ? e.start : e.end}</Txt>} · <Txt>{e.location}</Txt>
        </p>
        <p className="mt-2 text-[14px] text-muted">{e.summary}</p>
        <BulletList className="mt-2" items={e.responsibilities} />
        {e.contributions.length > 0 && (
          <div className="mt-3">
            <p className="text-[11.5px] font-semibold tracking-wider text-subtle uppercase">Personal contributions</p>
            <BulletList className="mt-1" items={e.contributions} />
          </div>
        )}
        {e.outcomes.length > 0 && (
          <div className="mt-3">
            <p className="text-[11.5px] font-semibold tracking-wider text-subtle uppercase">Outcomes</p>
            <BulletList className="mt-1" items={e.outcomes} />
          </div>
        )}
        {e.lessons.length > 0 && (
          <div className="mt-3">
            <p className="text-[11.5px] font-semibold tracking-wider text-subtle uppercase">Lessons</p>
            <BulletList className="mt-1" items={e.lessons} />
          </div>
        )}
        {e.technologies.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {e.technologies.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        )}
        <p className="mt-3 text-[12px] text-subtle">Verified from: {e.verifiedFrom}</p>
      </article>
    </li>
  );
}
