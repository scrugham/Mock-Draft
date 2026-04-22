/**
 * Map canonical team keys (no punctuation, single spaces) to the set of
 * strings that should match entries using full franchise names.
 */

const NFL_FRANCHISES: Record<string, string[]> = {
  "arizona cardinals": ["arizona cardinals", "cardinals"],
  "atlanta falcons": ["atlanta falcons", "falcons"],
  "baltimore ravens": ["baltimore ravens", "ravens"],
  "buffalo bills": ["buffalo bills", "bills"],
  "carolina panthers": ["carolina panthers", "panthers"],
  "chicago bears": ["chicago bears", "bears"],
  "cincinnati bengals": ["cincinnati bengals", "bengals"],
  "cleveland browns": ["cleveland browns", "browns"],
  "dallas cowboys": ["dallas cowboys", "cowboys"],
  "denver broncos": ["denver broncos", "broncos"],
  "detroit lions": ["detroit lions", "lions"],
  "green bay packers": ["green bay packers", "packers"],
  "houston texans": ["houston texans", "texans"],
  "indianapolis colts": ["indianapolis colts", "colts"],
  "jacksonville jaguars": ["jacksonville jaguars", "jaguars"],
  "kansas city chiefs": ["kansas city chiefs", "chiefs"],
  "las vegas raiders": ["las vegas raiders", "oakland raiders", "raiders"],
  "los angeles chargers": ["los angeles chargers", "san diego chargers", "chargers"],
  "los angeles rams": ["los angeles rams", "st louis rams", "rams"],
  "miami dolphins": ["miami dolphins", "dolphins"],
  "minnesota vikings": ["minnesota vikings", "vikings"],
  "new england patriots": ["new england patriots", "patriots"],
  "new orleans saints": ["new orleans saints", "saints"],
  "new york giants": ["new york giants", "giants"],
  "new york jets": ["new york jets", "jets"],
  "philadelphia eagles": ["philadelphia eagles", "eagles"],
  "pittsburgh steelers": ["pittsburgh steelers", "steelers"],
  "san francisco 49ers": ["san francisco 49ers", "49ers"],
  "seattle seahawks": ["seattle seahawks", "seahawks"],
  "tampa bay buccaneers": ["tampa bay buccaneers", "buccaneers", "bucs"],
  "tennessee titans": ["tennessee titans", "titans", "houston oilers"],
  "washington commanders": [
    "washington commanders",
    "washington football team",
    "commanders",
    "redskins",
  ],
};

/** All alias strings -> canonical key */
const aliasToCanonical = new Map<string, string>();
for (const [canonical, aliases] of Object.entries(NFL_FRANCHISES)) {
  for (const a of aliases) {
    aliasToCanonical.set(a, canonical);
  }
  aliasToCanonical.set(canonical, canonical);
}

export function canonicalTeamKey(teamDisplay: string): string | null {
  const n = normalizeTeamName(teamDisplay);
  return aliasToCanonical.get(n) ?? null;
}

export function teamsMatch(a: string, b: string): boolean {
  const ka = canonicalTeamKey(a);
  const kb = canonicalTeamKey(b);
  if (ka && kb) return ka === kb;
  return normalizeTeamName(a) === normalizeTeamName(b);
}

function normalizeTeamName(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
