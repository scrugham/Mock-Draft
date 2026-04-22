"use client";

import type { LiveDraftResponse, LivePick } from "@/lib/types";
import { canonicalTeamKey } from "@/lib/team-aliases";
import { nflTeamLogoUrl } from "@/lib/nfl-team-logo";
import { PlayerFaceCell } from "@/components/PlayerFaceCell";
import type { ContestantEntry, ScoredEntry } from "@/lib/types";
import { rowPoints } from "@/lib/row-points";

type Props = {
  live: LiveDraftResponse | null;
  sorted: ScoredEntry[];
  loadErr: string | null;
};

function pickForOverall(entry: ContestantEntry, overall: number) {
  return entry.picks.find((p) => p.pickNumber === overall);
}

function cellOutcome(
  pred: ReturnType<typeof pickForOverall>,
  actual: LivePick[],
  overall: number,
): "pending" | "hit" | "miss" {
  if (!pred) return "pending";
  const slot = actual.find((a) => a.overall === overall);
  const known = Boolean(slot?.playerDisplay?.trim());
  if (!known) return "pending";
  const { pp, pt } = rowPoints(pred, actual);
  return pp || pt ? "hit" : "miss";
}

export function FacesMatrixView({ live, sorted, loadErr }: Props) {
  const picks = live?.picks ?? [];

  return (
    <>
      <div className="status-bar">
        <span>
          Source:{" "}
          <strong className={live?.source === "manual" ? "warn" : "ok"}>
            {live?.source ?? "…"}
          </strong>
        </span>
        <span>
          Season: <strong>{live?.season ?? "—"}</strong>
        </span>
        <span>
          Last update:{" "}
          <strong>{live?.fetchedAt ? new Date(live.fetchedAt).toLocaleString() : "—"}</strong>
        </span>
        {loadErr ? <span className="err">API: {loadErr}</span> : null}
      </div>

      <section className="panel matrix-panel">
        <h2>Face board (one column per contestant)</h2>
        <p className="muted matrix-hint">
          Green = player–pick or player–team hit for that row. Red = pick is in and no hit. Hover a
          face for details. Logos are the predicted NFL team.
        </p>
        <div className="matrix-scroll">
          <table className="matrix-table">
            <thead>
              <tr>
                <th className="matrix-sticky-col">#</th>
                <th className="matrix-col-actual">
                  NFL
                  <span className="matrix-th-sub">actual</span>
                </th>
                {sorted.map((s) => (
                  <th key={s.entry.id} className="matrix-th-participant">
                    <span className="matrix-th-name">{s.entry.name}</span>
                    <span className="matrix-th-score">{s.score.total} pts</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 32 }, (_, i) => {
                const overall = i + 1;
                const slot = picks.find((p) => p.overall === overall);
                const actualKnown = Boolean(slot?.playerDisplay?.trim());

                return (
                  <tr key={overall}>
                    <td className="matrix-sticky-col matrix-pick-num">{overall}</td>
                    <td className="matrix-col-actual">
                      <PlayerFaceCell
                        headshotUrl={slot?.headshotUrl}
                        name={slot?.playerDisplay ?? "—"}
                        teamLogoUrl={slot?.teamLogoUrl}
                        outcome="pending"
                        titleLines={[
                          slot?.playerDisplay ? `Player: ${slot.playerDisplay}` : "On the clock",
                          slot?.positionAbbrev ? `Pos: ${slot.positionAbbrev}` : "",
                          slot?.teamDisplay ? `Team: ${slot.teamDisplay}` : "",
                          slot?.status ? `Status: ${slot.status}` : "",
                        ]}
                      />
                    </td>
                    {sorted.map((s) => {
                      const pred = pickForOverall(s.entry, overall);
                      const name = pred?.player ?? "—";
                      const key = canonicalTeamKey(pred?.team ?? "");
                      const logo = nflTeamLogoUrl(key);
                      const outcome = cellOutcome(pred, picks, overall);
                      const lines = [
                        `Predicted: ${name}`,
                        pred?.team ? `Team: ${pred.team}` : "",
                        pred?.positionAbbrev ? `Pos: ${pred.positionAbbrev}` : "",
                        actualKnown && slot?.playerDisplay
                          ? `Actual slot: ${slot.playerDisplay}`
                          : "Actual: not yet selected",
                      ];
                      return (
                        <td key={s.entry.id} className="matrix-td">
                          <PlayerFaceCell
                            headshotUrl={pred?.headshotUrl}
                            name={name}
                            teamLogoUrl={logo}
                            outcome={outcome}
                            titleLines={lines}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
