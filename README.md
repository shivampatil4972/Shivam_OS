# SHIVAM.OS

An iOS-inspired developer operating system that presents the engineering work
of **Shivam Patil** — a final-year B.Tech CSE (Data Science) student at
D. Y. Patil College of Engineering & Technology, Kolhapur — as apps on a
glass desktop: case studies, architecture X-rays, research, a live ML
experiment, a résumé and a contact form.

The interface is inspired by modern Apple platforms, but every asset — icons,
wallpapers, logo and layout — is original. SHIVAM.OS is not affiliated with,
endorsed by or sponsored by Apple Inc.

## What is in the box

| Area | What it does |
| --- | --- |
| **OS shell** | Boot screen (skippable, never repeated within a session), menu bar with real clock and offline indicator, magnifying dock, draggable/resizable windows with minimise, maximise, snap, stacking, overview and off-screen protection, desktop context menu, keyboard shortcuts, activity pill for genuine events |
| **Mobile** | A purpose-built launcher (home screen, quick dock, full-screen apps with back navigation and real browser-back support), not a shrunken desktop |
| **16 apps** | Home, Projects, About, Skills, Education, Experience, Research Lab, AI Lab, Engineering X-Ray, GitHub, Terminal, Résumé, Contact, Settings, Quality Control, Recruiter Mode |
| **Case studies** | 14 projects with problem, users, workflows, personal contribution, AI-assistance disclosure, technology rationale, architecture and data flow, challenges, trade-offs, tests, measured results, limitations, lessons, future work, setup steps, evolution timeline and evidence links — each with a shareable URL (`/projects/<slug>`) |
| **Engineering X-Ray** | Interactive architecture diagrams with responsibilities, interfaces, tests, trade-offs and source links; simulated, unverified and proposed parts are labelled; list view for accessibility |
| **Proof-of-Work graph** | Skills connected to the projects that use them, with the evidence behind each project; matrix view |
| **AI Lab** | Logistic regression vs. a majority-class baseline on the Placement Portal's real (synthetic) dataset, trained in a Web Worker; adjustable features, leakage toggle, class weights, threshold, seed; ROC, loss, coefficients and confusion matrix with table views; independently cross-checked against scikit-learn |
| **Research Lab** | The JOURNEX simulation study (a reported negative result), an OCR engine benchmark and the placement-model re-evaluation, each with method, data, results, reproducibility and threats to validity |
| **Quality Control Center** | Shows the dated report from `npm run qc`: typecheck, lint, unit, E2E, axe accessibility, lab performance, links, dependency audit, open placeholders — and checks that were *not* run |
| **Spotlight & Terminal** | Ctrl/⌘ K search across apps, projects, skills, research and actions; a terminal with predefined, read-only commands |
| **Settings** | Theme (system/dark/light), glass material, accent, wallpaper, motion level, dock size and magnification, intro screen; persisted, resettable, applied before first paint |

## Content integrity

Content comes from the owner's latest résumé (23 Oct 2026), certificates and
project repositories, and every claim records where it was verified. Unknown
details are rendered as visible **placeholders** for the owner to confirm,
never invented. Notable choices:

- JOURNEX's research is reported as unpublished project research with its
  negative result; its failing GitHub Actions job is stated.
- IntelliGrade's AI marking is described as unmeasured (the LLM provider was
  never called against the live API).
- The Placement Portal's reported 95.11% accuracy is shown next to the
  majority-class baseline it does not beat.
- Commits co-authored with an AI coding assistant are disclosed per project.
- The registered design is described as a design registration, not a patent.
- Private repositories are not linked; the phone number is not shown on the site.

See [docs/CONTENT.md](docs/CONTENT.md) to edit content.

## Tech stack

Next.js 16 (App Router, static prerendering) · React 19 · TypeScript 6 (strict,
`noUncheckedIndexedAccess`) · Tailwind CSS 4 · Motion · Lucide · Zod (content
schemas, contact validation) · React Hook Form · Vitest + Testing Library ·
Playwright + axe-core. TypeScript 6 is used rather than 7 because Next.js's
build type-check and typescript-eslint depend on the JavaScript compiler API.

```
src/
  app/            routes, metadata (sitemap, robots, manifest, OG image), contact API
  os/             shell: window manager, dock, menu bar, Spotlight, overlays, routing
  os/state/       pure reducers and stores (windows, preferences, activity)
  apps/<app>/     one folder per app, code-split and loaded on demand
  design/         design primitives, original icon family, wallpapers
  content/        typed personal content + Zod schemas
  lib/            search, terminal, project filtering, ML, contact, server-only code
scripts/          asset import, GitHub snapshot, link check, perf probe, QC report, ML reproduction
tests/unit/       Vitest
tests/e2e/        Playwright (desktop + Pixel 7) with axe-core scans
```

