export interface SearchEntry<A = unknown> {
  id: string;
  group: string;
  title: string;
  subtitle?: string;
  keywords?: string[];
  action: A;
  /** Small boost for entries that should win ties (apps, flagship work). */
  boost?: number;
}

export interface SearchResult<A = unknown> extends SearchEntry<A> {
  score: number;
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9+#.]+/g, " ")
    .trim();
}

/** True when every character of `needle` appears in order in `hay`. */
export function isSubsequence(needle: string, hay: string): boolean {
  let i = 0;
  for (let j = 0; j < hay.length && i < needle.length; j++) if (hay[j] === needle[i]) i++;
  return i === needle.length;
}

function scoreField(token: string, field: string, weight: number): number {
  if (!field) return 0;
  if (field === token) return 120 * weight;
  if (field.startsWith(token)) return 90 * weight;
  const words = field.split(" ");
  if (words.some((w) => w.startsWith(token))) return 70 * weight;
  if (field.includes(token)) return 45 * weight;
  if (token.length >= 3 && isSubsequence(token, field.replace(/ /g, ""))) return 12 * weight;
  return 0;
}

/**
 * Ranks entries for a query. Every query token must match somewhere (title,
 * keywords or subtitle); scores favour title matches, prefixes and boosts.
 */
export function search<A>(entries: SearchEntry<A>[], query: string, limit = 30): SearchResult<A>[] {
  const tokens = normalize(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return [];
  const results: SearchResult<A>[] = [];
  for (const entry of entries) {
    const title = normalize(entry.title);
    const subtitle = normalize(entry.subtitle ?? "");
    const keywords = normalize((entry.keywords ?? []).join(" "));
    let total = 0;
    let matchedAll = true;
    for (const token of tokens) {
      const s = Math.max(scoreField(token, title, 1.6), scoreField(token, keywords, 1), scoreField(token, subtitle, 0.6));
      if (s === 0) {
        matchedAll = false;
        break;
      }
      total += s;
    }
    if (matchedAll) results.push({ ...entry, score: total + (entry.boost ?? 0) });
  }
  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}
