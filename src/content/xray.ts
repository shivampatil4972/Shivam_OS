import type { XrayNode, XrayEdge, XraySystem, XraySystemInput, XrayStatus } from "./xraySchema";

export type { XrayEdge, XrayNode, XrayStatus, XraySystem };

const vayora = (p: string) => `https://github.com/shivampatil4972/VAYORA-/tree/HEAD/${p}`;

export const rawXraySystems: XraySystemInput[] = [
  {
    id: "journex",
    projectSlug: "journex",
    title: "JOURNEX — four services, one placement rule",
    summary: "Spring Boot owns transactions and truth, FastAPI owns inference and holds no state, Express owns ephemeral streams, React renders.",
    rule: "No service forwards a request on another's behalf, and no entity lives in two stores.",
    sourceNote: "From docs/ARCHITECTURE.md and README.md in the public repository (read 2026-10-25).",
    nodes: [
      { id: "web", label: "web", kind: "client", tech: "React 18 · TypeScript · Vite · Tailwind", x: 130, y: 280, status: "implemented", responsibility: "Renders every screen in English, Hindi and Marathi. Holds only a session token.", interfaces: ["HTTPS → core-api", "WebSocket → gateway", "HTTPS → intel (admin what-if only)"], tests: "236 Vitest tests (screens, translations, money, dates)", source: vayora("web") },
      { id: "core", label: "core-api", kind: "service", tech: "Spring Boot 3 · Java 21 · JdbcTemplate · Flyway", x: 420, y: 200, status: "implemented", responsibility: "Every transaction and every fact: identity, rides, bookings, payments, ratings, moderation and the event log.", interfaces: ["REST + OpenAPI/Swagger", "Calls intel to score a booking"], data: ["PostgreSQL + PostGIS", "MongoDB", "Redis"], tests: "311 JUnit tests with Testcontainers (real PostGIS, MongoDB, Redis)", source: vayora("core-api"), tradeoff: "Hand-written SQL instead of an ORM so seat-taking is one readable conditional UPDATE." },
      { id: "intel", label: "intel", kind: "service", tech: "FastAPI · Python 3.11 · lifelines · OR-Tools", x: 700, y: 120, status: "implemented", responsibility: "Inference with no state: the booking-durability survival model, explanations, the CP-SAT contact scheduler and live what-if simulator runs.", interfaces: ["POST score", "Contact plans", "What-if runs (admin token checked by intel)"], tests: "Part of 206 Python tests", source: vayora("intel"), tradeoff: "Cox model served: best Brier/concordance of three, but violates proportional hazards for lead time." },
      { id: "gateway", label: "gateway", kind: "service", tech: "Express 4 · Socket.IO 4", x: 420, y: 420, status: "implemented", responsibility: "Ephemeral streams only: ride chat and live driver position. Asks core-api whether a user is on a ride.", interfaces: ["WebSocket (JWT verified)"], data: ["MongoDB"], tests: "28 tests with a real Socket.IO server and clients", source: vayora("gateway") },
      { id: "pg", label: "PostgreSQL + PostGIS", kind: "store", tech: "PostgreSQL 16 · PostGIS 3.4", x: 700, y: 300, status: "implemented", responsibility: "System of record: users, rides, routes, bookings, payments, ratings, moderation and the 22-type events table.", data: ["Append-only money ledger and audit log (database triggers)"] },
      { id: "mongo", label: "MongoDB", kind: "store", tech: "MongoDB 7", x: 700, y: 470, status: "implemented", responsibility: "Chat messages, GPS points and in-app notifications." },
      { id: "redis", label: "Redis", kind: "store", tech: "Redis 7", x: 880, y: 200, status: "implemented", responsibility: "Seat holds and route cache — all disposable; a hold never changes PostgreSQL's counts.", tradeoff: "A hold is a courtesy: not honoured while Redis is down." },
      { id: "osrm", label: "OSRM", kind: "external", tech: "OSRM · OpenStreetMap", x: 880, y: 390, status: "implemented", responsibility: "Road routes and footpath walking times on a clipped corridor graph." },
      { id: "sim", label: "SimPy simulator", kind: "research", tech: "SimPy · Python", x: 130, y: 470, status: "implemented", responsibility: "60 simulated days per run, 30 seeds per variant; writes the same event vocabulary as the platform.", tests: "Part of 206 Python tests", source: vayora("sim") },
      { id: "providers", label: "Payments · SMS · Calls", kind: "external", tech: "Razorpay · Twilio · SMTP", x: 130, y: 100, status: "simulated", responsibility: "Simulated by default (no money moves). Real providers switch on with credentials and are tested only against stand-ins." },
    ],
    edges: [
      { from: "web", to: "core", label: "HTTPS: facts" },
      { from: "web", to: "gateway", label: "WebSocket: chat, live position" },
      { from: "web", to: "intel", label: "Admin what-if" },
      { from: "core", to: "intel", label: "Score booking" },
      { from: "core", to: "pg", label: "Transactions + events" },
      { from: "core", to: "redis", label: "Holds, route cache" },
      { from: "core", to: "osrm", label: "Routes" },
      { from: "core", to: "mongo", label: "Notifications" },
      { from: "gateway", to: "mongo", label: "Chat, GPS" },
      { from: "gateway", to: "core", label: "Membership check" },
      { from: "sim", to: "pg", label: "Simulated events" },
      { from: "core", to: "providers", label: "Payments, codes, calls", status: "simulated" },
    ],
  },
  {
    id: "intelligrade",
    projectSlug: "intelligrade-ai",
    title: "IntelliGrade AI — the AI suggests, the teacher decides",
    summary: "The browser talks only to the backend; the AI service is internal, stateless and called with a service credential.",
    rule: "Nothing is published without a teacher's approval; model output is validated twice and never repaired.",
    sourceNote: "From docs/architecture.md, docs/ai-evaluation.md and docs/implementation-plan.md (local repository, 2026-10-15).",
    nodes: [
      { id: "spa", label: "frontend", kind: "client", tech: "React 19 · TypeScript · Vite · TanStack Query", x: 130, y: 280, status: "implemented", responsibility: "Teacher, student and administrator UI: upload, OCR correction, review, approval and results.", tests: "78 unit tests + 13 Playwright end-to-end tests" },
      { id: "api", label: "backend", kind: "service", tech: "Spring Boot 4.1 · Java 21 · Spring Security · JPA", x: 420, y: 280, status: "implemented", responsibility: "Public /api/v1, authorisation, domain state and job orchestration with a PostgreSQL queue (FOR UPDATE SKIP LOCKED, leases, bounded retries).", interfaces: ["/api/v1 (JWT)", "X-Service-Token → AI service"], tests: "112 tests with Testcontainers (pgvector)", tradeoff: "No broker until measurements show the need (ADR-007)." },
      { id: "ai", label: "ai-service", kind: "service", tech: "FastAPI · Python 3.12 · Pydantic", x: 700, y: 160, status: "implemented", responsibility: "OCR (PyMuPDF, OpenCV, Tesseract), question segmentation, chunking + local embeddings, rubric-grounded evaluation with strict validation.", interfaces: ["POST /internal/v1/ocr", "POST /internal/v1/segment", "POST /internal/v1/evaluate"], tests: "144 pytest tests + ruff" },
      { id: "db", label: "PostgreSQL + pgvector", kind: "store", tech: "PostgreSQL 16 · pgvector", x: 700, y: 400, status: "implemented", responsibility: "System of record, job queue and reference-chunk vectors; retrieval filtered by exam, question and rubric version before similarity.", tradeoff: "Exact search, not approximate: a scope filter plus ANN can return too few passages (ADR-027)." },
      { id: "storage", label: "Private document storage", kind: "store", tech: "Volume (read-only mount for AI)", x: 420, y: 470, status: "implemented", responsibility: "Uploaded answer sheets with generated keys and SHA-256; immutable after hand-in." },
      { id: "llm", label: "Claude provider", kind: "external", tech: "Anthropic API (adapter)", x: 900, y: 100, status: "unverified", responsibility: "Written and unit-tested against a stubbed client, but never called against the live API (no key supplied). A keyword-counting test adapter is the default." },
      { id: "analytics", label: "Analytics & job monitoring", kind: "service", tech: "Phase 6", x: 420, y: 90, status: "proposed", responsibility: "Examination analytics (backend started), administrator job monitoring and system-health screens — not built yet." },
    ],
    edges: [
      { from: "spa", to: "api", label: "/api/v1 (JWT)" },
      { from: "api", to: "ai", label: "OCR, segment, embed, evaluate" },
      { from: "api", to: "db", label: "Jobs, results, vectors" },
      { from: "api", to: "storage", label: "Store sheets" },
      { from: "ai", to: "storage", label: "Read by validated key" },
      { from: "ai", to: "llm", label: "System prompt + data", status: "unverified" },
      { from: "api", to: "analytics", label: "Planned", status: "proposed" },
    ],
  },
  {
    id: "support-triage",
    projectSlug: "support-triage-agent",
    title: "Support Triage AI — grounded or escalated",
    summary: "One Flask service: an in-memory BM25 index and a structured-output LLM step with a deterministic failure path.",
    rule: "If the model fails or the context does not contain the answer, the ticket escalates.",
    sourceNote: "From the local repository's code and README (hackathon project).",
    nodes: [
      { id: "ui", label: "Dashboard", kind: "client", tech: "HTML · CSS · JavaScript", x: 130, y: 280, status: "implemented", responsibility: "Ticket form, reasoning, response and retrieved context." },
      { id: "flask", label: "Flask server", kind: "service", tech: "Python · Flask", x: 420, y: 280, status: "implemented", responsibility: "API endpoint and CSV batch processor; builds the BM25 index at start-up." },
      { id: "bm25", label: "BM25 retriever", kind: "service", tech: "rank_bm25 · NLTK", x: 700, y: 160, status: "implemented", responsibility: "Cleans and chunks the Markdown support corpus; ranks chunks offline with BM25.", tradeoff: "Lexical retrieval misses paraphrases." },
      { id: "corpus", label: "Support corpus", kind: "store", tech: "Markdown files", x: 900, y: 280, status: "implemented", responsibility: "The help-centre corpus shipped with the hackathon starter." },
      { id: "gemini", label: "Gemini (structured output)", kind: "external", tech: "Google GenAI SDK · Pydantic", x: 700, y: 420, status: "implemented", responsibility: "Returns reasoning, product area, request type and status (replied | escalated); retries with backoff, escalates on failure." },
      { id: "eval", label: "Labelled evaluation set", kind: "research", tech: "—", x: 420, y: 470, status: "proposed", responsibility: "Not built: routing accuracy is unmeasured." },
    ],
    edges: [
      { from: "ui", to: "flask", label: "fetch() ticket" },
      { from: "flask", to: "bm25", label: "Query" },
      { from: "bm25", to: "corpus", label: "Index" },
      { from: "flask", to: "gemini", label: "Ticket + context" },
      { from: "eval", to: "flask", label: "Planned measurement", status: "proposed" },
    ],
  },
  {
    id: "placement-portal",
    projectSlug: "placement-prediction-portal",
    title: "Placement Portal — a Flask monolith with pickled models",
    summary: "Server-rendered Flask pages over MySQL; models load at start-up; ReportLab renders PDF reports.",
    rule: "Secrets in .env; the whole stack runs from docker compose.",
    sourceNote: "From the public repository's README and code.",
    nodes: [
      { id: "browser", label: "Browser", kind: "client", tech: "Jinja2 · Bootstrap 5 · Chart.js", x: 130, y: 280, status: "implemented", responsibility: "Profiles, predictions, what-if simulation, analytics and admin pages." },
      { id: "app", label: "Flask app", kind: "service", tech: "Python · Flask", x: 420, y: 280, status: "implemented", responsibility: "Auth, profiles, prediction routes, skill-gap analysis and admin panel.", tests: "6 pytest tests (ML utilities, résumé parser)" },
      { id: "ml", label: "ml_utils", kind: "service", tech: "scikit-learn · pandas", x: 700, y: 140, status: "implemented", responsibility: "Placement classifier and salary regressor trained on synthetic data.", tradeoff: "Synthetic data: predictions describe the generator, not real students." },
      { id: "parser", label: "Résumé parser", kind: "service", tech: "PyPDF2 · thefuzz", x: 700, y: 280, status: "implemented", responsibility: "Fuzzy skill extraction tolerant of typos and OCR artefacts." },
      { id: "mysql", label: "MySQL", kind: "store", tech: "MySQL 8", x: 700, y: 430, status: "implemented", responsibility: "Users, profiles and prediction history." },
      { id: "pdf", label: "ReportLab PDF", kind: "service", tech: "ReportLab", x: 420, y: 470, status: "implemented", responsibility: "Downloadable prediction and recommendation reports." },
    ],
    edges: [
      { from: "browser", to: "app", label: "HTTP (session)" },
      { from: "app", to: "ml", label: "Predict" },
      { from: "app", to: "parser", label: "Parse PDF" },
      { from: "app", to: "mysql", label: "Read / write" },
      { from: "app", to: "pdf", label: "Render report" },
    ],
  },
];

/** Applies the schema's defaults without shipping the validator to the browser. */
export const xraySystems: XraySystem[] = rawXraySystems.map((s) => ({
  ...s,
  nodes: s.nodes.map((n) => ({ ...n, interfaces: n.interfaces ?? [], data: n.data ?? [] })),
  edges: s.edges.map((e) => ({ ...e, status: e.status ?? "implemented" })),
}));

export const xrayStatusLabels: Record<XrayStatus, { label: string; description: string }> = {
  implemented: { label: "Implemented", description: "Built and covered by the project's tests or running code" },
  unverified: { label: "Unverified", description: "Built, but never exercised against the real service" },
  simulated: { label: "Simulated", description: "Runs against a simulated or stand-in provider" },
  proposed: { label: "Proposed", description: "Planned; not implemented yet" },
};
