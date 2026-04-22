"use client";

import { useCallback, useState } from "react";

type Props = {
  headshotUrl?: string | null;
  name: string;
  titleLines: string[];
  teamLogoUrl?: string | null;
  /** pending | hit | miss */
  outcome: "pending" | "hit" | "miss";
};

function initials(name: string): string {
  const t = name.trim();
  if (!t || t === "—") return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

export function PlayerFaceCell({ headshotUrl, name, titleLines, teamLogoUrl, outcome }: Props) {
  const [imgOk, setImgOk] = useState(Boolean(headshotUrl));

  const onImgError = useCallback(() => {
    setImgOk(false);
  }, []);

  const cellClass =
    outcome === "hit" ? "matrix-cell hit" : outcome === "miss" ? "matrix-cell miss" : "matrix-cell pending";

  const tip = titleLines.filter(Boolean).join("\n");

  return (
    <div className={cellClass} title={tip}>
      <div className="matrix-cell-logos">
        {teamLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={teamLogoUrl} alt="" className="matrix-team-ico" />
        ) : (
          <span className="matrix-team-ico placeholder" />
        )}
      </div>
      <div className="matrix-face-wrap">
        {headshotUrl && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={headshotUrl}
            alt=""
            className="matrix-face"
            onError={onImgError}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="matrix-face-fallback" aria-hidden>
            {initials(name)}
          </div>
        )}
      </div>
      <div className="matrix-name-short">{name.split(" ").slice(-1)[0] ?? name}</div>
    </div>
  );
}
