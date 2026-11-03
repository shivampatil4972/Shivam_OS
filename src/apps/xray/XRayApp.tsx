"use client";

import { getProject } from "@/content/projects";
import { xraySystems } from "@/content/xray";
import { Button, TabPanel, Tabs } from "@/design/ui";
import { useOS } from "@/os/OSContext";
import type { AppProps } from "@/os/WindowLayer";
import { AppScroll } from "../shared";
import { XRayDiagram } from "./XRayDiagram";

export default function XRayApp({ params }: AppProps) {
  const { setParams, open } = useOS();
  const current = xraySystems.find((s) => s.id === params.system) ?? xraySystems[0]!;
  const project = getProject(current.projectSlug);

  return (
    <AppScroll wide>
      <div className="mb-4">
        <h3 className="font-display text-2xl font-semibold text-fg">Engineering X-Ray</h3>
        <p className="mt-1 max-w-3xl text-[14px] text-muted">
          Real components, interfaces, stores and tests — with anything simulated, unverified or merely proposed marked as such. Select a component to see its responsibility, tests, trade-offs and source.
        </p>
      </div>
      <Tabs
        label="Systems"
        idBase="xray"
        value={current.id}
        onChange={(id) => setParams("xray", { system: id })}
        items={xraySystems.map((s) => ({ id: s.id, label: getProject(s.projectSlug)?.title ?? s.id }))}
      />
      <TabPanel idBase="xray" id={current.id} className="mt-4">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <h4 className="font-display text-lg font-semibold text-fg">{current.title}</h4>
            <p className="mt-1 text-[14px] text-muted">{current.summary}</p>
            <p className="mt-2 rounded-lg border-l-2 border-accent bg-accent-soft px-3 py-1.5 text-[13.5px] text-fg">
              <span className="font-semibold">Rule: </span>
              {current.rule}
            </p>
          </div>
          {project && (
            <Button size="sm" onClick={(e) => open("projects", { slug: project.slug }, { trigger: e.currentTarget })}>
              Read the case study
            </Button>
          )}
        </div>
        <XRayDiagram key={current.id} system={current} />
        <p className="mt-3 text-[12.5px] text-subtle">Source: {current.sourceNote}</p>
      </TabPanel>
    </AppScroll>
  );
}
