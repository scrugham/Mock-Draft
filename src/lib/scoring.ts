import type { ContestantEntry, LivePick, ScoreBreakdown } from "@/lib/types";
import { slotHasActualPlayer } from "@/lib/live-pick-display";
import { normalizePlayerName } from "@/lib/normalize";
import { teamsMatch } from "@/lib/team-aliases";

function pickByOverall(picks: LivePick[], overall: number): LivePick | undefined {
  return picks.find((p) => p.overall === overall);
}

/**
 * Player–Pick: each predicted row where actual player at overall N matches.
 * Player–Team: each predicted row where predicted player is taken by predicted team in R1 (any slot).
 * First round: distinct predicted players who appear anywhere in R1 actual.
 */
export function scoreEntry(entry: ContestantEntry, actual: LivePick[]): ScoreBreakdown {
  const actualWithPlayer = actual.filter((p) => slotHasActualPlayer(p.playerDisplay));

  const actualPlayersNorm = new Set(
    actualWithPlayer.map((p) => normalizePlayerName(p.playerDisplay!)),
  );

  let playerPick = 0;
  let playerTeam = 0;

  for (const row of entry.picks) {
    const slot = pickByOverall(actual, row.pickNumber);
    const predPlayer = normalizePlayerName(row.player);
    if (predPlayer.length === 0) continue;

    if (slotHasActualPlayer(slot?.playerDisplay)) {
      const actPlayer = normalizePlayerName(slot!.playerDisplay!);
      if (actPlayer === predPlayer) {
        playerPick += 1;
      }
    }

    const landed = actualWithPlayer.some(
      (p) =>
        normalizePlayerName(p.playerDisplay!) === predPlayer &&
        teamsMatch(p.teamDisplay ?? "", row.team),
    );
    if (landed) {
      playerTeam += 1;
    }
  }

  const distinctPredPlayers = new Set(
    entry.picks.map((r) => normalizePlayerName(r.player)).filter((s) => s.length > 0),
  );
  let firstRound = 0;
  for (const pn of distinctPredPlayers) {
    if (actualPlayersNorm.has(pn)) {
      firstRound += 1;
    }
  }

  return {
    playerPick,
    playerTeam,
    firstRound,
    total: playerPick + playerTeam + firstRound,
  };
}
