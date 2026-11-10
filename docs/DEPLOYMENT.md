# Deploying SHIVAM.OS

The site is a Next.js 16 App Router application. Every page is prerendered as
static HTML; the only server code is the contact and Ask endpoints
(`/api/contact`, `/api/ask`) and Next.js image optimisation. Vercel is the simplest host, but any Node.js 20.9+
host that runs `next start` works.

## 1. Put the code on GitHub

```bash
cd "D:\PROJECTS\PORTFOLIO IOS"
git add -A
git commit -m "SHIVAM.OS: initial release"
# Create an empty repository on github.com (no README), then:
git branch -M main
git remote add origin https://github.com/shivampatil4972/Shivam_OS.git
git push -u origin main
```

The workflow in `.github/workflows/ci.yml` then runs type-checking, linting,
unit tests, the production build and the Playwright suite on every push and
pull request. Its first run (commit `fb53f7f`, 3 November 2026) passed every step on Ubuntu.

## 2. Deploy on Vercel

1. Sign in at vercel.com with GitHub and choose **Add New → Project**.
2. Import the repository. Vercel detects Next.js; keep the defaults
   (build `next build`, output handled automatically, Node.js 20+).
3. Add environment variables (all optional — see below), then **Deploy**.
4. Every push to `main` redeploys; pull requests get preview URLs.

## 3. Environment variables

| Variable | Needed for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, Open Graph | Your final origin, e.g. `https://shivampatil.dev`. Defaults to `https://shivam-os-tau.vercel.app`. |
| `FORMSPREE_FORM_ID` | Contact form delivery (option A) | The ID from a Formspree form endpoint (`https://formspree.io/f/<ID>`). |
| `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` | Contact form delivery (option B) | `CONTACT_FROM_EMAIL` must be on a domain verified in Resend. |
| `GEMINI_API_KEY` | Ask SHIVAM.OS | A Gemini API key from Google AI Studio. Without it the app says it is switched off. See section 4. |
| `GEMINI_PAID_TIER` | Ask SHIVAM.OS (optional) | Set to `true` only if billing is enabled on the key's project; removes the free-tier data-use notice. |
| `ASK_MODEL` | Ask SHIVAM.OS (optional) | Defaults to `gemini-3.6-flash`. `gemini-3.5-flash-lite` is cheaper and faster. |
| `ASK_DAILY_LIMIT` | Ask SHIVAM.OS (optional) | Questions per server instance per day. Defaults to 400. |
| `GITHUB_TOKEN` | `npm run snapshot:github` only | Raises the GitHub API rate limit for the snapshot script. Never exposed to the browser. |

Without a mail provider the contact form validates input and then tells the
visitor that delivery is not configured, offering the email address instead. It
never reports a message as sent unless the provider accepted it.

Secrets are read only in `src/lib/server/delivery.ts` and `src/lib/server/ask.ts`,
which are marked `server-only`, so they cannot be imported into client code.

## 4. Turn on Ask SHIVAM.OS

Ask SHIVAM.OS answers visitors' questions with Google's Gemini, using only the
content in `src/content`, and lists the passages each answer cites.

1. Create an API key in [Google AI Studio](https://aistudio.google.com) →
   **Get API key**.
2. In Vercel, open **Settings → Environment Variables**, add `GEMINI_API_KEY`
   for the **Production** environment only, and redeploy.
3. Open `/ask` on the live site. The header shows which model answers.

**Free tier or paid tier.** A key without billing uses Gemini's free tier: no
charge, but Google may use the prompts and answers to improve its products, and
per-minute and per-day request limits apply (AI Studio shows your current
limits). The site tells visitors this. If you enable billing on the key's Google
Cloud project, Google does not use the data that way; then set
`GEMINI_PAID_TIER=true` so the notice is removed. On the paid tier, set a
budget alert on the Cloud project.

**Cost on the paid tier.** Each question sends about 4–5K input tokens (the
instructions, the profile, the project index and up to eight retrieved
sections) and gets a short answer. With the default `gemini-3.6-flash`
($0.75 per million input tokens and $3.75 per million output tokens until
31 December 2026, then $1.50 and $7.50), that is roughly half a US cent per
question, or about 1 cent after the 2027 price change.

**Abuse limits.** Same-origin requests only; questions up to 400 characters; 6
questions per visitor per 10 minutes, 40 per day, and 400 per server instance
per day. These limits are in memory, so on serverless hosts they apply per
instance; Gemini's own quota is the hard ceiling.

**What is sent.** The visitor's question, up to two earlier questions and
answers from the same window, and the retrieved portfolio passages are sent to
Google's Gemini API. The site does not store questions or answers, and server
logs record only the class of an error, never the question.

**How answers stay grounded.** Retrieval is a BM25 search over the content,
split into numbered passages. Placeholders are sent as "[not provided yet]", so
a suggestion in a placeholder is never presented as fact. Gemini is instructed
to answer only from those passages, keep their caveats, say when the portfolio
does not cover a question, and return JSON in a fixed schema that lists the
passage ids behind every sentence. The server keeps only ids that were actually
sent, and the sources list quotes those passages word for word from the
content, not from the model. If Gemini blocks a prompt or an answer for safety
reasons, the visitor is told the question couldn't be answered.

## 5. Turn on visit statistics

The site includes Vercel Web Analytics, which counts page views without cookies.
It is rendered only when Vercel builds the **production** deployment, so local
runs, previews and tests send nothing.

1. In the Vercel project, open the **Analytics** tab and select **Enable**.
2. Redeploy, so the build includes the analytics script.
3. After visits arrive, the **Pages** list shows views per path. Each case study
   has its own path (`/projects/journex`, `/projects/intelligrade-ai` and so on),
   so you can see which projects visitors open.

Vercel records the page URL, the referrer, approximate location, browser,
operating system and device type. It tells visits apart only by a hash of the
request that is discarded after 24 hours. Before a view is sent, the site
removes every query parameter except `system` and `role`, so stray or tracking
parameters are never recorded. Page views are free on the Hobby plan; custom
events are not used.

## 6. Custom domain

1. In the Vercel project, open **Settings → Domains** and add your domain
   (for example `shivampatil.dev` and `www.shivampatil.dev`).
2. At your registrar, create the DNS records Vercel shows:
   - apex domain: an `A` record to Vercel's IP, or an `ALIAS`/`ANAME` if supported;
   - `www`: a `CNAME` to `cname.vercel-dns.com`.
3. Wait for verification; Vercel issues the HTTPS certificate automatically.
4. Set `NEXT_PUBLIC_SITE_URL` to the new origin and redeploy so canonical URLs,
   the sitemap and social cards use it.

## 7. Before each release

```bash
npm run qc            # runs every check and refreshes public/reports/quality-report.json
git add public/reports/quality-report.json && git commit -m "Update quality report"
```

`npm run qc` builds the site, serves it locally, runs the unit, end-to-end and
accessibility suites, measures lab performance, checks every link and audits
dependencies. The Quality Control Center app shows the resulting report with
its date; anything not executed is shown as "Not run".

To use an installed Chrome instead of Playwright's bundled browser, set
`E2E_CHANNEL=chrome`. On a fresh machine, `npx playwright install chromium`
downloads the bundled browser.

## 8. Security headers

`next.config.ts` sends a Content Security Policy, `X-Content-Type-Options`,
`Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, HSTS and COOP on
every route. The CSP allows `'unsafe-inline'` scripts because statically
prerendered Next.js pages stream their payload through inline scripts; moving
to nonce-based CSP would require rendering every page dynamically.
