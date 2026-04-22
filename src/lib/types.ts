export type MockPick = {
  pickNumber: number;
  team: string;
  player: string;
  /** Filled at build time from ESPN draft prospect pool when available */
  headshotUrl?: string | null;
  positionAbbrev?: string | null;
  collegeDisplay?: string | null;
};

export type ContestantEntry = {
  id: string;
  name: string;
  submittedAt: string;
  picks: MockPick[];
};

export type LivePick = {
  overall: number;
  round: number;
  teamDisplay: string | null;
  playerDisplay: string | null;
  status: string;
  traded: boolean;
  tradeNote?: string;
  headshotUrl?: string | null;
  positionAbbrev?: string | null;
  collegeDisplay?: string | null;
  teamLogoUrl?: string | null;
};

export type LiveDraftResponse = {
  season: number;
  fetchedAt: string;
  source: "espn" | "manual";
  picks: LivePick[];
  error?: string;
};

export type ScoreBreakdown = {
  playerPick: number;
  playerTeam: number;
  firstRound: number;
  total: number;
};

export type ScoredEntry = {
  entry: ContestantEntry;
  score: ScoreBreakdown;
};
