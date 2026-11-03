"use client";

import { Mail } from "lucide-react";
import Image from "next/image";
import { profile } from "@/content/profile";
import { GitHubGlyph, LinkedInGlyph } from "@/design/icons/Brand";
import { Badge, LinkButton, Txt } from "@/design/ui";
import { AppScroll, BulletList, Section } from "../shared";

export default function AboutApp() {
  const a = profile.about;
  return (
    <AppScroll>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Image src={profile.photo.src} alt={profile.photo.alt} width={112} height={112} className="size-28 rounded-full object-cover ring-1 ring-hairline-strong" />
        <div>
          <h3 className="font-display text-2xl font-semibold text-fg">About {profile.name}</h3>
          <p className="mt-1 text-[14px] text-muted">{profile.location}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile.languages.map((l) => (
              <Badge key={l}>{l}</Badge>
            ))}
          </div>
        </div>
      </header>

      <p className="mt-5 text-[15.5px] leading-relaxed text-fg">{a.intro}</p>

      <Section title="Engineering journey" id="about-journey">
        <ol className="relative space-y-3 border-l border-hairline-strong pl-5">
          {a.journey.map((step) => (
            <li key={step} className="relative text-[14.5px] leading-relaxed text-fg">
              <span className="absolute top-2 -left-[25px] size-2.5 rounded-full bg-accent ring-4 ring-[var(--surface-solid)]" aria-hidden />
              {step}
            </li>
          ))}
        </ol>
      </Section>

      <div className="grid gap-x-8 md:grid-cols-2">
        <Section title="Technical interests" id="about-interests">
          <BulletList items={[...a.interests]} />
        </Section>
        <Section title="How I solve problems" id="about-philosophy">
          <BulletList items={[...a.philosophy]} />
        </Section>
      </div>

      <div className="grid gap-x-8 md:grid-cols-2">
        <Section title="Learning goals" id="about-learning">
          <BulletList items={[...a.learningGoals]} />
        </Section>
        <Section title="Career direction" id="about-career">
          <p className="text-[14.5px] leading-relaxed text-fg">{a.careerDirection}</p>
        </Section>
      </div>

      <Section title="Leadership and community" id="about-leadership">
        <BulletList items={[...a.leadership]} />
      </Section>

      <Section title="Outside engineering" id="about-personal">
        {a.personal.map((p) => (
          <p key={p} className="text-[14.5px]">
            <Txt>{p}</Txt>
          </p>
        ))}
      </Section>

      <Section title="Elsewhere" id="about-links">
        <div className="flex flex-wrap gap-2">
          <LinkButton href={profile.links.github}>
            <GitHubGlyph /> GitHub
          </LinkButton>
          <LinkButton href={profile.links.linkedin}>
            <LinkedInGlyph /> LinkedIn
          </LinkButton>
          <LinkButton href={profile.links.leetcode}>LeetCode</LinkButton>
          <LinkButton href={`mailto:${profile.email}`} external={false}>
            <Mail className="size-4" aria-hidden /> {profile.email}
          </LinkButton>
        </div>
        <p className="mt-3 text-[12.5px] text-subtle">Facts on this page come from the {profile.sources.resume}.</p>
      </Section>
    </AppScroll>
  );
}
