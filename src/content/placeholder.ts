/**
 * Editable placeholders. Anything unknown is written with `placeholder()` so it
 * renders as a clearly marked placeholder and can be counted by tests — never
 * silently invented. Dependency-free so content can ship without a validator.
 */
export const PLACEHOLDER_PREFIX = "PLACEHOLDER: ";

export function placeholder(what: string): string {
  return `${PLACEHOLDER_PREFIX}${what}`;
}

export function isPlaceholder(value: string | undefined | null): boolean {
  return typeof value === "string" && value.startsWith(PLACEHOLDER_PREFIX);
}

export function stripPlaceholder(value: string): string {
  return isPlaceholder(value) ? value.slice(PLACEHOLDER_PREFIX.length) : value;
}
