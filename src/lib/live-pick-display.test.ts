import { describe, expect, it } from "vitest";
import {
  assignDisplayStatuses,
  finalizeLivePicks,
  slotHasActualPlayer,
  stripPlaceholderPlayerDisplay,
} from "@/lib/live-pick-display";
import type { LivePick } from "@/lib/types";

describe("stripPlaceholderPlayerDisplay", () => {
  it("treats generic Player as empty", () => {
    expect(stripPlaceholderPlayerDisplay("Player")).toBeNull();
    expect(stripPlaceholderPlayerDisplay("player")).toBeNull();
    expect(stripPlaceholderPlayerDisplay("  Player  ")).toBeNull();
  });

  it("keeps real names", () => {
    expect(stripPlaceholderPlayerDisplay("Cam Ward")).toBe("Cam Ward");
  });
});

describe("slotHasActualPlayer", () => {
  it("is false for placeholders", () => {
    expect(slotHasActualPlayer("Player")).toBe(false);
    expect(slotHasActualPlayer(null)).toBe(false);
  });
});

describe("assignDisplayStatuses", () => {
  it("maps pre-draft ON_THE_CLOCK to Scheduled", () => {
    const rows = [1, 2, 3].map((overall) => ({
      overall,
      espnStatusName: "ON_THE_CLOCK",
      espnStatusDesc: "On The Clock",
      playerDisplay: null as string | null,
    }));
    const labels = assignDisplayStatuses(rows, "pre");
    expect(labels.every((s) => s === "Scheduled")).toBe(true);
  });

  it("after the first pick, ON_THE_CLOCK rows use On the clock / Pending even if round is still pre", () => {
    const rows = [
      {
        overall: 1,
        espnStatusName: "SELECTION_MADE",
        espnStatusDesc: "Selection Made",
        playerDisplay: "Cam Ward",
      },
      {
        overall: 2,
        espnStatusName: "ON_THE_CLOCK",
        espnStatusDesc: "On The Clock",
        playerDisplay: null as string | null,
      },
      {
        overall: 3,
        espnStatusName: "ON_THE_CLOCK",
        espnStatusDesc: "On The Clock",
        playerDisplay: null as string | null,
      },
    ];
    const labels = assignDisplayStatuses(rows, "pre");
    expect(labels[0]).toBe("Selection Made");
    expect(labels[1]).toBe("On the clock");
    expect(labels[2]).toBe("Pending");
  });

  it("only the first ON_THE_CLOCK reads On the clock after pre", () => {
    const rows = [1, 2, 3].map((overall) => ({
      overall,
      espnStatusName: "ON_THE_CLOCK",
      espnStatusDesc: "On The Clock",
      playerDisplay: null as string | null,
    }));
    const labels = assignDisplayStatuses(rows, "in");
    expect(labels[0]).toBe("On the clock");
    expect(labels[1]).toBe("Pending");
    expect(labels[2]).toBe("Pending");
  });

  it("treats a resolved player as Selection made even if status lags", () => {
    const rows = [
      {
        overall: 1,
        espnStatusName: "ON_THE_CLOCK",
        espnStatusDesc: "On The Clock",
        playerDisplay: "Cam Ward",
      },
    ];
    expect(assignDisplayStatuses(rows, "in")[0]).toBe("Selection made");
  });
});

describe("finalizeLivePicks", () => {
  it("strips placeholders and re-labels manual-style rows", () => {
    const picks: LivePick[] = [
      {
        overall: 1,
        round: 1,
        teamDisplay: "Test",
        playerDisplay: "Player",
        status: "ON_THE_CLOCK",
        traded: false,
      },
    ];
    const out = finalizeLivePicks(picks, undefined);
    expect(out[0]?.playerDisplay).toBeNull();
    expect(out[0]?.status).toBe("On the clock");
  });
});
