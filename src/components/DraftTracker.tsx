"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ContestantEntry, LiveDraftResponse } from "@/lib/types";
import { scoreEntry } from "@/lib/scoring";
import { POLL_MS } from "@/lib/row-points";
import { ClassicDraftView } from "@/components/ClassicDraftView";
import { FacesMatrixView } from "@/components/FacesMatrixView";

const VIEW_KEY = "mockDraftViewMode";

type ViewMode = "classic" | "faces";

export function DraftTracker() {
  const [live, setLive] = useState<LiveDraftResponse | null>(null);
  const [entries, setEntries] = useState<ContestantEntry[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("classic");

  useEffect(() => {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "faces" || v === "classic") {
      setView(v);
    }
  }, []);

  const setViewMode = (v: ViewMode) => {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [dRes, eRes] = await Promise.all([
        fetch("/api/live-draft", { cache: "no-store" }),
        fetch("/api/entries", { cache: "no-store" }),
      ]);
      const dJson = (await dRes.json()) as LiveDraftResponse;
      const eJson = (await eRes.json()) as { entries: ContestantEntry[] };
      setLive(dJson);
      setEntries(eJson.entries ?? []);
      setLoadErr(!dRes.ok ? dJson.error ?? `HTTP ${dRes.status}` : dJson.error ?? null);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Network error");
    }
  }, []);

  useEffect(() => {
    void fetchAll();
    const t = setInterval(() => void fetchAll(), POLL_MS);
    return () => clearInterval(t);
  }, [fetchAll]);

  const scored = useMemo(() => {
    const picks = live?.picks ?? [];
    return entries.map((entry) => ({
      entry,
      score: scoreEntry(entry, picks),
    }));
  }, [entries, live?.picks]);

  const sorted = useMemo(
    () => [...scored].sort((a, b) => b.score.total - a.score.total),
    [scored],
  );

  const leader = sorted[0]?.score.total ?? 0;

  return (
    <main className={view === "faces" ? "layout-wide" : undefined}>
      <h1>Scrugg&apos;s Mock Draft-Off — Live</h1>
      <p className="sub">
        Round 1 board and standings. Scores refresh about every {POLL_MS / 1000}s. Use{" "}
        <strong>Classic</strong> or <strong>Face board</strong> below; your choice is saved in this
        browser.
      </p>

      <div className="view-toggle" role="group" aria-label="Layout mode">
        <span className="view-toggle-label">Layout</span>
        <button
          type="button"
          className={view === "classic" ? "toggle-btn active" : "toggle-btn"}
          onClick={() => setViewMode("classic")}
        >
          Classic
        </button>
        <button
          type="button"
          className={view === "faces" ? "toggle-btn active" : "toggle-btn"}
          onClick={() => setViewMode("faces")}
        >
          Face board
        </button>
      </div>

      {view === "classic" ? (
        <ClassicDraftView
          live={live}
          sorted={sorted}
          leader={leader}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          loadErr={loadErr}
        />
      ) : (
        <FacesMatrixView live={live} sorted={sorted} loadErr={loadErr} />
      )}
    </main>
  );
}
