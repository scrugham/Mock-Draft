/** Canonical string for fuzzy name / team matching */

const SUFFIXES = [
  /\bjr\.?\b/gi,
  /\bsr\.?\b/gi,
  /\bii\b/gi,
  /\biii\b/gi,
  /\biv\b/gi,
  /\bv\b/gi,
];

export function normalizePlayerName(raw: string): string {
  let s = raw.toLowerCase().trim();
  for (const re of SUFFIXES) {
    s = s.replace(re, " ");
  }
  return s
    .replace(/[.'`]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeTeamName(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
