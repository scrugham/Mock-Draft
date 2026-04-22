import type { LivePick } from "@/lib/types";
import { assignDisplayStatuses, stripPlaceholderPlayerDisplay } from "@/lib/live-pick-display";

type RefField = { $ref?: string };

type EspnPick = {
  overall: number;
  round: number;
  traded?: boolean;
  tradeNote?: string;
  status?: { id?: number; name?: string; description?: string };
  team?: RefField;
  athlete?: RefField;
};

type EspnRound = {
  number: number;
  picks?: EspnPick[];
  status?: {
    round?: number;
    type?: { id?: number; name?: string; state?: string; description?: string };
  };
};

type EspnRoundsResponse = {
  items?: EspnRound[];
};

const refDocCache = new Map<string, Record<string, unknown>>();

async function fetchRefDoc(refUrl: string): Promise<Record<string, unknown> | null> {
  const key = refUrl.split("?")[0] ?? refUrl;
  const cached = refDocCache.get(key);
  if (cached) return cached;

  const url = refUrl.startsWith("http") ? refUrl : `https://${refUrl.replace(/^\/\//, "")}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    return null;
  }
  const json = (await res.json()) as Record<string, unknown>;
  refDocCache.set(key, json);
  return json;
}

function teamDisplayFromDoc(doc: Record<string, unknown> | null): string | null {
  if (!doc) return null;
  const displayName = doc.displayName as string | undefined;
  if (displayName && displayName.includes(" ")) return displayName;
  const location = doc.location as string | undefined;
  const name = doc.name as string | undefined;
  if (location && name) return `${location} ${name}`;
  if (displayName) return displayName;
  if (name) return name;
  return null;
}

function athleteDisplayFromDoc(doc: Record<string, unknown> | null): string | null {
  if (!doc) return null;
  const fullName = doc.fullName as string | undefined;
  const displayName = doc.displayName as string | undefined;
  return fullName || displayName || null;
}

function positionAbbrevFromDoc(doc: Record<string, unknown> | null): string | null {
  if (!doc) return null;
  const pos = doc.position as { abbreviation?: string } | undefined;
  return pos?.abbreviation ?? null;
}

/** Same image path ESPN uses in combiner URLs on draft pages (more reliable than raw PNG). */
export function combinerHeadshotFromPath(imgPath: string): string {
  const path = imgPath.startsWith("/") ? imgPath : `/${imgPath}`;
  return `https://a.espncdn.com/combiner/i?img=${encodeURIComponent(path)}&w=350&h=254`;
}

/**
 * Sync fallback: build direct CDN URLs from nested athlete $ref (no network).
 * Prefer {@link resolveAthleteMedia} for live picks — it follows $ref and uses real headshot.href.
 */
export function headshotUrlFromAthleteDoc(doc: Record<string, unknown> | null): string | null {
  if (!doc) return null;
  const hs = doc.headshot as { href?: string } | undefined;
  if (hs?.href) return hs.href;
  const nested = doc.athlete as RefField | undefined;
  const ref = nested?.$ref ?? "";
  const collegeMatch = ref.match(/college-football\/athletes\/(\d+)/);
  if (collegeMatch) {
    return combinerHeadshotFromPath(
      `/i/headshots/college-football/players/full/${collegeMatch[1]}.png`,
    );
  }
  const nflMatch = ref.match(/\/nfl\/athletes\/(\d+)/);
  if (nflMatch) {
    return combinerHeadshotFromPath(`/i/headshots/nfl/players/full/${nflMatch[1]}.png`);
  }
  return null;
}

/** Parse ESPN player card links (same IDs the best-available / draft UI uses). */
export function headshotUrlFromEspnLinks(doc: Record<string, unknown> | null): string | null {
  if (!doc) return null;
  const links = doc.links as Array<{ href?: string }> | undefined;
  for (const l of links ?? []) {
    const href = l.href;
    if (!href) continue;
    const m = href.match(
      /espn\.com\/(nfl|college-football|nba|nhl|mlb)\/player\/_\/id\/(\d+)/i,
    );
    if (!m) continue;
    const sport = m[1]!.toLowerCase();
    const id = m[2]!;
    if (sport === "college-football") {
      return combinerHeadshotFromPath(`/i/headshots/college-football/players/full/${id}.png`);
    }
    return combinerHeadshotFromPath(`/i/headshots/nfl/players/full/${id}.png`);
  }
  return null;
}

