import { placeholder } from "../placeholder";
import type { ProjectInput } from "../schema";

const repo = "https://github.com/shivampatil4972/VAYORA-";
const blob = (p: string) => `${repo}/blob/HEAD/${p}`;
const tree = (p: string) => `${repo}/tree/HEAD/${p}`;
const commit = (sha: string) => `${repo}/commit/${sha}`;

const VERIFIED = "Public repository shivampatil4972/VAYORA- (read 2026-10-25; commit count and CI re-checked 2026-11-02)";

export const journex: ProjectInput = {
  id: "journex",
  slug: "journex",
  title: "JOURNEX (VAYORA)",
  tagline: "AI-assisted intercity ride-sharing for the Kolhapur–Pune corridor, built to test one idea about cancellations.",
  summary:
    "A final-year mega project by a team of four: a production-style ride-sharing platform (Spring Boot, React, FastAPI, Socket.IO, PostgreSQL/PostGIS) plus a SimPy simulation study. It asks whether predicting how long a booking will survive — and asking shaky bookings to release early — produces more completed rides. In the simulated world, it does not, and the project reports that plainly.",
  category: "ai-ml",
  secondaryCategories: ["full-stack", "research"],
  status: "in-development",
  statusNote: "Final-year project, ongoing. 83 of 95 backlog features verified, 11 partial, 1 not started (feature matrix, 2026-10-21).",
  featured: true,
  rank: 1,
  period: { start: "2026-10", end: "ongoing" },
  team: { size: 4, note: "Final-year B.Tech team, CSE (Data Science), DYPCET Kolhapur." },
  role: "Team member — repository owner",
  technologies: [
    "Java 21",
    "Spring Boot 3",
    "React 18",
    "TypeScript",
    "Tailwind CSS",
    "FastAPI",
    "Python 3.11",
    "SimPy",
    "lifelines",
    "OR-Tools CP-SAT",
    "Express",
    "Socket.IO",
    "PostgreSQL 16",
    "PostGIS",
    "MongoDB",
    "Redis",
    "OSRM",
    "Docker Compose",
    "GitHub Actions",
  ],
  contribution: {
    summary:
      "All 247 commits in the public repository (2026-10-09 to 2026-10-24) were pushed from Shivam's GitHub account. " +
      placeholder("Describe your personal responsibilities within the team of four (which services, experiments and documents you owned)."),
    items: [
      placeholder("List the components you personally designed or implemented."),
      placeholder("List the experiments or analyses you ran."),
    ],
  },
  aiAssistance:
    "Built with an AI coding assistant: all 247 commits in the public history carry a Co-Authored-By: Claude trailer.",
  problem:
    "On intercity carpooling, a seat released three days before departure is usually refilled; the same seat released two hours before departure is destroyed capacity. Platforms optimise bookings, but a platform can take more bookings and still move fewer people.",
  targetUsers: [
    "Passengers travelling between Kolhapur and Pune (~230 km)",
    "Drivers publishing intercity rides with spare seats",
    "Platform administrators handling safety, disputes and moderation",
  ],
  solution:
    "Model how long an accepted booking will last as a survival curve over the seven-day booking horizon, use it to rank rides and to decide whom a no-penalty seat-release reminder asks, and measure everything by one metric: completed rides per 100 searches.",
  workflows: [
    "Passenger searches by town or exact map point, sees walking time on real footpaths, a match score and the driver's record, holds a seat for five minutes, then books or requests.",
    "Driver publishes a ride with intermediate stops, per-stretch prices from the road route, return trips and weekly repeats; electric vehicles have their range respected.",
    "48 hours before boarding, a seat-release reminder asks — without penalty — whether plans changed; only bookings the model rates below 0.8, within a contact budget, are asked.",
    "Administrators work a back office: reports, emergency queue, disputes, audit log, the durability model's scores with reasons, and a live what-if simulator page.",
    "Every screen, notification and error message is available in English, Hindi and Marathi.",
  ],
  techRationale: [
    { tech: "Spring Boot (core-api)", why: "Owns every transaction and fact; booking locks the ride row and takes all legs in one conditional UPDATE so concurrent requests for the last seat yield exactly one booking." },
    { tech: "FastAPI (intel)", why: "Stateless inference: the survival model, the contact scheduler and live what-if runs. If intel is down, bookings still happen without a score." },
    { tech: "Express + Socket.IO (gateway)", why: "Ephemeral streams only — ride chat and live driver position — with JWT verification." },
    { tech: "PostgreSQL + PostGIS", why: "System of record including the 22-type event log that every research number is computed from." },
    { tech: "Redis", why: "Seat holds and route cache — disposable state that never changes PostgreSQL's seat counts." },
    { tech: "SimPy", why: "A discrete-event simulator of the corridor so variants can be compared on 30 seeds each with paired differences." },
    { tech: "OR-Tools CP-SAT", why: "A per-departure-day seat limit turns 'whom to ask' into an integer programme that sorting cannot solve." },
  ],
  architecture: {
    summary:
      "Four services with one placement rule: core-api owns transactions and truth, intel owns inference and holds no state, gateway owns ephemeral streams, web renders. No service forwards a request on another's behalf, and no entity lives in two stores.",
    dataFlow: [
      "Browser → core-api (HTTPS) for facts; browser → gateway (WebSocket) for chat and live position.",
      "core-api → intel to score a booking: core-api supplies features and stores the score; intel computes and forgets.",
      "core-api → PostgreSQL/PostGIS (truth), MongoDB (chat, GPS, notifications), Redis (holds, route cache), OSRM (roads and footpaths).",
      "Simulator (SimPy) → the same `events` table, so platform and simulation speak one 22-event vocabulary.",
      "experiments/analysis/metrics.sql → every number in the report is a SQL aggregate over `events`.",
    ],
    xrayId: "journex",
  },
  implementation: [
    "Booking concurrency: the ride row is locked, then every leg's seats are taken in one conditional UPDATE; a test fires 8 concurrent requests for the last seat.",
    "Money: holds, captures and tiered refunds in an append-only ledger; the ledger and audit log cannot be rewritten, enforced by database triggers.",
    "Survival model: Cox proportional hazards served (best departure Brier score and concordance of three fitted models); features computed by one tracker used for both training and serving.",
    "Variant ladder: B0 (closest time), B3 (rank by predicted durability), B4 (ask shaky bookings to release), B5 (B4 within a CP-SAT contact budget), ORACLE (asks exactly the late cancellers).",
    "Reproducibility: scripts/reproduce.sh rebuilds every result from experiments/configs and fails unless each matches what is committed.",
    "Internationalisation: two tests keep languages honest — one fails on untranslated UI text, the other if the server can send a message the app cannot translate.",
  ],
  challenges: [
    { title: "A metric that resists gaming", detail: "Choosing completed rides per 100 searches meant a variant that only moves cancellations earlier scores nothing — which is exactly what the experiments then showed." },
    { title: "Slow analysis queries", detail: "A join on keys inside the JSON event payload did not finish in ten minutes; rewriting the metric queries to group instead brought them down to seconds." },
    { title: "Model fitting cost", detail: "The gradient-boosted survival model's loss is quadratic in rows; the full set ran for over ten minutes, so it trains on a 5,000-row sample." },
    { title: "Faults only a real browser found", detail: "Driving the full stack page by page in headless Edge found a rating error and missing driver names on bookings, fixed in commit c0a5e50." },
  ],
  tradeoffs: [
    { decision: "Cox proportional hazards as the served model", alternatives: "Gradient-boosted survival model; Kaplan–Meier (no features)", cost: "Its proportional-hazards assumption is violated for lead time; it discriminates weakly (concordance ≈ 0.59)." },
    { decision: "JdbcTemplate with hand-written SQL, no ORM", alternatives: "JPA/Hibernate", cost: "More SQL to maintain, in exchange for one readable conditional UPDATE for taking seats." },
    { decision: "Seat holds live only in Redis", alternatives: "Hold rows in PostgreSQL", cost: "A hold is a courtesy: it is not honoured while Redis is down." },
    { decision: "Corridor demand left uncalibrated", alternatives: "A proxy from bus and train timetables", cost: "Every result rests on demand the authors assumed; a proxy was declined because it would not be calibration." },
  ],
  testing: {
    summary:
      "Four suites, all reported passing in local runs on 2026-10-24 (docs/TESTING.md). On GitHub Actions, the run for commit 2df443d (2026-10-24) passed the gateway, core-api and Python jobs but failed the Web job at `npm test`.",
    suites: [
      { name: "core-api", detail: "JUnit 5 with Testcontainers: real PostGIS, MongoDB and Redis", count: 311, status: "reported-passing", asOf: "2026-10-24", source: "docs/TESTING.md" },
      { name: "Python research", detail: "Event log, simulator, model, scheduler, experiments, intel API", count: 206, status: "reported-passing", asOf: "2026-10-24", source: "docs/TESTING.md" },
      { name: "web", detail: "React screens, translations, money and dates", count: 236, status: "reported-passing", asOf: "2026-10-24", source: "docs/TESTING.md (locally); failed on GitHub Actions run for 2df443d" },
      { name: "gateway", detail: "Real Socket.IO server and clients", count: 28, status: "reported-passing", asOf: "2026-10-24", source: "docs/TESTING.md" },
    ],
  },
  results: [
    { label: "B0 baseline", value: "30.77", context: "Completed rides per 100 searches, showing rides closest to the passenger's preferred time.", source: "README.md / EXPERIMENT_PROTOCOL.md" },
    { label: "B3 ranking by durability", value: "+0.34", context: "Over B0 — and a model with no booking features does as well, so the gain comes from timing alone.", source: "README.md, docs/figures" },
    { label: "B4 asking shaky bookings", value: "−0.01", context: "Completed rides vs B3 (95% interval −0.04 to +0.03), despite cutting the late-cancellation share by 5.6 points.", source: "README.md" },
    { label: "ORACLE ceiling", value: "+0.10", context: "Even perfect targeting adds only ~0.10 over B3: late releases are already refilled 68% of the time, and over half of searches find no ride.", source: "README.md" },
    { label: "Real hotel cancellations", value: "C = 0.653", context: "Gradient boosting (0.597 Cox) vs 0.544 for lead time alone on a public hotel-bookings dataset — features help on real data.", source: "README.md" },
  ],
  limitations: [
    "All platform and experiment data is synthetic; every world.yaml number is an assumption, not an estimate. Nothing here is evidence about real passengers.",
    "One simulated corridor with one origin and one destination, so variants B1 and B2 (geographic filtering/ranking) were not built.",
    "The served model discriminates weakly and violates the proportional-hazards assumption for lead time.",
    "Payments, SMS, calls and email run against simulated providers by default; Razorpay, Twilio, SMTP and Google sign-in are tested against stand-ins, never the real services.",
    "GitHub Actions' Web job failed on the latest commit (2026-10-24) although local runs pass.",
  ],
  lessons: [
    "Pick the metric before the model. Bookings would have shown a win; completed rides showed the truth.",
    "Build an oracle variant early: it bounds what any targeting can achieve and saves weeks of tuning.",
    "Robustness checks (a no-feature model, random choice) are what separate a real gain from a lucky one.",
    "Negative results are still results when the method is sound and reproducible.",
  ],
  future: [
    "Calibrate demand against real corridor data if any becomes available.",
    "Build the remaining variants (B1, B2, B6–B11) and complete the 12 unfinished backlog features.",
    "Fix the failing Web CI job and keep CI green on every push.",
    "Try the real providers (Razorpay test mode, Twilio, SMTP) end to end.",
  ],
  setup: {
    steps: [
      "git clone https://github.com/shivampatil4972/VAYORA-.git && cd VAYORA-",
      "docker compose up -d --build --wait",
      "sh infra/check-health.sh",
      "Open http://localhost:5173 and sign up as a passenger or driver",
      "scripts/reproduce.sh --no-sweeps   # tests, model and ladder",
    ],
    note: "First run downloads a ~220 MB OpenStreetMap extract to build road and footpath graphs.",
  },
  links: [
    { label: "Repository", href: repo, kind: "repo" },
    { label: "Experiment protocol", href: blob("docs/EXPERIMENT_PROTOCOL.md"), kind: "docs" },
    { label: "Known limitations", href: blob("docs/KNOWN_LIMITATIONS.md"), kind: "docs" },
    { label: "Feature matrix", href: blob("docs/FEATURE_MATRIX.md"), kind: "docs" },
    { label: "Early VAYORA prototype", href: "https://github.com/shivampatil4972/VAYORA", kind: "repo" },
  ],
  media: {
    cover: {
      src: "/research/journex/fig1-ladder.webp",
      alt: "Bar chart of completed rides per 100 searches for each variant against the B0 baseline, with 95% intervals",
      width: 1280,
      height: 580,
      caption: "Figure 1 from the repository: the variant ladder (synthetic data, 30 seeds per variant).",
    },
    gallery: [
      { src: "/research/journex/fig2-refill-timing.webp", alt: "Share of released seats refilled for early versus late releases", width: 1280, height: 680, caption: "Early releases are refilled 93% of the time under B0, late ones 66%." },
      { src: "/research/journex/fig4-survival.webp", alt: "Kaplan–Meier survival curve of booking durability by days since booking", width: 1280, height: 680, caption: "Booking durability: 95% last a day, 80% three days, 60% six." },
      { src: "/research/journex/fig3-sweeps.webp", alt: "Sweeps of the change in completed rides across departure tolerance, publishing lead and contact budget", width: 1400, height: 496, caption: "No swept setting shows a gain from asking passengers." },
    ],
  },
  evolution: [
    { date: "2026-10-01", kind: "prototype", title: "VAYORA prototype", detail: "First repository with a broad research title — matching, reliability, recovery and EV-aware planning — and the completed-rides KPI already defined.", ref: "VAYORA", href: "https://github.com/shivampatil4972/VAYORA" },
    { date: "2026-10-09", kind: "milestone", title: "Restart as JOURNEX with binding rules", detail: "Scope narrowed to one testable idea. Service skeletons, Compose stack, events table and a fixed event vocabulary.", ref: "eb8bc3a", href: commit("eb8bc3a") },
    { date: "2026-10-10", kind: "experiment", title: "Simulator, durability model, first 30-seed run", detail: "B0 simulator and world config, booking-durability model with scoring API, B3/B4 variants and paired comparison.", ref: "f07c6b8", href: commit("f07c6b8") },
    { date: "2026-10-13", kind: "experiment", title: "Contact scheduler and B5", detail: "CP-SAT scheduler in intel; reconfirmation requests under a contact budget; Hindi and Marathi added to the web app.", ref: "2edf679", href: commit("2edf679") },
    { date: "2026-10-14", kind: "experiment", title: "Oracle ceiling and reproducibility script", detail: "An oracle upper bound and the research conclusion so far; reproduce.sh and its first full run recorded.", ref: "8d6c405", href: commit("8d6c405") },
    { date: "2026-10-15", kind: "experiment", title: "Robustness checks", detail: "No-feature model, asking alone, random choice and thresholds — the one gain needs no personal data.", ref: "0312874", href: commit("0312874") },
    { date: "2026-10-16", kind: "fix", title: "Faults found in a real browser", detail: "Driving every page in headless Edge exposed a rating error and missing driver names on bookings.", ref: "c0a5e50", href: commit("c0a5e50") },
    { date: "2026-10-20", kind: "experiment", title: "Survival models on real hotel cancellations", detail: "Same model kinds fitted on a public dataset (train 2015–16, check 2017) — features help on real data.", ref: "30653cf", href: commit("30653cf") },
    { date: "2026-10-21", kind: "milestone", title: "Targeted seat-release reminder", detail: "The platform asks only bookings at risk, so the research's B5 intervention runs in the product.", ref: "5368156", href: commit("5368156") },
    { date: "2026-10-22", kind: "refactor", title: "iOS-style redesign", detail: "A theme that follows the device into dark mode; screens restyled to work like a production ride app.", ref: "0211778", href: commit("0211778") },
    { date: "2026-10-24", kind: "release", title: "Hardening and CI", detail: "Every suite on GitHub Actions, ESLint, OpenAPI/Swagger, rate limits on sign-in and codes, dependency advisories cleared.", ref: "cd8d73a", href: commit("cd8d73a") },
  ],
  evidence: [
    { id: "journex-readme", label: "README with results table", kind: "doc", href: blob("README.md"), note: "Research question, variant ladder results and quick start.", verifiedFrom: VERIFIED },
    { id: "journex-protocol", label: "EXPERIMENT_PROTOCOL.md", kind: "report", href: blob("docs/EXPERIMENT_PROTOCOL.md"), note: "Every run with its 95% interval.", verifiedFrom: VERIFIED },
    { id: "journex-methodology", label: "AI_ML_METHODOLOGY.md", kind: "doc", href: blob("docs/AI_ML_METHODOLOGY.md"), note: "Survival target, censoring and features.", verifiedFrom: VERIFIED },
    { id: "journex-testing", label: "TESTING.md", kind: "test", href: blob("docs/TESTING.md"), note: "781 tests across four suites, last local run 2026-10-24.", verifiedFrom: VERIFIED },
    { id: "journex-ci", label: "GitHub Actions workflow", kind: "test", href: `${repo}/actions`, note: "Latest run (2df443d): 3 of 4 jobs passed; Web job failed at npm test.", verifiedFrom: "GitHub Actions API, re-checked 2026-11-02 (no newer run)" },
    { id: "journex-metrics-sql", label: "metrics.sql", kind: "source", href: blob("experiments/analysis/metrics.sql"), note: "Every reported number is a SQL aggregate over the events table.", verifiedFrom: VERIFIED },
    { id: "journex-sim", label: "SimPy simulator", kind: "source", href: tree("sim"), note: "Discrete-event simulation of the corridor.", verifiedFrom: VERIFIED },
    { id: "journex-intel", label: "intel service", kind: "source", href: tree("intel"), note: "FastAPI: durability model, explanations, contact scheduler.", verifiedFrom: VERIFIED },
    { id: "journex-core", label: "core-api", kind: "source", href: tree("core-api"), note: "Spring Boot 3, Java 21, Flyway migrations.", verifiedFrom: VERIFIED },
    { id: "journex-limits", label: "KNOWN_LIMITATIONS.md", kind: "doc", href: blob("docs/KNOWN_LIMITATIONS.md"), note: "What is simulated, mocked or missing.", verifiedFrom: VERIFIED },
  ],
  updated: "2026-11-02",
};
