/**
 * App registry: metadata only (no components), so state, routing, search and
 * tests can import it without pulling in any UI.
 */
export const APP_IDS = [
  "home",
  "projects",
  "ask",
  "about",
  "skills",
  "education",
  "experience",
  "research",
  "ai-lab",
  "xray",
  "github",
  "terminal",
  "resume",
  "contact",
  "settings",
  "quality",
  "recruiter",
] as const;

export type AppId = (typeof APP_IDS)[number];

export interface AppMeta {
  id: AppId;
  title: string;
  /** Fits under an icon on the phone home screen; the full title stays the accessible name. */
  shortTitle?: string;
  /** One line used in Spotlight, tooltips and metadata. */
  description: string;
  keywords: string[];
  size: { w: number; h: number };
  /** Position in the desktop dock; null keeps it out of the dock. */
  dock: number | null;
  /** Shown in the compact mobile dock. */
  mobileDock: boolean;
}

export const APPS: Record<AppId, AppMeta> = {
  home: { id: "home", title: "Home", description: "Who Shivam is, the flagship project and quick links.", keywords: ["intro", "welcome", "overview", "summary"], size: { w: 980, h: 660 }, dock: 1, mobileDock: false },
  projects: { id: "projects", title: "Projects", description: "Search, filter and read detailed engineering case studies.", keywords: ["case study", "portfolio", "work", "apps"], size: { w: 1120, h: 720 }, dock: 2, mobileDock: true },
  ask: { id: "ask", title: "Ask SHIVAM.OS", shortTitle: "Ask", description: "Ask a question; answers cite this portfolio's verified content.", keywords: ["ai", "assistant", "chat", "question", "claude", "answer"], size: { w: 820, h: 700 }, dock: 3, mobileDock: false },
  about: { id: "about", title: "About", description: "Engineering journey, interests and problem-solving philosophy.", keywords: ["bio", "profile", "story", "philosophy"], size: { w: 860, h: 640 }, dock: 4, mobileDock: false },
  skills: { id: "skills", title: "Skills", description: "Skills linked to evidence, with a proof-of-work graph.", keywords: ["stack", "technologies", "proof", "evidence", "graph"], size: { w: 1060, h: 700 }, dock: 5, mobileDock: false },
  education: { id: "education", title: "Education", description: "Degree, certifications, awards and hackathons.", keywords: ["degree", "college", "cgpa", "certificates", "awards", "credentials"], size: { w: 900, h: 660 }, dock: 6, mobileDock: false },
  experience: { id: "experience", title: "Experience", description: "Internships, leadership roles and job simulations.", keywords: ["internship", "work", "jobs", "leadership"], size: { w: 900, h: 660 }, dock: 7, mobileDock: false },
  research: { id: "research", title: "Research Lab", shortTitle: "Research", description: "Research questions, methods, results and limitations.", keywords: ["study", "paper", "experiment", "simulation", "benchmark"], size: { w: 1040, h: 720 }, dock: 8, mobileDock: false },
  "ai-lab": { id: "ai-lab", title: "AI Lab", description: "Run a bounded ML experiment on a real project's dataset.", keywords: ["machine learning", "playground", "model", "logistic regression", "baseline"], size: { w: 1120, h: 740 }, dock: 9, mobileDock: false },
  xray: { id: "xray", title: "Engineering X-Ray", shortTitle: "X-Ray", description: "Interactive architecture diagrams with sources and trade-offs.", keywords: ["architecture", "diagram", "system design", "components", "data flow"], size: { w: 1120, h: 720 }, dock: 10, mobileDock: false },
  github: { id: "github", title: "GitHub", description: "Public repositories, activity and README links.", keywords: ["repositories", "code", "source", "open source", "commits"], size: { w: 960, h: 680 }, dock: 11, mobileDock: false },
  terminal: { id: "terminal", title: "Terminal", description: "A safe terminal with predefined commands.", keywords: ["shell", "cli", "command line", "console"], size: { w: 760, h: 480 }, dock: 12, mobileDock: false },
  resume: { id: "resume", title: "Résumé", description: "Preview, download or print the résumé.", keywords: ["cv", "resume", "pdf", "download"], size: { w: 900, h: 760 }, dock: 13, mobileDock: true },
  contact: { id: "contact", title: "Contact", description: "Email, LinkedIn, GitHub and a message form.", keywords: ["email", "message", "hire", "reach", "linkedin"], size: { w: 760, h: 680 }, dock: 14, mobileDock: true },
  settings: { id: "settings", title: "Settings", description: "Theme, glass, accent, wallpaper, motion and dock.", keywords: ["preferences", "appearance", "theme", "dark mode", "wallpaper"], size: { w: 820, h: 640 }, dock: 16, mobileDock: false },
  quality: { id: "quality", title: "Quality Control", shortTitle: "Quality", description: "Dated test, accessibility, performance and link reports.", keywords: ["tests", "qa", "lighthouse", "accessibility", "ci", "reports"], size: { w: 980, h: 700 }, dock: 15, mobileDock: false },
  recruiter: { id: "recruiter", title: "Recruiter Mode", shortTitle: "Recruiter", description: "A role-focused summary for hiring teams.", keywords: ["hiring", "role", "fit", "recruiter", "summary"], size: { w: 960, h: 700 }, dock: null, mobileDock: false },
};

export const DOCK_APPS: AppId[] = APP_IDS.filter((id) => APPS[id].dock !== null).sort(
  (a, b) => (APPS[a].dock ?? 0) - (APPS[b].dock ?? 0),
);

export const MOBILE_DOCK_APPS: AppId[] = APP_IDS.filter((id) => APPS[id].mobileDock);

export function isAppId(value: string): value is AppId {
  return (APP_IDS as readonly string[]).includes(value);
}
