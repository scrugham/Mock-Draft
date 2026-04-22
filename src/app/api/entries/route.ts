import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import type { ContestantEntry } from "@/lib/types";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "entries.json");
  try {
    const raw = await readFile(filePath, "utf8");
    const entries = JSON.parse(raw) as ContestantEntry[];
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ entries: [] as ContestantEntry[] });
  }
}
