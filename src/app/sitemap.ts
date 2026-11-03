import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { SITE_URL } from "@/lib/site";
import { APP_IDS } from "@/os/apps";

export default function sitemap(): MetadataRoute.Sitemap {
  const apps = APP_IDS.filter((id) => id !== "home").map((id) => ({
    url: `${SITE_URL}/${id}`,
    changeFrequency: "monthly" as const,
    priority: id === "projects" || id === "resume" ? 0.9 : 0.6,
  }));
  const caseStudies = projects.map((p) => ({
    url: `${SITE_URL}/projects/${p.slug}`,
    lastModified: p.updated,
    changeFrequency: "monthly" as const,
    priority: p.featured ? 0.8 : 0.5,
  }));
  return [{ url: SITE_URL, changeFrequency: "monthly", priority: 1 }, ...apps, ...caseStudies];
}
