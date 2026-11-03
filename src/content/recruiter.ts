export type RoleId = "full-stack" | "software-engineer" | "data-ml";

export interface RoleProfile {
  id: RoleId;
  title: string;
  pitch: string;
  projects: string[];
  skills: string[];
  evidence: Array<{ label: string; detail: string; projectSlug?: string; app?: "ai-lab" | "xray" | "research" | "quality" }>;
  questions: string[];
}

export const roles: RoleProfile[] = [
  {
    id: "full-stack",
    title: "Full-Stack Developer",
    pitch:
      "Builds complete products across React/TypeScript frontends, Spring Boot, Express and FastAPI backends, and relational databases — with role-based auth, payments-grade correctness and multilingual UIs.",
    projects: ["journex", "intelligrade-ai", "support-ticketing-tool", "indradhanu-institute"],
    skills: ["react", "typescript", "spring-boot", "node-express", "fastapi", "postgresql", "mysql", "auth", "rest-apis", "i18n"],
    evidence: [
      { label: "Concurrency-safe booking", detail: "Ride row lock + one conditional UPDATE; a test fires 8 concurrent requests for the last seat.", projectSlug: "journex" },
      { label: "Rotating refresh tokens", detail: "httpOnly SameSite=Strict cookies, hashed at rest, reuse detection revokes the session.", projectSlug: "indradhanu-institute" },
      { label: "Attachment authorisation", detail: "Files follow the same visibility rules as the ticket they belong to.", projectSlug: "support-ticketing-tool" },
      { label: "Architecture you can inspect", detail: "Open Engineering X-Ray to walk through services, stores and trade-offs.", app: "xray" },
    ],
    questions: ["How did you keep one entity out of two stores in JOURNEX?", "Why a PostgreSQL job queue instead of a broker?"],
  },
  {
    id: "software-engineer",
    title: "Software Engineer",
    pitch:
      "Cares about correctness, testing and honest documentation: hundreds of integration tests against real databases, ADRs for non-obvious decisions, and limitations written next to the results they qualify.",
    projects: ["journex", "intelligrade-ai", "support-ticketing-tool", "student-result-management-system"],
    skills: ["java", "python", "integration-testing", "e2e-testing", "docker", "github-actions", "dbms", "oop", "dsa", "git"],
    evidence: [
      { label: "781 tests across four suites", detail: "JOURNEX: JUnit with Testcontainers, pytest, Vitest and Socket.IO tests (last local run 2026-10-24).", projectSlug: "journex" },
      { label: "Bugs found by running the real stack", detail: "An HTTP/2 upgrade rejected by uvicorn, hidden by health checks, fixed by pinning HTTP/1.1.", projectSlug: "intelligrade-ai" },
      { label: "Write-once evaluations", detail: "Results stored in the transaction that completes the job; retries leave no partial result.", projectSlug: "intelligrade-ai" },
      { label: "This site's own quality report", detail: "Dated unit, end-to-end, accessibility and link checks.", app: "quality" },
    ],
    questions: ["Walk me through the SKIP LOCKED job queue and its failure modes.", "What would you change about the JOURNEX CI failure?"],
  },
  {
    id: "data-ml",
    title: "Data Science / ML Engineer",
    pitch:
      "Evaluation-first: survival models with censoring, simulation studies with seed-paired intervals, OCR and retrieval benchmarks, and the habit of putting a baseline next to every metric.",
    projects: ["journex", "placement-prediction-portal", "intelligrade-ai", "dypcet-placement-analytics"],
    skills: ["python", "survival-analysis", "statistics", "simulation", "scikit-learn", "ml-evaluation", "rag", "ocr", "power-bi", "pandas-numpy"],
    evidence: [
      { label: "A reported negative result", detail: "JOURNEX's intervention moves cancellations earlier but not completed rides — reported plainly with 95% intervals.", app: "research" },
      { label: "Live experiment with a baseline", detail: "Logistic regression vs majority class on the Placement Portal data, verified against scikit-learn.", app: "ai-lab" },
      { label: "OCR engine benchmark", detail: "Tesseract vs PaddleOCR vs RapidOCR: CER, WER, speed and memory, with caveats.", projectSlug: "intelligrade-ai" },
      { label: "Business intelligence", detail: "Power BI analysis of 3,998 students and 476 companies.", projectSlug: "dypcet-placement-analytics" },
    ],
    questions: ["Why is completed rides per 100 searches the right metric?", "How did you detect that the placement accuracy was below baseline?"],
  },
];
