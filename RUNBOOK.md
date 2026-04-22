# Mock Draft-Off — draft night runbook

## Public GitHub vs private data

These paths are **gitignored** so you can use a public repository without publishing real contestants:

- `input/Entries - Grid view.csv` — your Zite export (includes email and any extra columns).
- `public/entries.json` — generated from that CSV by `npm run prebuild` (names, picks, IDs).
- `public/manual-draft.json` — optional live override you may edit during the draft.

The repo includes **`public/entries.json.example`** (`[]` only) as a shape reference. A fresh clone has no `entries.json`; `/api/entries` returns an empty list until you run `prebuild` locally.

**Typical deploy with real entries:** keep the CSV on your machine (or in a private CI secret), run `npm run prebuild`, then deploy from that directory (for example `vercel deploy`) so the generated `public/entries.json` is uploaded with the build even though it is not committed to GitHub.

## Before the draft

1. Export entries from your form provider as CSV into `input/Entries - Grid view.csv` (same columns as today: `ID`, `Contestant Name`, `Picks JSON`, etc.). See `input/README.md`.
2. From the project root, run `npm install` once, then `npm run prebuild` to regenerate `public/entries.json` from the CSV. The build script also tries to attach ESPN prospect headshots to each predicted player (for the **Face board** layout); it needs network access during `prebuild`.
3. Deploy (for example Vercel) with `DRAFT_SEASON=2026` set in the project environment variables.

## During Round 1

- The home page polls `/api/live-draft` about every 20 seconds and merges scores with `/api/entries`.
- Use **Classic** vs **Face board** in the UI; the choice is stored in the browser (`localStorage`) so you can switch back anytime without redeploying.
- If ESPN’s JSON feed fails (502 in the UI, or empty board while picks are happening), switch to the manual file:
  1. Copy `public/manual-draft.json.example` to `public/manual-draft.json` and fill in `picks` with the same shape as the live API (`overall`, `round`, `teamDisplay`, `playerDisplay`, `status`, `traded`, optional `tradeNote`). Include all 32 first-round slots for the best experience; unknown slots can use `"playerDisplay": null` and `"status": "ON_THE_CLOCK"`.
  2. Set environment variables `USE_MANUAL_DRAFT=true` and optionally `DRAFT_MANUAL_FILE=manual-draft.json`, then redeploy or restart the server.
  3. Edit `public/manual-draft.json` on disk and redeploy/restart after each batch of picks, or automate upload to your host’s file storage if you use that pattern.

## After the draft

- Set `USE_MANUAL_DRAFT=false` again for next year, or leave the manual file empty until needed.

## Scoring reference (implemented)

- **Player–Pick:** each row where the predicted player matches the actual player at that overall pick.
- **Player–Team:** each row where the predicted player is taken by the predicted team in Round 1 (any slot).
- **First round:** one point per distinct predicted player who appears in any Round 1 actual selection.
