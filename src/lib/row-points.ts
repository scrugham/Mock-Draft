import type { ContestantEntry, LivePick } from "@/lib/types";
import { slotHasActualPlayer } from "@/lib/live-pick-display";
import { normalizePlayerName } from "@/lib/normalize";
import { teamsMatch } from "@/lib/team-aliases";

export const POLL_MS = 20_000;

export function rowPoints(p: ContestantEntry["picks"][0], actual: LivePick[]) {
  const slot = actual.find((a) => a.overall === p.pickNumber);
  const predPlayer = normalizePlayerName(p.player);
  let pp = false;
  if (slotHasActualPlayer(slot?.playerDisplay) && predPlayer) {
    pp = normalizePlayerName(slot!.playerDisplay!) === predPlayer;
  }
  const actualWithPlayer = actual.filter((x) => slotHasActualPlayer(x.playerDisplay));
  const pt = actualWithPlayer.some(
    (x) =>
      normalizePlayerName(x.playerDisplay!) === predPlayer &&
      teamsMatch(x.teamDisplay ?? "", p.team),
  );
  return { pp, pt };
}
