#!/usr/bin/env node
/**
 * Computes the sweepstake bonuses and writes public/scoring.json.
 *
 *   node scripts/poll-scoring.mjs            # live, from openfootball (no key)
 *   node scripts/poll-scoring.mjs --sample   # demo data
 *
 * THREE of the five bonuses come for free from openfootball (no key, no rate limit,
 * no season paywall) — they update as the tournament's worldcup.json is filled in:
 *   • Winner            — score of the Final
 *   • Top scorer's team — aggregate goal scorers across all matches
 *   • First own goal    — first `owngoal` entry, chronologically
 *
 * openfootball carries NO card data, so the two card bonuses are supplied manually via
 * scoring-overrides.json (there's exactly one "first red card" all tournament, and
 * "most yellows" moves slowly — both are trivial to set by hand):
 *   { "firstRed":   { "team": "Uruguay",   "detail": "37' vs ..." },
 *     "mostYellows":{ "team": "Argentina", "detail": "19 yellows" } }
 * Any key present in that file overrides the computed value (so you can also hand-set
 * the winner/top scorer/own goal if openfootball lags).
 *
 * Run on a schedule (cron / GitHub Action, e.g. hourly) during the tournament.
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "scoring.json");
const OVERRIDES = join(ROOT, "scoring-overrides.json");
const FEED =
  process.env.FEED_URL ||
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

function writeOut(state) {
  mkdirSync(dirname(OUT), { recursive: true });
  const json = JSON.stringify(state, null, 2) + "\n";
  writeFileSync(OUT, json);
  if (existsSync(join(ROOT, "dist"))) writeFileSync(join(ROOT, "dist", "scoring.json"), json);
  console.log(`✓ wrote ${OUT}`);
}

function loadOverrides() {
  try {
    return JSON.parse(readFileSync(OVERRIDES, "utf8"));
  } catch {
    return {};
  }
}

if (process.argv.includes("--sample")) {
  writeOut({
    updatedAt: new Date().toISOString(),
    matchesPlayed: 64,
    source: "Sample",
    outcomes: {
      winner: { team: "Brazil", detail: "Beat France 2–1 in the final" },
      firstRed: { team: "Uruguay", detail: "37' — Group H, Matchday 1" },
      mostYellows: { team: "Argentina", detail: "19 yellows" },
      firstOwnGoal: { team: "Switzerland", detail: "12' — Group B opener" },
      topScorer: { team: "France", detail: "K. Mbappé — 7 goals" },
    },
  });
  process.exit(0);
}

const isFinalRound = (r = "") => /final/i.test(r) && !/semi|quarter|round/i.test(r);

async function main() {
  const res = await fetch(FEED, { cache: "no-store" });
  if (!res.ok) throw new Error(`feed -> HTTP ${res.status}`);
  const matches = (await res.json()).matches ?? [];

  const played = matches.filter((m) => m.score && Array.isArray(m.score.ft));
  const ts = (m) => Date.parse(`${m.date}T00:00:00Z`);

  // ---- Winner: the Final's higher score ----
  let winner = null;
  const final = [...played].filter((m) => isFinalRound(m.round)).sort((a, b) => ts(b) - ts(a))[0];
  if (final) {
    const [a, b] = final.score.ft;
    const w = a > b ? final.team1 : b > a ? final.team2 : null; // (penalty shootouts: set manually)
    if (w) winner = { team: w, detail: `Champions 🏆 — beat ${a > b ? final.team2 : final.team1} ${Math.max(a, b)}–${Math.min(a, b)}` };
  }

  // ---- Top scorer: aggregate non-own goals by player, remember their team ----
  // openfootball spells the same player inconsistently ("Kylian Mbappé" vs "Mbappé"),
  // so reconcile surname-only entries into their matching full name before ranking.
  const tally = {}; // player -> { goals, team }
  for (const m of played) {
    for (const g of m.goals1 ?? []) if (!g.owngoal) bump(tally, g.name, m.team1);
    for (const g of m.goals2 ?? []) if (!g.owngoal) bump(tally, g.name, m.team2);
  }
  reconcileNames(tally);
  let topScorer = null;
  const top = Object.entries(tally).sort((a, b) => b[1].goals - a[1].goals)[0];
  if (top && top[1].goals > 0) {
    topScorer = { team: top[1].team, detail: `${top[0]} — ${top[1].goals} goals` };
  }

  // ---- First own goal (chronological). Award the COMMITTING team (the player's nation,
  //      i.e. the opponent of the side credited with the goal). ----
  let firstOwnGoal = null;
  const ogs = [];
  for (const m of played) {
    for (const g of m.goals1 ?? []) if (g.owngoal) ogs.push({ m, g, committing: m.team2 });
    for (const g of m.goals2 ?? []) if (g.owngoal) ogs.push({ m, g, committing: m.team1 });
  }
  ogs.sort((x, y) => ts(x.m) - ts(y.m) || (x.g.minute ?? 999) - (y.g.minute ?? 999));
  if (ogs[0]) {
    firstOwnGoal = {
      team: ogs[0].committing,
      detail: `${ogs[0].g.name} (${ogs[0].g.minute}') — ${ogs[0].m.team1} v ${ogs[0].m.team2}`,
    };
  }

  // ---- Manual overrides (cards live here; any key wins over the computed value) ----
  const ov = loadOverrides();

  writeOut({
    updatedAt: new Date().toISOString(),
    matchesPlayed: played.length,
    source: "openfootball" + (ov.firstRed || ov.mostYellows ? " + manual cards" : ""),
    outcomes: {
      winner: ov.winner ?? winner,
      firstRed: ov.firstRed ?? null,
      mostYellows: ov.mostYellows ?? null,
      firstOwnGoal: ov.firstOwnGoal ?? firstOwnGoal,
      topScorer: ov.topScorer ?? topScorer,
    },
  });
}

function bump(tally, name, team) {
  if (!name) return;
  tally[name] = tally[name] || { goals: 0, team };
  tally[name].goals++;
  tally[name].team = team;
}

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const lastTok = (s) => norm(s).split(/\s+/).pop();

/** Merge single-word (surname-only) entries into their unique full-name match. */
function reconcileNames(tally) {
  const names = Object.keys(tally);
  const multi = names.filter((n) => n.trim().includes(" "));
  for (const s of names) {
    if (s.trim().includes(" ")) continue; // already a full name
    const matches = multi.filter((m) => lastTok(m) === norm(s));
    if (matches.length === 1) {
      tally[matches[0]].goals += tally[s].goals;
      delete tally[s];
    }
  }
}

main().catch((err) => {
  console.error("poll failed:", err.message);
  process.exit(1);
});
