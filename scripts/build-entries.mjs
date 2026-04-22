import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const inputCsv = path.join(root, "input", "Entries - Grid view.csv");
const outJson = path.join(root, "public", "entries.json");

const SEASON = parseInt(process.env.DRAFT_SEASON || "2026", 10);

/** Minimal RFC-style CSV parser (handles quoted fields with doubled quotes). */
function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = "";
  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (c === "\r") {
      i += 1;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }
    field += c;
    i += 1;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} -> ${res.status}`);
  }
  return res.json();
}

function normPlayer(s) {
  if (!s || typeof s !== "string") return "";
  let t = s.toLowerCase().trim();
  t = t.replace(/\./g, "");
  t = t.replace(/\bjr\b|\bsr\b|\bii\b|\biii\b|\biv\b|\bv\b/g, " ");
  t = t.replace(/[^a-z0-9\s]/g, " ");
  return t.replace(/\s+/g, " ").trim();
}

function combinerHeadshotFromPath(imgPath) {
  const path = imgPath.startsWith("/") ? imgPath : `/${imgPath}`;
  return `https://a.espncdn.com/combiner/i?img=${encodeURIComponent(path)}&w=350&h=254`;
}

function headshotUrlFromEspnLinks(doc) {
  if (!doc) return null;
  const links = doc.links;
  if (!Array.isArray(links)) return null;
  for (const l of links) {
    const href = l?.href;
    if (!href) continue;
    const m = href.match(/espn\.com\/(nfl|college-football|nba|nhl|mlb)\/player\/_\/id\/(\d+)/i);
    if (!m) continue;
    const sport = m[1].toLowerCase();
    const id = m[2];
    if (sport === "college-football") {
      return combinerHeadshotFromPath(`/i/headshots/college-football/players/full/${id}.png`);
    }
    return combinerHeadshotFromPath(`/i/headshots/nfl/players/full/${id}.png`);
  }
  return null;
}

function syntheticHeadshotFromAthleteRef(doc) {
  if (!doc) return null;
  const ref = doc.athlete?.$ref ?? "";
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

async function resolveProspectHeadshotUrl(doc) {
  if (!doc) return null;
  if (doc.headshot?.href) return doc.headshot.href;
  const ref = doc.athlete?.$ref;
  if (ref) {
    try {
      const nested = await fetchJson(ref);
      if (nested?.headshot?.href) return nested.headshot.href;
      const fromNestedLinks = headshotUrlFromEspnLinks(nested);
      if (fromNestedLinks) return fromNestedLinks;
    } catch {
      /* ignore */
    }
  }
  return headshotUrlFromEspnLinks(doc) || syntheticHeadshotFromAthleteRef(doc);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function loadProspectMap(season) {
  const map = new Map();
  const limit = 100;
  let pageIndex = 1;
  let totalPages = 1;

  while (pageIndex <= totalPages) {
    const listUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${season}/draft/athletes?limit=${limit}&pageIndex=${pageIndex}&lang=en&region=us`;
    const list = await fetchJson(listUrl);
    if (pageIndex === 1) {
      const count = typeof list.count === "number" ? list.count : 0;
      const pageSize = typeof list.pageSize === "number" ? list.pageSize : limit;
      totalPages = Math.max(1, Math.ceil(count / pageSize));
    }

    const items = list.items || [];
    if (!items.length) break;

    const refs = items
      .map((it) => (typeof it?.$ref === "string" && it.$ref.startsWith("http") ? it.$ref : null))
      .filter(Boolean);

    const CHUNK = 25;
    for (let i = 0; i < refs.length; i += CHUNK) {
      const chunk = refs.slice(i, i + CHUNK);
      const docs = await Promise.all(
        chunk.map((u) =>
          fetchJson(u).catch(() => null),
        ),
      );
      for (const doc of docs) {
        if (!doc) continue;
        const fullName = doc.fullName || doc.displayName || "";
        const key = normPlayer(fullName);
        if (!key || map.has(key)) continue;
        const headshotUrl = await resolveProspectHeadshotUrl(doc);
        const positionAbbrev = doc.position?.abbreviation ?? null;
        map.set(key, { headshotUrl, positionAbbrev, collegeDisplay: null });
      }
    }

    pageIndex += 1;
    if (pageIndex <= totalPages) {
      await sleep(150);
    }
  }
  return map;
}

async function main() {
  if (!fs.existsSync(inputCsv)) {
    console.warn(`build-entries: missing ${inputCsv}, writing empty entries.json`);
    fs.mkdirSync(path.dirname(outJson), { recursive: true });
    fs.writeFileSync(outJson, "[]\n", "utf8");
    return;
  }

  const raw = fs.readFileSync(inputCsv, "utf8");
  const rows = parseCsvRows(raw.replace(/^\uFEFF/, ""));
  if (rows.length < 2) {
    throw new Error("CSV has no data rows");
  }

  const header = rows[0].map((h) => h.trim());
  const idx = {
    id: header.indexOf("ID"),
    name: header.indexOf("Contestant Name"),
    submittedAt: header.indexOf("Submitted At"),
    picks: header.indexOf("Picks JSON"),
  };
  if (idx.id < 0 || idx.name < 0 || idx.picks < 0) {
    throw new Error(`Unexpected CSV header: ${header.join(",")}`);
  }

  const entries = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length < header.length) continue;

    const id = row[idx.id]?.trim();
    const name = row[idx.name]?.trim();
    const submittedAt =
      idx.submittedAt >= 0 ? row[idx.submittedAt]?.trim() ?? "" : "";
    let picksRaw = row[idx.picks] ?? "";
    picksRaw = picksRaw.replace(/^=/, "");
    let picks;
    try {
      picks = JSON.parse(picksRaw);
    } catch (e) {
      throw new Error(`Row ${r + 1} (${name}): invalid Picks JSON: ${e}`);
    }
    if (!Array.isArray(picks) || picks.length !== 32) {
      throw new Error(`Row ${r + 1} (${name}): expected 32 picks, got ${picks?.length}`);
    }
    for (let j = 0; j < picks.length; j++) {
      const p = picks[j];
      if (
        typeof p.pickNumber !== "number" ||
        typeof p.team !== "string" ||
        typeof p.player !== "string"
      ) {
        throw new Error(`Row ${r + 1} pick ${j + 1}: bad shape`);
      }
    }

    entries.push({
      id,
      name,
      submittedAt,
      picks,
    });
  }

  let prospectMap = new Map();
  try {
    console.log(`build-entries: loading ESPN ${SEASON} prospect headshots…`);
    prospectMap = await loadProspectMap(SEASON);
    console.log(`build-entries: indexed ${prospectMap.size} prospect names`);
  } catch (e) {
    console.warn("build-entries: prospect headshot fetch failed:", e?.message || e);
  }

  for (const ent of entries) {
    ent.picks = ent.picks.map((p) => {
      const key = normPlayer(p.player);
      const hit = key ? prospectMap.get(key) : null;
      return {
        ...p,
        headshotUrl: hit?.headshotUrl ?? null,
        positionAbbrev: hit?.positionAbbrev ?? null,
        collegeDisplay: hit?.collegeDisplay ?? null,
      };
    });
  }

  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify(entries, null, 2), "utf8");
  console.log(`build-entries: wrote ${entries.length} entries to public/entries.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
