import type { Skill } from "./schema";

/**
 * Skills are evidenced, never self-rated.
 * evidenceLevel:
 *   shipped    — used in a completed or published project
 *   project    — used in a project still in development
 *   certified  — backed by a certificate, without project evidence here
 *   coursework — studied as part of the degree
 *   listed     — on the résumé; no project evidence in this portfolio yet
 * `projects` holds project slugs; tests check every slug exists.
 */
export const rawSkills: Array<Omit<Skill, "certifications"> & { certifications?: string[] }> = [
  // Languages
  { id: "python", name: "Python", group: "languages", evidenceLevel: "shipped", projects: ["journex", "intelligrade-ai", "placement-prediction-portal", "support-triage-agent", "neuroroute-ai", "academic-feedback-system"] },
  { id: "java", name: "Java", group: "languages", evidenceLevel: "project", projects: ["journex", "intelligrade-ai", "indradhanu-institute"], certifications: ["dsa-java"] },
  { id: "typescript", name: "TypeScript", group: "languages", evidenceLevel: "project", projects: ["journex", "intelligrade-ai", "indradhanu-institute"] },
  { id: "javascript", name: "JavaScript", group: "languages", evidenceLevel: "shipped", projects: ["support-ticketing-tool", "support-triage-agent", "bachat-gat-management-system", "student-result-management-system"] },
  { id: "sql", name: "SQL", group: "languages", evidenceLevel: "shipped", projects: ["journex", "support-ticketing-tool", "bachat-gat-management-system", "placement-prediction-portal"] },
  { id: "cpp", name: "C++", group: "languages", evidenceLevel: "shipped", projects: ["student-result-management-system"] },
  { id: "php", name: "PHP", group: "languages", evidenceLevel: "shipped", projects: ["bachat-gat-management-system"] },

  // Frontend
  { id: "react", name: "React", group: "frontend", evidenceLevel: "shipped", projects: ["journex", "intelligrade-ai", "support-ticketing-tool", "indradhanu-institute"] },
  { id: "tailwind", name: "Tailwind CSS", group: "frontend", evidenceLevel: "project", projects: ["journex", "intelligrade-ai", "indradhanu-institute"] },
  { id: "html-css", name: "HTML5 & CSS3", group: "frontend", evidenceLevel: "shipped", projects: ["support-triage-agent", "student-result-management-system", "bachat-gat-management-system"] },
  { id: "bootstrap", name: "Bootstrap", group: "frontend", evidenceLevel: "shipped", projects: ["placement-prediction-portal", "bachat-gat-management-system", "academic-feedback-system"] },
  { id: "i18n", name: "Internationalisation (EN/HI/MR)", group: "frontend", evidenceLevel: "project", projects: ["journex", "indradhanu-institute"] },

  // Backend
  { id: "spring-boot", name: "Spring Boot", group: "backend", evidenceLevel: "project", projects: ["journex", "intelligrade-ai", "indradhanu-institute"] },
  { id: "node-express", name: "Node.js & Express", group: "backend", evidenceLevel: "shipped", projects: ["support-ticketing-tool", "journex"] },
  { id: "fastapi", name: "FastAPI", group: "backend", evidenceLevel: "shipped", projects: ["journex", "intelligrade-ai", "academic-feedback-system"] },
  { id: "flask", name: "Flask", group: "backend", evidenceLevel: "shipped", projects: ["placement-prediction-portal", "support-triage-agent"] },
  { id: "rest-apis", name: "REST API design", group: "backend", evidenceLevel: "shipped", projects: ["journex", "intelligrade-ai", "support-ticketing-tool", "academic-feedback-system"] },
  { id: "auth", name: "Authentication & RBAC", group: "backend", evidenceLevel: "shipped", projects: ["journex", "intelligrade-ai", "support-ticketing-tool", "indradhanu-institute", "academic-feedback-system"] },
  { id: "websockets", name: "WebSockets (Socket.IO)", group: "backend", evidenceLevel: "project", projects: ["journex"] },

  // Databases
  { id: "postgresql", name: "PostgreSQL", group: "databases", evidenceLevel: "project", projects: ["journex", "intelligrade-ai", "indradhanu-institute"] },
  { id: "postgis", name: "PostGIS", group: "databases", evidenceLevel: "project", projects: ["journex"] },
  { id: "pgvector", name: "pgvector", group: "databases", evidenceLevel: "project", projects: ["intelligrade-ai"] },
  { id: "mysql", name: "MySQL", group: "databases", evidenceLevel: "shipped", projects: ["support-ticketing-tool", "placement-prediction-portal", "bachat-gat-management-system", "academic-feedback-system"] },
  { id: "mongodb", name: "MongoDB", group: "databases", evidenceLevel: "project", projects: ["journex"] },
  { id: "redis", name: "Redis", group: "databases", evidenceLevel: "project", projects: ["journex"] },
  { id: "sqlite", name: "SQLite", group: "databases", evidenceLevel: "shipped", projects: ["student-result-management-system"] },

  // Data science
  { id: "pandas-numpy", name: "pandas & NumPy", group: "data-science", evidenceLevel: "shipped", projects: ["placement-prediction-portal", "support-triage-agent"] },
  { id: "statistics", name: "Experimental design & statistics", group: "data-science", evidenceLevel: "project", projects: ["journex"], note: "Paired comparisons over 30 seeds with 95% intervals." },
  { id: "simulation", name: "Discrete-event simulation (SimPy)", group: "data-science", evidenceLevel: "project", projects: ["journex"] },
  { id: "power-bi", name: "Power BI, DAX & Power Query", group: "data-science", evidenceLevel: "shipped", projects: ["dypcet-placement-analytics", "phonepe-analytics", "starbucks-analytics"], certifications: ["power-bi-bi"] },
  { id: "tableau", name: "Tableau", group: "data-science", evidenceLevel: "shipped", projects: ["road-accident-analysis"] },
  { id: "eda", name: "Exploratory data analysis", group: "data-science", evidenceLevel: "shipped", projects: ["dypcet-placement-analytics", "road-accident-analysis"], certifications: ["deloitte-data-analytics", "tata-genai-analytics"] },

  // AI / ML
  { id: "scikit-learn", name: "scikit-learn", group: "ai-ml", evidenceLevel: "shipped", projects: ["placement-prediction-portal"], certifications: ["aws-academy-ml"] },
  { id: "survival-analysis", name: "Survival analysis", group: "ai-ml", evidenceLevel: "project", projects: ["journex"], note: "Cox proportional hazards and gradient-boosted survival models (lifelines)." },
  { id: "rag", name: "Retrieval-augmented generation", group: "ai-ml", evidenceLevel: "shipped", projects: ["support-triage-agent", "intelligrade-ai"] },
  { id: "llm-integration", name: "LLM integration & structured output", group: "ai-ml", evidenceLevel: "shipped", projects: ["support-triage-agent", "intelligrade-ai"] },
  { id: "ocr", name: "OCR (Tesseract, EasyOCR)", group: "ai-ml", evidenceLevel: "project", projects: ["intelligrade-ai", "neuroroute-ai"] },
  { id: "nlp", name: "NLP (BM25, TF-IDF, VADER)", group: "ai-ml", evidenceLevel: "shipped", projects: ["support-triage-agent", "neuroroute-ai", "academic-feedback-system"] },
  { id: "optimisation", name: "Optimisation (OR-Tools CP-SAT)", group: "ai-ml", evidenceLevel: "project", projects: ["journex"] },
  { id: "ml-evaluation", name: "Model evaluation & baselines", group: "ai-ml", evidenceLevel: "project", projects: ["journex", "intelligrade-ai", "placement-prediction-portal"] },

  // Cloud / DevOps
  { id: "docker", name: "Docker & Compose", group: "cloud-devops", evidenceLevel: "shipped", projects: ["journex", "intelligrade-ai", "placement-prediction-portal"] },
  { id: "github-actions", name: "GitHub Actions CI", group: "cloud-devops", evidenceLevel: "project", projects: ["journex"] },
  { id: "aws", name: "AWS fundamentals", group: "cloud-devops", evidenceLevel: "certified", projects: [], certifications: ["aws-prepinsta", "aws-academy-ml"] },

  // Testing
  { id: "integration-testing", name: "Integration testing (JUnit, Testcontainers)", group: "testing", evidenceLevel: "project", projects: ["journex", "intelligrade-ai"] },
  { id: "pytest", name: "pytest", group: "testing", evidenceLevel: "shipped", projects: ["intelligrade-ai", "placement-prediction-portal", "academic-feedback-system"] },
  { id: "e2e-testing", name: "End-to-end testing (Playwright)", group: "testing", evidenceLevel: "project", projects: ["intelligrade-ai"] },
  { id: "manual-qa", name: "Manual, functional & API testing", group: "testing", evidenceLevel: "certified", projects: [], certifications: ["qa-analyst"] },

  // Tools
  { id: "git", name: "Git & GitHub", group: "tools", evidenceLevel: "shipped", projects: ["journex", "intelligrade-ai", "placement-prediction-portal"] },
  { id: "postman", name: "Postman", group: "tools", evidenceLevel: "listed", projects: [] },
  { id: "ai-tools", name: "AI coding assistants", group: "tools", evidenceLevel: "project", projects: ["journex", "intelligrade-ai"], note: "Commits in these repositories are co-authored with Claude." },

  // CS foundations
  { id: "dsa", name: "Data structures & algorithms", group: "cs-foundations", evidenceLevel: "certified", projects: [], certifications: ["dsa-java", "dsa-service", "competitive-coding"] },
  { id: "oop", name: "Object-oriented programming", group: "cs-foundations", evidenceLevel: "shipped", projects: ["student-result-management-system", "journex"] },
  { id: "dbms", name: "DBMS & transactions", group: "cs-foundations", evidenceLevel: "project", projects: ["journex", "intelligrade-ai"], note: "Row locks, conditional updates, SKIP LOCKED job queues." },
  { id: "os-networks", name: "Operating systems & networks", group: "cs-foundations", evidenceLevel: "coursework", projects: ["student-result-management-system"] },
];

export const skills: Skill[] = rawSkills.map((s) => ({ ...s, certifications: s.certifications ?? [] }));

export const skillGroupLabels: Record<Skill["group"], string> = {
  languages: "Languages",
  frontend: "Frontend",
  backend: "Backend",
  databases: "Databases",
  "data-science": "Data science & analytics",
  "ai-ml": "AI & machine learning",
  "cloud-devops": "Cloud & DevOps",
  testing: "Testing & quality",
  tools: "Developer tools",
  "cs-foundations": "CS foundations",
};

export const evidenceLevelLabels: Record<Skill["evidenceLevel"], { label: string; description: string }> = {
  shipped: { label: "Shipped", description: "Used in a completed or published project" },
  project: { label: "In active project", description: "Used in a project still in development" },
  certified: { label: "Certified", description: "Backed by a certificate" },
  coursework: { label: "Coursework", description: "Studied in the degree, applied in a small project" },
  listed: { label: "Listed", description: "On the résumé; no project evidence here yet" },
};
