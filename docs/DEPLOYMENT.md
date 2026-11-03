# Deploying SHIVAM.OS

The site is a Next.js 16 App Router application. Every page is prerendered as
static HTML; the only server code is the contact endpoint (`/api/contact`) and
Next.js image optimisation. Vercel is the simplest host, but any Node.js 20.9+
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
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, Open Graph | Your final origin, e.g. `https://shivampatil.dev`. Defaults to `https://shivam-os.vercel.app`. |
| `FORMSPREE_FORM_ID` | Contact form delivery (option A) | The ID from a Formspree form endpoint (`https://formspree.io/f/<ID>`). |
| `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` | Contact form delivery (option B) | `CONTACT_FROM_EMAIL` must be on a domain verified in Resend. |
| `GITHUB_TOKEN` | `npm run snapshot:github` only | Raises the GitHub API rate limit for the snapshot script. Never exposed to the browser. |

Without a mail provider the contact form validates input and then tells the
visitor that delivery is not configured, offering the email address instead. It
never reports a message as sent unless the provider accepted it.

Secrets are read only in `src/lib/server/delivery.ts`, which is marked
`server-only`, so they cannot be imported into client code.

## 4. Custom domain

1. In the Vercel project, open **Settings → Domains** and add your domain
   (for example `shivampatil.dev` and `www.shivampatil.dev`).
2. At your registrar, create the DNS records Vercel shows:
   - apex domain: an `A` record to Vercel's IP, or an `ALIAS`/`ANAME` if supported;
   - `www`: a `CNAME` to `cname.vercel-dns.com`.
3. Wait for verification; Vercel issues the HTTPS certificate automatically.
4. Set `NEXT_PUBLIC_SITE_URL` to the new origin and redeploy so canonical URLs,
   the sitemap and social cards use it.

## 5. Before each release

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

## 6. Security headers

`next.config.ts` sends a Content Security Policy, `X-Content-Type-Options`,
`Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, HSTS and COOP on
every route. The CSP allows `'unsafe-inline'` scripts because statically
prerendered Next.js pages stream their payload through inline scripts; moving
to nonce-based CSP would require rendering every page dynamically.
