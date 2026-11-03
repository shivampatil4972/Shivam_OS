import type { Metadata } from "next";
import ProjectsApp from "@/apps/projects/ProjectsApp";
import { APPS } from "@/os/apps";
import { OSRoot } from "@/os/OSRoot";

export const metadata: Metadata = {
  title: APPS.projects.title,
  description: APPS.projects.description,
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return <OSRoot intent={{ type: "app", app: "projects" }} initialContent={<ProjectsApp params={{}} windowId="win-projects" />} />;
}
