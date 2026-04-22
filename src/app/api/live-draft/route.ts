import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import type { LiveDraftResponse, LivePick } from "@/lib/types";
import { fetchRound1LivePicks } from "@/lib/espn-draft";

function seasonFromEnv(): number {
  const y = process.env.DRAFT_SEASON;
  const n = y ? parseInt(y, 10) : 2026;
  return Number.isFinite(n) ? n : 2026;
}

async function loadManualPicks(): Promise<LivePick[] | null> {
  if (process.env.USE_MANUAL_DRAFT !== "true") {
    return null;
  }
  const fileName = process.env.DRAFT_MANUAL_FILE || "manual-draft.json";
  const filePath = path.join(process.cwd(), "public", fileName);
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as { picks?: LivePick[] };
    if (!Array.isArray(parsed.picks)) return null;
    return parsed.picks;
  } catch {
    return null;
  }
}

export async function GET() {
  const season = seasonFromEnv();
  const fetchedAt = new Date().toISOString();

  const manual = await loadManualPicks();
  if (manual) {
    const body: LiveDraftResponse = {
      season,
      fetchedAt,
      source: "manual",
      picks: manual,
    };
    return NextResponse.json(body);
  }

  try {
    const picks = await fetchRound1LivePicks(season);
    const body: LiveDraftResponse = {
      season,
      fetchedAt,
      source: "espn",
      picks,
    };
    return NextResponse.json(body);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const body: LiveDraftResponse = {
      season,
      fetchedAt,
      source: "espn",
      picks: [],
      error: message,
    };
    return NextResponse.json(body, { status: 502 });
  }
}