export async function resolveAthleteMedia(athDoc: Record<string, unknown> | null): Promise<{
  headshotUrl: string | null;
  positionAbbrev: string | null;
}> {
  if (!athDoc) {
    return { headshotUrl: null, positionAbbrev: null };
  }

  let positionAbbrev = positionAbbrevFromDoc(athDoc);

  const direct = (athDoc.headshot as { href?: string } | undefined)?.href;
  if (direct) {
    return { headshotUrl: direct, positionAbbrev };
  }

  const nestedRef = (athDoc.athlete as RefField | undefined)?.$ref;
  if (nestedRef) {
    const nested = await fetchRefDoc(nestedRef);
    if (nested) {
      const nestedHead = (nested.headshot as { href?: string } | undefined)?.href;
      if (nestedHead) {
        if (!positionAbbrev) positionAbbrev = positionAbbrevFromDoc(nested);
        return { headshotUrl: nestedHead, positionAbbrev };
      }
      const fromNestedLinks = headshotUrlFromEspnLinks(nested);
      if (fromNestedLinks) {
        if (!positionAbbrev) positionAbbrev = positionAbbrevFromDoc(nested);
        return { headshotUrl: fromNestedLinks, positionAbbrev };
      }
    }
  }

  const fromLinks = headshotUrlFromEspnLinks(athDoc);
  if (fromLinks) {
    return { headshotUrl: fromLinks, positionAbbrev };
  }

  const synthetic = headshotUrlFromAthleteDoc(athDoc);
  return { headshotUrl: synthetic, positionAbbrev };
}

function teamLogoFromDoc(doc: Record<string, unknown> | null): string | null {
  if (!doc) return null;
  const logos = doc.logos as Array<{ href?: string; rel?: string[] }> | undefined;
  if (!logos?.length) return null;
  const scoreboard = logos.find((l) => l.rel?.includes("scoreboard"));
  return scoreboard?.href ?? logos[0]?.href ?? null;
}

export function getDraftRoundsUrl(season: number): string {
  return `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${season}/draft/rounds?lang=en&region=us`;
}

export async function fetchRound1LivePicks(season: number): Promise<LivePick[]> {
  const res = await fetch(getDraftRoundsUrl(season), {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`ESPN draft rounds HTTP ${res.status}`);
  }
  const body = (await res.json()) as EspnRoundsResponse;
  const rounds = body.items ?? [];
  const r1 = rounds.find((r) => r.number === 1);
  if (!r1?.picks?.length) {
    return [];
  }

  const roundState = r1.status?.type?.state;

  const resolved = await Promise.all(
    r1.picks.map(async (p) => {
      const espnStatusName = p.status?.name ?? "UNKNOWN";
      const espnStatusDesc = p.status?.description;
      const [teamDoc, athDoc] = await Promise.all([
        p.team?.$ref ? fetchRefDoc(p.team.$ref) : Promise.resolve(null),
        p.athlete?.$ref ? fetchRefDoc(p.athlete.$ref) : Promise.resolve(null),
      ]);
      const media = await resolveAthleteMedia(athDoc);
      return {
        overall: p.overall,
        round: p.round,
        teamDisplay: teamDisplayFromDoc(teamDoc),
        playerDisplay: stripPlaceholderPlayerDisplay(athleteDisplayFromDoc(athDoc)),
        espnStatusName,
        espnStatusDesc,
        traded: Boolean(p.traded),
        tradeNote: p.tradeNote || undefined,
        headshotUrl: media.headshotUrl,
        positionAbbrev: media.positionAbbrev,
        collegeDisplay: null,
        teamLogoUrl: teamLogoFromDoc(teamDoc),
      };
    }),
  );

  const sorted = resolved.sort((a, b) => a.overall - b.overall);
  const statusLabels = assignDisplayStatuses(
    sorted.map((r) => ({
      overall: r.overall,
      espnStatusName: r.espnStatusName,
      espnStatusDesc: r.espnStatusDesc,
      playerDisplay: r.playerDisplay,
    })),
    roundState,
  );

  return sorted.map(
    (r, i): LivePick => ({
      overall: r.overall,
      round: r.round,
      teamDisplay: r.teamDisplay,
      playerDisplay: r.playerDisplay,
      status: statusLabels[i] ?? r.espnStatusName,
      traded: r.traded,
      tradeNote: r.tradeNote,
      headshotUrl: r.headshotUrl,
      positionAbbrev: r.positionAbbrev,
      collegeDisplay: r.collegeDisplay,
      teamLogoUrl: r.teamLogoUrl,
    }),
  );
}
