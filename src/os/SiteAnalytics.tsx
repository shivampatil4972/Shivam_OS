"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/** The only query parameters that describe a view in SHIVAM.OS; anything else is dropped. */
const VIEW_PARAMS = new Set(["system", "role"]);

export function redactAnalyticsUrl(raw: string): string {
  const url = new URL(raw);
  for (const key of [...url.searchParams.keys()]) if (!VIEW_PARAMS.has(key)) url.searchParams.delete(key);
  url.hash = "";
  return url.toString();
}

const beforeSend = (event: BeforeSendEvent): BeforeSendEvent => ({ ...event, url: redactAnalyticsUrl(event.url) });

/**
 * Vercel Web Analytics: cookieless page-view counts. Rendered only on the
 * production Vercel deployment (see the root layout), so local runs, previews
 * and tests send nothing.
 */
export function SiteAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
