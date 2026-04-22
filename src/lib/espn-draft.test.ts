import { describe, expect, it } from "vitest";
import {
  combinerHeadshotFromPath,
  headshotUrlFromAthleteDoc,
  headshotUrlFromEspnLinks,
} from "@/lib/espn-draft";

describe("combinerHeadshotFromPath", () => {
  it("wraps ESPN image paths in combiner URLs", () => {
    const u = combinerHeadshotFromPath("/i/headshots/college-football/players/full/1.png");
    expect(u).toContain("combiner/i");
    expect(u).toContain(encodeURIComponent("/i/headshots/college-football/players/full/1.png"));
  });
});

describe("headshotUrlFromAthleteDoc", () => {
  it("uses inlined headshot when present", () => {
    const doc = {
      headshot: { href: "https://example.com/h.png" },
    };
    expect(headshotUrlFromAthleteDoc(doc)).toBe("https://example.com/h.png");
  });

  it("builds combiner college headshot from nested athlete ref", () => {
    const doc = {
      athlete: {
        $ref: "http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/athletes/4950400?lang=en&region=us",
      },
    };
    const u = headshotUrlFromAthleteDoc(doc);
    expect(u).toContain("combiner");
    expect(u).toContain("4950400");
  });

  it("builds combiner nfl headshot from nested athlete ref", () => {
    const doc = {
      athlete: {
        $ref: "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/12345?lang=en&region=us",
      },
    };
    const u = headshotUrlFromAthleteDoc(doc);
    expect(u).toContain("combiner");
    expect(u).toContain("12345");
  });
});

describe("headshotUrlFromEspnLinks", () => {
  it("uses nfl player card id from links", () => {
    const doc = {
      links: [
        {
          href: "https://www.espn.com/nfl/player/_/id/4688380/cam-ward",
        },
      ],
    };
    const u = headshotUrlFromEspnLinks(doc);
    expect(u).toContain("combiner");
    expect(u).toContain("4688380");
  });

  it("uses college player card id from links", () => {
    const doc = {
      links: [
        {
          href: "https://www.espn.com/college-football/player/_/id/4950400/arvell-reese",
        },
      ],
    };
    const u = headshotUrlFromEspnLinks(doc);
    expect(u).toContain("combiner");
    expect(u).toContain("4950400");
  });
});
