import { describe, expect, it } from "vitest";
import type { ContestantEntry, LivePick } from "@/lib/types";
import { scoreEntry } from "@/lib/scoring";

function pick(
  overall: number,
  team: string,
  player: string,
  status = "SELECTION_MADE",
): LivePick {
  return {
    overall,
    round: 1,
    teamDisplay: team,
    playerDisplay: player,
    status,
    traded: false,
  };
}

describe("scoreEntry", () => {
  it("awards player-pick when player matches at overall slot", () => {
    const actual: LivePick[] = [
      pick(1, "Las Vegas Raiders", "Cam Ward"),
      pick(2, "New York Jets", "Travis Hunter"),
    ];
    const entry: ContestantEntry = {
      id: "1",
      name: "A",
      submittedAt: "",
      picks: [
        { pickNumber: 1, team: "Las Vegas Raiders", player: "Cam Ward" },
        { pickNumber: 2, team: "Miami Dolphins", player: "Wrong Name" },
      ],
    };
    const s = scoreEntry(entry, actual);
    expect(s.playerPick).toBe(1);
  });

  it("awards player-team when player lands on predicted team at a different slot", () => {
    const actual: LivePick[] = [
      pick(1, "Las Vegas Raiders", "Cam Ward"),
      pick(2, "New York Jets", "Travis Hunter"),
    ];
    const entry: ContestantEntry = {
      id: "1",
      name: "A",
      submittedAt: "",
      picks: [
        { pickNumber: 1, team: "New York Jets", player: "Travis Hunter" },
      ],
    };
    const s = scoreEntry(entry, actual);
    expect(s.playerPick).toBe(0);
    expect(s.playerTeam).toBe(1);
  });

  it("counts first-round once per distinct predicted player", () => {
    const actual: LivePick[] = [pick(1, "Las Vegas Raiders", "Cam Ward")];
    const entry: ContestantEntry = {
      id: "1",
      name: "A",
      submittedAt: "",
      picks: [
        { pickNumber: 1, team: "Las Vegas Raiders", player: "Cam Ward" },
        { pickNumber: 2, team: "New York Jets", player: "Cam Ward" },
      ],
    };
    const s = scoreEntry(entry, actual);
    expect(s.firstRound).toBe(1);
  });

  it("normalizes Jr. suffix for matching", () => {
    const actual: LivePick[] = [pick(1, "Tampa Bay Buccaneers", "Rueben Bain Jr.")];
    const entry: ContestantEntry = {
      id: "1",
      name: "A",
      submittedAt: "",
      picks: [{ pickNumber: 1, team: "Tampa Bay Buccaneers", player: "Rueben Bain Jr" }],
    };
    const s = scoreEntry(entry, actual);
    expect(s.playerPick).toBe(1);
    expect(s.playerTeam).toBe(1);
  });

  it("matches team aliases (Giants vs New York Giants)", () => {
    const actual: LivePick[] = [pick(5, "New York Giants", "Sonny Styles")];
    const entry: ContestantEntry = {
      id: "1",
      name: "A",
      submittedAt: "",
      picks: [{ pickNumber: 5, team: "New York Giants", player: "Sonny Styles" }],
    };
    const s = scoreEntry(entry, actual);
    expect(s.playerTeam).toBe(1);
  });
});
