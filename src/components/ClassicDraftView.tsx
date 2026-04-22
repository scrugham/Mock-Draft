"use client";

import { useEffect, useRef } from "react";
import type { LiveDraftResponse, ScoredEntry } from "@/lib/types";
import { rowPoints } from "@/lib/row-points";

type Props = {
  live: LiveDraftResponse | null;
  sorted: ScoredEntry[];
  leader: number;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  loadErr: string | null;
};

export function ClassicDraftView({ live, sorted, leader, selectedId, setSelectedId, loadErr }: Props) {
  const selected = sorted.find((s) => s.entry.id === selectedId) ?? null;
  const entryDetailRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!selectedId) return;
    const el = entryDetailRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [selectedId]);

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

      <div className="grid two">
        <section className="panel">
          <h2>Standings</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Contestant</th>
                  <th className="num">Total</th>
                  <th className="num">P–Pick</th>
                  <th className="num">P–Team</th>
                  <th className="num">R1</th>
                  <th className="num">Δ</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => (
                  <tr key={s.entry.id}>
                    <td className="num">{i + 1}</td>
                    <td>
                      <button
                        type="button"
                        className="link"
                        onClick={() => setSelectedId(s.entry.id)}
                      >
                        {s.entry.name}
                      </button>
                    </td>
                    <td className="num">{s.score.total}</td>
                    <td className="num">{s.score.playerPick}</td>
                    <td className="num">{s.score.playerTeam}</td>
                    <td className="num">{s.score.firstRound}</td>
                    <td className="num">{leader - s.score.total}</td>
                  </tr>
                ))}
                {!sorted.length ? (
                  <tr>
                    <td colSpan={7} className="muted">
                      No entries loaded. Run <code>npm run prebuild</code> after updating the CSV.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <h2>Live Round 1 (actual)</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Team</th>
                  <th>Player</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(live?.picks ?? []).map((p) => (
                  <tr key={p.overall}>
                    <td className="num">{p.overall}</td>
                    <td>
                      {p.teamLogoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.teamLogoUrl} alt="" className="inline-team-ico" />
                      ) : null}{" "}
                      {p.teamDisplay ?? "—"}
                    </td>
                    <td>{p.playerDisplay ?? "—"}</td>
                    <td className="muted">{p.status}</td>
                  </tr>
                ))}
                {!live?.picks?.length ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      No picks yet (pre-draft or load error).
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selected ? (
        <section
          ref={entryDetailRef}
          className="panel entry-detail-panel"
          style={{ marginTop: "1rem" }}
        >
          <div className="detail-head">
            <h2 style={{ margin: 0 }}>{selected.entry.name}</h2>
            <div className="score-pill">
              Total <strong>{selected.score.total}</strong> · P–Pick{" "}
              {selected.score.playerPick} · P–Team {selected.score.playerTeam} · R1{" "}
              {selected.score.firstRound}
            </div>
            <button type="button" className="link" onClick={() => setSelectedId(null)}>
              Close
            </button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>OVR</th>
                  <th>Pred team</th>
                  <th>Pred player</th>
                  <th>Actual team</th>
                  <th>Actual player</th>
                  <th>Hits</th>
                </tr>
              </thead>
              <tbody>
                {selected.entry.picks.map((p) => {
                  const slot = (live?.picks ?? []).find((a) => a.overall === p.pickNumber);
                  const { pp, pt } = rowPoints(p, live?.picks ?? []);
                  return (
                    <tr key={p.pickNumber}>
                      <td className="num">{p.pickNumber}</td>
                      <td>{p.team}</td>
                      <td>{p.player}</td>
                      <td>{slot?.teamDisplay ?? "—"}</td>
                      <td>{slot?.playerDisplay ?? "—"}</td>
                      <td>
                        {pp ? (
                          <span className="badge pp" title="Player–pick match">
                            P–Pick
                          </span>
                        ) : null}
                        {pt ? (
                          <span className="badge pt" title="Player–team match (Round 1)">
                            P–Team
                          </span>
                        ) : null}
                        {!pp && !pt ? <span className="muted">—</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}
