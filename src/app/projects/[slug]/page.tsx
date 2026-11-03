import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject, projects } from "@/content/projects";
import ProjectsApp from "@/apps/projects/ProjectsApp";
import { OSRoot } from "@/os/OSRoot";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: `${project.title} — case study`,
    description: project.tagline,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "article",
      title: `${project.title} — SHIVAM.OS`,
      description: project.tagline,
      url: `/projects/${project.slug}`,
      images: project.media.cover ? [{ url: project.media.cover.src, width: project.media.cover.width, height: project.media.cover.height, alt: project.media.cover.alt }] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getProject(slug)) notFound();
  return <OSRoot intent={{ type: "app", app: "projects", params: { slug } }} initialContent={<ProjectsApp params={{ slug }} windowId="win-projects" />} />;
}
