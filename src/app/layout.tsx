import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { profile } from "@/content/profile";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { SiteAnalytics } from "@/os/SiteAnalytics";
import { PREFS_BOOT_SCRIPT } from "@/os/state/prefsCore";
import "./globals.css";

/** Geist: a modern grotesk for UI and headings; Geist Mono for code. Self-hosted at build time. */
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

/** Page-view analytics run only on the production Vercel deployment (set by Vercel at build time). */
const ANALYTICS = process.env.VERCEL_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Shivam Patil, Software Engineer`, template: `%s — ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: profile.fullName, url: profile.links.linkedin }],
  creator: profile.fullName,
  keywords: ["Shivam Patil", "software engineer", "full-stack developer", "data science", "portfolio", "React", "Spring Boot", "FastAPI", "machine learning"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Shivam Patil`,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: `${SITE_NAME} — Shivam Patil`, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#04060c" },
    { media: "(prefers-color-scheme: light)", color: "#dfe5ee" },
  ],
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.fullName,
  alternateName: profile.name,
  jobTitle: profile.roles[0],
  address: { "@type": "PostalAddress", addressLocality: "Kolhapur", addressRegion: "Maharashtra", addressCountry: "IN" },
  alumniOf: "D. Y. Patil College of Engineering & Technology, Kolhapur",
  url: SITE_URL,
  sameAs: [profile.links.github, profile.links.linkedin, profile.links.leetcode],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" data-accent="blue" data-glass="balanced" data-wallpaper="aurora" data-motion="system" data-tips="on" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_BOOT_SCRIPT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      </head>
      <body>
        {children}
        {ANALYTICS && <SiteAnalytics />}
        <noscript>
          <div style={{ position: "fixed", inset: "auto 0 0 0", zIndex: 100, padding: 16, background: "#0d1322", color: "#eef2f9", fontSize: 14 }}>
            SHIVAM.OS works best with JavaScript. Without it you can still read{" "}
            <a href="/resume/Shivam_Patil_Resume.pdf" style={{ color: "#7fb0ff" }}>
              the résumé (PDF)
            </a>{" "}
            or email <a href={`mailto:${profile.email}`} style={{ color: "#7fb0ff" }}>{profile.email}</a>.
          </div>
        </noscript>
      </body>
    </html>
  );
}