## Getting started

Requirements: Node.js 20.9+ (developed on Node 24) and npm.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop, build, serve the build |
| `npm run typecheck` / `lint` | TypeScript and ESLint |
| `npm test` | Unit tests |
| `npm run test:e2e` | Playwright against a production server (starts one if none is given) |
| `npm run qc` | Run every check and refresh the Quality Control report |
| `npm run snapshot:github` | Refresh the GitHub fallback snapshot |
| `npm run check:links` | Link check (`-- --base http://127.0.0.1:3000` to include internal URLs) |
| `npm run assets` | Re-import résumé, screenshots and the AI Lab dataset |

First-time E2E setup: `npx playwright install chromium`, or set
`E2E_CHANNEL=chrome` to use an installed Chrome.

Copy `.env.example` to `.env.local` only if you need the optional settings.
Deployment, environment variables and custom domains are covered in
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Keyboard

Ctrl/⌘ K Spotlight · Alt+Shift+W close · Alt+Shift+M minimise ·
Alt+Shift+F maximise · Alt+Shift+←/→ snap · Alt+Shift+` cycle ·
Alt+Shift+O overview · Alt+Shift+1–9 open dock apps · Alt+Shift+? help.
Window titles move with the arrow keys; the corner handle resizes.

## Quality status

From `npm run qc` on 2 November 2026 (Node 24.20, Windows, Chrome 156). The
full dated report ships in `public/reports/quality-report.json` and is shown
in the Quality Control Center app.

| Check | Result |
| --- | --- |
| TypeScript (strict) | Passed — no errors |
| ESLint | Passed — 0 errors, 0 warnings (115 files, no suppressions) |
| Unit tests (Vitest) | Passed — 182 of 182 |
| Production build | Passed — 39 pages prerendered as static HTML |
| End-to-end (Playwright, desktop 1440×900 + Pixel 7) | Passed — 215 of 215, 0 flaky |
| Accessibility (axe-core, WCAG 2.2 A/AA) | Passed — 68 scans of 17 routes in light and dark mode, desktop and mobile: 0 violations |
| Performance (lab) | Warning — CLS 0 everywhere; LCP 0.25–1.24 s; mobile blocking time 145–216 ms (two pages just over the 200 ms target) under 4× CPU slowdown and slow-4G throttling |
| Links | Warning — 91 of 93 OK, 0 broken; LinkedIn and LeetCode block automated checks |
| Dependencies | Warning — production: 0 known vulnerabilities; dev tooling: 16 moderate advisories (`minimatch` inside ESLint, no non-breaking fix yet) |
| Content placeholders | 47 details for the owner to confirm |
| Not run | Screen-reader testing, real iOS/Android devices, live contact delivery, GitHub Actions (not pushed yet) |

The machine-learning implementation in the AI Lab was cross-checked against
scikit-learn on identical rows: ROC-AUC 0.8607 in both, accuracy 0.8400 vs
0.8385.

## Known limitations

- **Contact delivery** works only after a Formspree or Resend account is
  configured; until then the form says nothing was sent. Live delivery has not
  been tested.
- **Not tested** on real iOS/Android devices, in Safari/WebKit or Firefox, or
  with screen readers. Mobile is tested with Chrome's Pixel 7 emulation.
- **Performance numbers are lab measurements** on one machine, not field data.
- **CSP** allows inline scripts (required for statically prerendered Next.js
  pages without per-request nonces).
- The contact rate limit is in memory, so on serverless hosts it is per instance.
- The **GitHub** app shows a dated snapshot when the GitHub API is unreachable or
  rate-limited (60 requests/hour per visitor IP without a token).
- **LinkedIn and LeetCode links** cannot be verified automatically (both block bots).
- The **AI Lab** dataset is synthetic; results describe the project's data
  generator, not real students.
- Open **placeholders** remain for details only the owner can confirm (see the
  Quality Control Center → Content integrity).
- CI is configured but has not run until the repository is pushed to GitHub.
- ESLint is pinned to 9.x because `eslint-plugin-react` and `jsx-a11y` do not yet
  declare support for ESLint 10.

## Licence

Content, photographs and résumé © Shivam Patil. All rights reserved.
