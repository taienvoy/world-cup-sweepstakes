# World Cup 2026 · Office Sweepstakes 🌍⚽

A best-in-class live dashboard + animated draw ceremony for our office World Cup
sweepstakes. 48 nations, 13 of us, one trophy.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

## Deploy (GitHub Pages)

The site is static and ships with a deploy workflow (`.github/workflows/deploy.yml`).

1. Create an empty repo on github.com (no README), then:
   ```bash
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Done. Live at `https://<you>.github.io/<repo>/`.

The workflow runs on every push, on **manual trigger** (Actions → Run workflow), and
**hourly** — each run refreshes `scoring.json` from openfootball and redeploys, so the
leaderboard stays live with no manual work. Asset paths are base-aware (`src/lib/asset.ts`
+ `VITE_BASE`), so it works under the Pages subpath automatically — no matter the repo name.

For an office screen: open the URL in the display's browser (kiosk/full-screen). The
chosen theme persists per-browser in localStorage.

## What's inside

**Three pages** (hash router):

- **`/` — Dashboard.** A live hero with a real-time countdown to the opening match,
  a horizontally-scrolling strip of upcoming fixtures (kick-off shown in *your* local
  timezone **and** the venue's local time), and "The Squad" — every participant's
  portrait above the teams they drew.
- **`/leaderboard` — Live scoring.** The 320-point pot redistributed through five
  bonuses, with a live leaderboard. See **Scoring** below.
- **`/draw` — The Draw.** A true 3D rotating Earth (Three.js / react-three-fiber) with
  all 48 flag SVGs orbiting it on a fibonacci sphere. Press start and teams fly off the
  globe to each person's portrait, docking beneath them, until all 48 are assigned.

## The draw logic (`src/lib/draw.ts`)

The draw is **locked & fair**: a fixed seed (`DEFAULT_SEED`) means the result is
identical for everyone on every visit and can't be gamed.

1. **Brazil is pinned to Quentin** (guaranteed headliner) and removed from the pool.
2. The remaining 47 teams are shuffled with a seeded PRNG (`mulberry32`, `src/lib/rng.ts`).
3. Teams are dealt **round-robin** to fill each person's quota.

**Quotas:** Quentin and Taiwo get **2** teams each; everyone else gets **4**
(11 × 4 + 2 × 2 = 48). The ⚙ Re-roll button on the Draw page generates a *practice*
draw (badge turns to "Practice Re-roll"); "Restore official" returns to the locked result.

To change the pins/quotas, edit `src/data/people.ts` (`slots` and `PINNED`).

## Scoring (`src/lib/scoring.ts`, `src/pages/Scoring.tsx`)

Everyone buys in — a **320-point pot** (20 each; Quentin stakes 80). That pot is
redistributed entirely through **five bonuses**, which sum to exactly 320, awarded to
whoever *owns* the team that achieves each milestone:

| Bonus | Points | Resolved from | Auto? |
|---|---|---|---|
| World Cup Winner | 150 | score of the Final | ✅ auto¹ |
| Top Scorer's Team | 40 | aggregate goal scorers | ✅ auto |
| First Own Goal | 40 | first `owngoal`, chronological | ✅ auto |
| First Red Card | 50 | — | ✍️ manual² |
| Most Yellow Cards | 40 | — | ✍️ manual² |

The leaderboard ranks people by **points won** (with net vs. their stake). A clearly
labelled **"Preview sample outcomes"** toggle lets you see a populated board before kickoff.

### Live results — the poller (`scripts/poll-scoring.mjs`)

The poller reads the **free, no-key [openfootball feed](https://github.com/openfootball/worldcup.json)**
(the same source as the fixtures) and writes `public/scoring.json`, which the frontend
fetches and re-polls every 60s. No API key, no rate limit, no season paywall.

```bash
npm run poll            # live: compute from openfootball -> public/scoring.json
npm run poll:sample     # write demo data
```

**Three of five bonuses resolve automatically** from openfootball as played matches fill
in (including the 150-point Winner). The poller reconciles inconsistent scorer name
spellings (e.g. "Mbappé" vs "Kylian Mbappé") before ranking the Golden Boot.

¹ **Winner caveat:** openfootball stores a penalty-shootout final as a draw, so if the
final goes to penalties the winner must be set manually (see overrides).

² **Cards aren't in any free 2026 feed.** Set the two card bonuses by hand in
`scoring-overrides.json` — there's exactly one "first red card" all tournament, and
"most yellows" moves slowly:

```jsonc
{ "firstRed":    { "team": "Uruguay",   "detail": "37' vs Spain" },
  "mostYellows": { "team": "Argentina", "detail": "19 yellows" } }
```

Any key in that file overrides the computed value (so you can also hand-set the winner,
top scorer, or own goal if the feed lags). Run the poller on a schedule (cron / GitHub
Action, ~hourly). Full auto-cards would require a **paid** football API (e.g.
API-Football's paid plan — the free tier is locked to seasons 2022–2024 and can't return
2026 data).

## Data & APIs

- **Fixtures:** [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json)
  — free, public-domain, **no API key**. A snapshot is bundled at
  `src/data/matches.json` (works offline); on load the app refreshes from the live feed
  and silently falls back to the snapshot if offline. See `src/lib/fixtures.ts`.
- **Timezones:** kick-off strings like `"13:00 UTC-6"` are parsed into absolute instants
  with **Luxon** and rendered in the viewer's local zone (`Intl`) + the venue's local time.
- **Flags:** the bundled [flag-icons](https://github.com/lipis/flag-icons) SVG set, served
  from `public/flags/4x3/`. Team → ISO code mapping lives in `src/data/teams.ts`.
- **Want live scores during the tournament?** Swap/augment the feed with a keyed API like
  [BALLDONTLIE FIFA](https://fifa.balldontlie.io/) or [API-Football](https://www.api-football.com/).

## Assets (`public/textures/`)

- `earth_day/normal/specular.jpg`, `earth_clouds.png` — equirectangular maps for the 3D globe.
- `earth_hemisphere.png` — the supplied 2048² Earth render, used as the Dashboard countdown centerpiece.
- `bg.jpg` — the supplied FIFA 2026 background, layered into the atmospheric backdrop.

## Tech

Vite · React 19 · TypeScript · Three.js + @react-three/fiber + drei · GSAP/Framer Motion ·
Tailwind v4 · Luxon. The Draw page (Three.js) is lazy-loaded so the Dashboard stays light.
