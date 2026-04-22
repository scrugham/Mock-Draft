import type { LivePick } from "@/lib/types";

/** ESPN sometimes attaches a generic placeholder name before the real pick is wired up. */
export function stripPlaceholderPlayerDisplay(name: string | null): string | null {
  if (!name) return null;
  const t = name.trim();
  if (!t) return null;
  if (t.toLowerCase() === "player") return null;
  return t;
}

export function slotHasActualPlayer(playerDisplay: string | null | undefined): boolean {
  return stripPlaceholderPlayerDisplay(playerDisplay ?? null) !== null;
}

type StatusRow = {
  overall: number;
  espnStatusName: string;
  espnStatusDesc?: string | null;
  playerDisplay: string | null;
};

/**
 * ESPN uses ON_THE_CLOCK as a template for every unfilled slot before the draft and for future
 * slots. Only the lowest overall with that code should read as "live" on the clock once the
 * round is underway. Before the draft ({@link roundState} === "pre"), show "Scheduled" instead.
 */
export function assignDisplayStatuses(rows: StatusRow[], roundState: string | undefined): string[] {
  const anySelectionMade = rows.some((r) => r.espnStatusName === "SELECTION_MADE");
  /** Full template board before the draft: every slot is ON_THE_CLOCK and no pick is in yet. */
  const treatAsPreDraft = roundState === "pre" && !anySelectionMade;

  const onClock = rows.filter((r) => r.espnStatusName === "ON_THE_CLOCK");
  const firstOnClock =
    onClock.length > 0 ? Math.min(...onClock.map((r) => r.overall)) : Number.POSITIVE_INFINITY;
  const finiteFirst = Number.isFinite(firstOnClock) ? firstOnClock : null;

  return rows.map((r) => {
    const name = r.espnStatusName;
    if (name === "SELECTION_MADE") {
      return r.espnStatusDesc?.trim() || "Selection made";
    }
    if (name === "ON_THE_CLOCK") {
      if (slotHasActualPlayer(r.playerDisplay)) {
        // Status can lag behind the athlete doc; do not use "On The Clock" description here.
        return "Selection made";
      }
      if (treatAsPreDraft) {
        return "Scheduled";
      }
      if (finiteFirst !== null && r.overall === finiteFirst) {
        return "On the clock";
      }
      return "Pending";
    }
    const fromDesc = r.espnStatusDesc?.trim();
    if (fromDesc) return fromDesc;
    return name.replace(/_/g, " ");
  });
}

export function finalizeLivePicks(picks: LivePick[], roundState: string | undefined): LivePick[] {
  const stripped = picks.map((p) => ({
    ...p,
    playerDisplay: stripPlaceholderPlayerDisplay(p.playerDisplay),
  }));
  const labels = assignDisplayStatuses(
    stripped.map((p) => ({
      overall: p.overall,
      espnStatusName: p.status,
      espnStatusDesc: null,
      playerDisplay: p.playerDisplay,
    })),
    roundState,
  );
  return stripped.map((p, i) => ({ ...p, status: labels[i] ?? p.status }));
}
