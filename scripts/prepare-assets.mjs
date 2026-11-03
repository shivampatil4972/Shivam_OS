#!/usr/bin/env node
/**
 * One-time asset import. Copies the owner's résumé, converts project screenshots
 * and the profile photo to sized WebP, and converts the Placement Portal's
 * synthetic training data into the compact JSON the AI Lab loads.
 *
 * Sources live outside this repository (the owner's other project folders), so
 * the outputs in /public are committed and this script only needs re-running
 * when a source changes. Override the roots with PROJECTS_ROOT / RESUME_PDF.
 */
import { copyFile, mkdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectsRoot = process.env.PROJECTS_ROOT ?? "D:/PROJECTS";
const oldPortfolio = path.join(projectsRoot, "Shivam_PORTFOLIO/assets/images");
const resumePdf =
  process.env.RESUME_PDF ?? "D:/Resume/TEMP/Shivam_Patil_Full_Stack_Intern_Resume_Updated.pdf";

const out = (...p) => path.join(root, "public", ...p);

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function toWebp(src, dest, { width, height, fit = "inside", position = "top" } = {}) {
  if (!(await exists(src))) {
    console.warn(`skip (missing): ${src}`);
    return null;
  }
  await mkdir(path.dirname(dest), { recursive: true });
  const info = await sharp(src)
    .resize({ width, height, fit, position, withoutEnlargement: true })
    .webp({ quality: 80, effort: 5 })
    .toFile(dest);
  console.log(`${path.relative(root, dest)}  ${info.width}x${info.height}  ${Math.round(info.size / 1024)} KB`);
  return info;
}

const screenshots = [
  ["project_support.png", "support-triage.webp"],
  ["project_placement.png", "placement-portal.webp"],
  ["project_bachat.png", "bachat-gat.webp"],
  ["project_result.png", "student-result.webp"],
  ["project_powerbi_dashboard.png", "placement-analytics.webp"],
  ["project_phonepe.png", "phonepe.webp"],
  ["project_starbucks.png", "starbucks.webp"],
  ["project_tableau.png", "road-accident.webp"],
  ["project_iiofam.png", "indradhanu.webp"],
];

async function main() {
  // Résumé
  if (await exists(resumePdf)) {
    await mkdir(out("resume"), { recursive: true });
    await copyFile(resumePdf, out("resume", "Shivam_Patil_Resume.pdf"));
    console.log("public/resume/Shivam_Patil_Resume.pdf");
  } else {
    console.warn(`skip résumé (missing): ${resumePdf}`);
  }

  // Profile photo: square crop around the face.
  await toWebp(path.join(oldPortfolio, "profile.png"), out("images", "profile.webp"), {
    width: 640,
    height: 640,
    fit: "cover",
    position: "attention",
  });

  for (const [src, dest] of screenshots) {
    await toWebp(path.join(oldPortfolio, src), out("images", "projects", dest), { width: 1600 });
  }

  // JOURNEX report figures (downloaded from the public VAYORA- repository).
  for (const fig of ["fig1-ladder", "fig2-refill-timing", "fig3-sweeps", "fig4-survival"]) {
    const src = out("research", "journex", `${fig}.png`);
    await toWebp(src, out("research", "journex", `${fig}.webp`), { width: 1400 });
  }

  // AI Lab dataset: Placement Portal training_data.csv (synthetic, 10,000 rows).
  const csvPath = path.join(projectsRoot, "PLACEMENT PORTAL/training_data.csv");
  if (await exists(csvPath)) {
    const text = await readFile(csvPath, "utf8");
    const [header, ...lines] = text.trim().split(/\r?\n/);
    const cols = header.split(",");
    const data = Object.fromEntries(cols.map((c) => [c, []]));
    for (const line of lines) {
      const cells = line.split(",");
      cols.forEach((c, i) => {
        const v = Number(cells[i]);
        if (!Number.isFinite(v)) throw new Error(`Non-numeric value in ${c}: ${cells[i]}`);
        data[c].push(Number(v.toFixed(4)));
      });
    }
    const payload = {
      name: "Placement Portal synthetic training data",
      source: "github.com/shivampatil4972/placement-prediction-portal — training_data.csv",
      synthetic: true,
      rows: lines.length,
      columns: cols,
      data,
    };
    await mkdir(out("data"), { recursive: true });
    await writeFile(out("data", "placement-training.json"), JSON.stringify(payload));
    console.log(`public/data/placement-training.json  ${lines.length} rows`);
  } else {
    console.warn(`skip dataset (missing): ${csvPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
