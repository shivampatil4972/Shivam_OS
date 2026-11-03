import { placeholder } from "./placeholder";

/**
 * Owner profile. Primary source: résumé "Shivam_Patil_Full_Stack_Intern_Resume_Updated.pdf"
 * (dated 2026-10-23), the most recent résumé in the owner's files.
 */
export const profile = {
  name: "Shivam Patil",
  fullName: "Shivam Ashok Patil",
  initials: "SP",
  headline: "Software engineer building full-stack products with measurable AI inside.",
  roles: ["Software Engineer", "Full-Stack Developer", "AI-Enabled Applications"],
  location: "Kolhapur, Maharashtra, India",
  summary:
    "Computer Science & Engineering (Data Science) student at D. Y. Patil College of Engineering & Technology, Kolhapur, with a 9.12/10 CGPA. I build full-stack applications — REST APIs, database-driven workflows and dashboards — and I care about the parts that make AI features trustworthy: grounding, evaluation against a baseline, and saying plainly what was not measured.",
  availability: {
    label: "Final-year B.Tech · graduating 2027 · currently interning",
    detail:
      "Interning at Hruta Solutions (MERN stack) and in Kiran Academy's Java Full Stack internship. " +
      placeholder("Confirm which roles and start dates you are open to (e.g. internships, 2027 graduate roles)."),
  },
  email: "shivampatil4972@gmail.com",
  links: {
    github: "https://github.com/shivampatil4972",
    linkedin: "https://www.linkedin.com/in/shivam-patil-b47189210",
    leetcode: "https://leetcode.com/u/shivam_patil_07",
  },
  languages: ["English", "Hindi", "Marathi"],
  photo: {
    src: "/images/profile.webp",
    alt: "Portrait of Shivam Patil in a navy blazer",
    width: 640,
    height: 640,
  },
  resume: {
    href: "/resume/Shivam_Patil_Resume.pdf",
    fileName: "Shivam_Patil_Resume.pdf",
    updated: "2026-10-23",
    pages: 1,
  },
  about: {
    intro:
      "I'm a final-year engineering student specialising in Data Science. Most of what I build sits where web engineering meets data: placement analytics, support-ticket triage, examination evaluation and, for my final-year project, intercity ride-sharing with a survival model of booking cancellations.",
    journey: [
      "Started with C and C++ — a menu-driven Student Result Management System that later grew a SQLite store and a multi-threaded WinSock web dashboard.",
      "Moved into data analytics with Power BI and Tableau dashboards on placement, payments, retail and road-safety data.",
      "Built full-stack applications in PHP/MySQL, Flask, the MERN stack and, most recently, Spring Boot with React and TypeScript.",
      "Took part in two HackerRank Orchestrate challenges (May and August 2026), building an AI support-triage agent and a multimodal notification router.",
      "Now working on JOURNEX/VAYORA with a team of four: a production-style ride-sharing platform plus a reproducible simulation study.",
    ],
    interests: [
      "Evaluation-first AI: baselines, held-out data and honest error analysis",
      "Backend correctness: transactions, idempotency and concurrency",
      "Data visualisation that answers a decision-maker's question",
      "Multilingual products for Indian users (English, Hindi, Marathi)",
    ],
    philosophy: [
      "Measure the thing that matters, not the thing that is easy to move — completed rides, not bookings.",
      "A baseline first. A model that cannot beat 'always predict the majority class' has not learned anything yet.",
      "Write down what is simulated, mocked or unmeasured, next to the result it qualifies.",
      "Prefer boring infrastructure (a PostgreSQL job queue) until measurements show the need for more.",
    ],
    learningGoals: [
      placeholder("Confirm your learning goals. Suggested from your recent work: distributed systems and observability; evaluating LLM features on real, consented data; deeper Java/Spring Boot system design."),
    ],
    careerDirection:
      "Software engineering roles where product features and data/ML meet — full-stack or backend teams shipping AI-assisted features that have to be correct.",
    personal: [placeholder("Add personal interests outside engineering (hobbies, sports, music…).")],
    leadership: [
      "Placement Coordinator — coordinated campus placement drives and recruiter–student communication",
      "Microsoft Learn Student Ambassador (LLC Mentor) — mentored students and supported technical workshops",
      "Internship Coordinator, T&P Cell — coordinated internship opportunities between students and organisations",
      "Organised a C++ workshop at DYPCET",
    ],
  },
  sources: {
    resume: "Résumé dated 2026-10-23 (Shivam_Patil_Full_Stack_Intern_Resume_Updated.pdf)",
  },
} as const;

export type Profile = typeof profile;
