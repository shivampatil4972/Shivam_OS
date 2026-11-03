# Editing content

All personal content lives in `src/content/` as typed TypeScript modules,
separate from the interface. Change the data; the apps update themselves.

| File | What it holds |
| --- | --- |
| `profile.ts` | Name, headline, summary, availability, links, about-me text, résumé file and date |
| `projects/journex.ts`, `projects/intelligrade.ts`, `projects/more.ts` | One case study per project |
| `projects/index.ts` | Project order and the label maps |
| `skills.ts` | Skills, their evidence level and the projects/certificates that back them |
| `education.ts` | Degree, certifications, awards, hackathons |
| `experience.ts` | Internships, leadership roles, job simulations |
| `research.ts` | Research Lab studies |
| `xray.ts` | Engineering X-Ray architecture diagrams |
| `recruiter.ts` | Recruiter Mode role summaries |
| `github-snapshot.json` | Offline fallback for the GitHub app (`npm run snapshot:github`) |
| `placement-experiment.json`, `placement-verification.json` | Canonical AI Lab results and the scikit-learn cross-check |

## Rules that keep the portfolio trustworthy

- **Unknown details are placeholders, never guesses.** Write
  `placeholder("what is missing")`. It renders as a dashed "Placeholder" chip,
  the terminal hides it, and the Quality Control Center counts it.
- **Every claim says where it was verified** (`source`, `verifiedFrom`,
  `evidence[].verifiedFrom`). If you add a number, add its source.
- **Status is literal.** Use `in-development`, `completed`, `hackathon` or
  `early-build` for projects, and `draft`, `internal-report`, `submitted`,
  `accepted` or `published` for research — only what is true today.
- **Links must be `https://`, `mailto:` or a same-origin path.** The schema
  rejects anything else.

## Validation

The schemas in `schema.ts` and `xraySchema.ts` are enforced by the unit tests
(`npm test`), not in the browser, so the site ships plain data. A malformed date,
slug, link or missing section fails `tests/unit/content.test.ts` and CI.

## Open placeholders (as of this release)

Run `npm run qc` and open the Quality Control Center → "Content integrity" for
the current list. At release they covered: personal responsibilities within the
JOURNEX team, solo/team status of several projects, hackathon results, the
affiliating university name, relevant coursework, learning goals, personal
interests, internship contributions and dates of some leadership roles.

## Replacing the résumé

1. Put the new PDF at `public/resume/Shivam_Patil_Resume.pdf`
   (or re-run `npm run assets` with `RESUME_PDF=path\to\file.pdf`).
2. Update `profile.resume.updated` in `profile.ts`.

The PDF is served publicly and includes whatever contact details are printed on
it. The website itself does not display the phone number.

## Updating screenshots and the AI Lab dataset

`npm run assets` re-imports screenshots, the profile photo and the Placement
Portal dataset from the owner's local project folders (paths at the top of
`scripts/prepare-assets.mjs`, overridable with `PROJECTS_ROOT`). After changing
the dataset, refresh the canonical results:

```bash
node scripts/placement-experiment.ts --write
node scripts/placement-experiment.ts --export-split split.json
python scripts/verify_placement_experiment.py public/data/placement-training.json split.json
```

and update `src/content/placement-verification.json` with the scikit-learn output.
