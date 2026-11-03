import { isAppId, type AppId } from "./apps";

export type Intent =
  | { type: "desktop" }
  | { type: "app"; app: AppId; params?: Record<string, string> };

/** URL for the focused window. Home lives at the root. */
export function intentToPath(intent: Intent): string {
  if (intent.type === "desktop") return "/";
  if (intent.app === "home") return "/";
  if (intent.app === "projects" && intent.params?.slug) return `/projects/${encodeURIComponent(intent.params.slug)}`;
  if (intent.app === "xray" && intent.params?.system) return `/xray?system=${encodeURIComponent(intent.params.system)}`;
  if (intent.app === "recruiter" && intent.params?.role) return `/recruiter?role=${encodeURIComponent(intent.params.role)}`;
  return `/${intent.app}`;
}

export function pathToIntent(pathname: string, search = ""): Intent {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/") return { type: "desktop" };
  const parts = clean.split("/").filter(Boolean).map((p) => decodeURIComponent(p));
  const [first, second] = parts;
  if (!first || !isAppId(first)) return { type: "desktop" };
  const query = new URLSearchParams(search);
  if (first === "projects" && second) return { type: "app", app: "projects", params: { slug: second } };
  if (first === "xray" && query.get("system")) return { type: "app", app: "xray", params: { system: query.get("system")! } };
  if (first === "recruiter" && query.get("role")) return { type: "app", app: "recruiter", params: { role: query.get("role")! } };
  return { type: "app", app: first };
}
