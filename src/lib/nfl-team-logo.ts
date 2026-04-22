/**
 * ESPN scoreboard logo slug (path segment before .png).
 * Keys are canonical team keys from team-aliases (lowercase, no punctuation).
 */
export const CANONICAL_TO_LOGO_SLUG: Record<string, string> = {
  "arizona cardinals": "ari",
  "atlanta falcons": "atl",
  "baltimore ravens": "bal",
  "buffalo bills": "buf",
  "carolina panthers": "car",
  "chicago bears": "chi",
  "cincinnati bengals": "cin",
  "cleveland browns": "cle",
  "dallas cowboys": "dal",
  "denver broncos": "den",
  "detroit lions": "det",
  "green bay packers": "gb",
  "houston texans": "hou",
  "indianapolis colts": "ind",
  "jacksonville jaguars": "jax",
  "kansas city chiefs": "kc",
  "las vegas raiders": "lv",
  "los angeles chargers": "lac",
  "los angeles rams": "lar",
  "miami dolphins": "mia",
  "minnesota vikings": "min",
  "new england patriots": "ne",
  "new orleans saints": "no",
  "new york giants": "nyg",
  "new york jets": "nyj",
  "philadelphia eagles": "phi",
  "pittsburgh steelers": "pit",
  "san francisco 49ers": "sf",
  "seattle seahawks": "sea",
  "tampa bay buccaneers": "tb",
  "tennessee titans": "ten",
  "washington commanders": "wsh",
};

export function nflTeamLogoUrl(canonicalKey: string | null): string | null {
  if (!canonicalKey) return null;
  const slug = CANONICAL_TO_LOGO_SLUG[canonicalKey];
  if (!slug) return null;
  return `https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/${slug}.png`;
}
