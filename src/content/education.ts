import { placeholder } from "./placeholder";
import type { Award, Certification } from "./schema";

const RESUME = "Résumé dated 2026-10-23";
const CERT_FILE = (name: string) => `Certificate file in owner's records: ${name}`;

export const education = {
  degree: "B.Tech in Computer Science & Engineering (Data Science)",
  institution: "D. Y. Patil College of Engineering & Technology, Kolhapur",
  university: placeholder("Confirm the affiliating university (e.g. Shivaji University, Kolhapur) as it should appear."),
  period: "2023 – 2027",
  graduation: "Expected 2027",
  cgpa: "9.12 / 10",
  cgpaSource: RESUME,
  school: [
    { level: "Higher Secondary (HSC, Class 12)", year: "2023", source: "Earlier résumé (D:/Resume.pdf)" },
    { level: "Secondary (SSC, Class 10)", year: "2021", source: "Earlier résumé (D:/Resume.pdf)" },
  ],
  foundations: ["Data Structures & Algorithms", "Object-Oriented Programming", "DBMS", "Operating Systems", "Computer Networks"],
  coursework: [placeholder("List relevant courses from your transcript (e.g. Machine Learning, Statistics, Big Data).")],
  academicProjects: ["journex", "placement-prediction-portal", "bachat-gat-management-system", "student-result-management-system"],
};

export const certifications: Certification[] = [
  { id: "aws-academy-ml", title: "AWS Academy Graduate — Machine Learning Foundations (20 hours)", issuer: "AWS Academy", date: "2026-01", kind: "badge", onResume: false, verifiedFrom: CERT_FILE("AWS_Academy_Graduate___Machine_Learning_Foundations…pdf; Credly badge credly.com/go/inaI0ENY") },
  { id: "deloitte-data-analytics", title: "Data Analytics Job Simulation", issuer: "Deloitte via Forage", date: "2026-07", kind: "job-simulation", onResume: true, verifiedFrom: CERT_FILE("Deloittee.pdf (completed July 30, 2026)") },
  { id: "tata-genai-analytics", title: "GenAI Powered Data Analytics Job Simulation", issuer: "Tata via Forage", date: "2026-07", kind: "job-simulation", onResume: false, verifiedFrom: CERT_FILE("Tata.pdf (completed July 30, 2026)") },
  { id: "dsa-java", title: "DSA in Java", issuer: "Apna College", date: "undated", kind: "course", onResume: true, verifiedFrom: RESUME },
  { id: "competitive-coding", title: "Competitive Coding", issuer: "PrepInsta Technologies Pvt. Ltd.", date: "undated", kind: "course", onResume: true, verifiedFrom: `${RESUME}; ${CERT_FILE("certificate_Competitive Coding_1875320.pdf")}` },
  { id: "dsa-service", title: "DSA for Service-Based Companies", issuer: "PrepInsta Technologies Pvt. Ltd.", date: "undated", kind: "course", onResume: true, verifiedFrom: `${RESUME}; ${CERT_FILE("certificate_DSA for service based companies_1875320.pdf")}` },
  { id: "qa-analyst", title: "QA Analyst", issuer: "PrepInsta Technologies Pvt. Ltd.", date: "undated", kind: "course", onResume: true, verifiedFrom: `${RESUME}; ${CERT_FILE("certificate_QA Analyst_1875320.pdf")}` },
  { id: "aws-prepinsta", title: "AWS", issuer: "PrepInsta Technologies Pvt. Ltd.", date: "undated", kind: "course", onResume: true, verifiedFrom: `${RESUME}; ${CERT_FILE("certificate_AWS_1875320.pdf")}` },
  { id: "power-bi-bi", title: "Microsoft Power BI & Business Intelligence", issuer: "Cybersena (R&D) India Pvt. Ltd.", date: "undated", kind: "course", onResume: true, verifiedFrom: RESUME },
];

export const awards: Award[] = [
  { id: "design-registration", title: "Registered Design — Communication Skills Analysis Device", detail: "Design No. 483324-001, Class 14-02, registered 10 Dec 2025 under the Designs Act, 2000 (certificate issued 19 Mar 2026 by the Patent Office, Government of India). Registered in the names of D. Y. Patil College of Engineering & Technology and nine individuals, including Shivam Patil. This is a design registration, not a patent.", date: "2025-12", verifiedFrom: "Certificate of Registration of Design (image in owner's records)" },
  { id: "merit-scholarship", title: "Sou. Shantadevi D. Patil Merit Scholarship 2024–25", detail: "D. Y. Patil College of Engineering & Technology, Kolhapur.", date: "2024–25", verifiedFrom: "Résumé (professional version, July 2026)" },
  { id: "first-year-topper", title: "First-Year Data Science Topper", detail: "Computer Science & Engineering (Data Science) department.", date: "2023–24", verifiedFrom: RESUME },
  { id: "placement-appreciation", title: "Certificate of Appreciation — Placement Coordinator", detail: "Recognition for coordinating campus placement activities.", date: placeholder("Add the year"), verifiedFrom: RESUME },
  { id: "abhiyanta-karandak", title: "Best Performer — Abhiyanta Karandak", detail: placeholder("Add what Abhiyanta Karandak is and the category."), date: placeholder("Add the year"), verifiedFrom: RESUME },
  { id: "youth-festival", title: "Second Rank — Shivaji University Youth Festival", detail: placeholder("Add the event or category."), date: "2025", verifiedFrom: `${RESUME}; YOUTH FESTIVAL 2025.pdf` },
];

export const hackathons = [
  { name: "HackerRank Orchestrate (24-hour hackathon)", date: "May 1–2, 2026", project: "support-triage-agent", result: placeholder("Result / ranking") },
  { name: "HackerRank Orchestrate — August 2026 challenge", date: "August 2026", project: "neuroroute-ai", result: placeholder("Result / ranking") },
];

export const research = {
  summary: "Simulation-based research inside the JOURNEX final-year project, and engineering benchmarks in IntelliGrade AI — see the Research Lab.",
};
