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
      firstHatTrick: { team: "Portugal", detail: "C. Ronaldo — 3 vs Ghana" },
      mostYellows: { team: "Argentina", detail: "19 yellows" },
      firstOwnGoal: { team: "Switzerland", detail: "12' — Group B opener" },
      topScorer: { team: "France", detail: "K. Mbappé — 7 goals" },
      biggestWin: { team: "Spain", detail: "5–0 vs Cape Verde" },
      mostGoals: { team: "Brazil", detail: "14 goals" },
      firstGoal: { team: "Mexico", detail: "9' vs South Africa" },
      cleanSheets: { team: "Morocco", detail: "5 clean sheets" },
    },
    podium: { first: "Brazil", second: "France", third: "Argentina" },
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
    const g = top[1].goals;
    topScorer = { team: top[1].team, detail: `${top[0]} — ${g} goal${g === 1 ? "" : "s"}` };
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

  const byDate = [...played].sort((a, b) => ts(a) - ts(b));

  // ---- First goal: earliest goal chronologically, credited to the team it counted for ----
  const allGoals = [];
  for (const m of played) {
    for (const g of m.goals1 ?? []) allGoals.push({ team: m.team1, opp: m.team2, g, t: ts(m), min: g.minute ?? 999 });
    for (const g of m.goals2 ?? []) allGoals.push({ team: m.team2, opp: m.team1, g, t: ts(m), min: g.minute ?? 999 });
  }
  allGoals.sort((a, b) => a.t - b.t || a.min - b.min);
  let firstGoal = null;
  if (allGoals[0]) {
    const f = allGoals[0];
    firstGoal = { team: f.team, detail: `${f.g.name} (${f.g.minute}') vs ${f.opp}` };
  }

  // ---- Biggest win: largest winning margin in a single match ----
  let biggestWin = null;
  let bestMargin = 0;
  for (const m of byDate) {
    const [a, b] = m.score.ft;
    const margin = Math.abs(a - b);
    if (margin > bestMargin) {
      bestMargin = margin;
      const won = a > b;
      biggestWin = {
        team: won ? m.team1 : m.team2,
        detail: `${Math.max(a, b)}–${Math.min(a, b)} vs ${won ? m.team2 : m.team1}`,
      };
    }
  }

  // ---- Most goals scored (team total across all matches) ----
  const scored = {};
  for (const m of played) {
    scored[m.team1] = (scored[m.team1] || 0) + m.score.ft[0];
    scored[m.team2] = (scored[m.team2] || 0) + m.score.ft[1];
  }
  let mostGoals = null;
  const topScored = Object.entries(scored).sort((a, b) => b[1] - a[1])[0];
  if (topScored && topScored[1] > 0) mostGoals = { team: topScored[0], detail: `${topScored[1]} goals` };

  // ---- Most clean sheets (matches conceding zero) ----
  const sheets = {};
  for (const m of played) {
    if (m.score.ft[1] === 0) sheets[m.team1] = (sheets[m.team1] || 0) + 1;
    if (m.score.ft[0] === 0) sheets[m.team2] = (sheets[m.team2] || 0) + 1;
  }
  let cleanSheets = null;
  const topSheet = Object.entries(sheets).sort((a, b) => b[1] - a[1])[0];
  if (topSheet && topSheet[1] > 0) {
    cleanSheets = { team: topSheet[0], detail: `${topSheet[1]} clean sheet${topSheet[1] === 1 ? "" : "s"}` };
  }

  // ---- First hat-trick: earliest match with a player scoring 3+ (non-own) ----
  let firstHatTrick = null;
  const hatInSide = (goals, team, opp) => {
    const byPlayer = {};
    for (const g of goals ?? []) if (!g.owngoal && g.name) byPlayer[g.name] = (byPlayer[g.name] || 0) + 1;
    const hat = Object.entries(byPlayer).find(([, n]) => n >= 3);
    return hat ? { team, detail: `${hat[0]} — ${hat[1]} vs ${opp}` } : null;
  };
  for (const m of byDate) {
    const h = hatInSide(m.goals1, m.team1, m.team2) || hatInSide(m.goals2, m.team2, m.team1);
    if (h) {
      firstHatTrick = h;
      break;
    }
  }

  // ---- Podium: 1st/2nd from the Final, 3rd from the third-place match ----
  // (A penalty-shootout result reads as a draw here, so set podium manually then.)
  const podium = {};
  if (final) {
    const [a, b] = final.score.ft;
    if (a !== b) {
      podium.first = a > b ? final.team1 : final.team2;
      podium.second = a > b ? final.team2 : final.team1;
    }
  }
  const third = played.find((m) => /third/i.test(m.round || ""));
  if (third) {
    const [a, b] = third.score.ft;
    if (a !== b) podium.third = a > b ? third.team1 : third.team2;
  }

  // ---- Manual overrides (cards live here; any key wins over the computed value) ----
  const ov = loadOverrides();
  const pick = (key, computed) => ov[key] ?? computed;
  const mergedPodium = { ...(Object.keys(podium).length ? podium : {}), ...(ov.podium || {}) };

  writeOut({
    updatedAt: new Date().toISOString(),
    matchesPlayed: played.length,
    source: "openfootball" + (ov.firstRed || ov.mostYellows ? " + manual cards" : ""),
    outcomes: {
      winner: pick("winner", winner),
      firstRed: ov.firstRed ?? null,
      firstHatTrick: pick("firstHatTrick", firstHatTrick),
      mostYellows: ov.mostYellows ?? null,
      firstOwnGoal: pick("firstOwnGoal", firstOwnGoal),
      topScorer: pick("topScorer", topScorer),
      biggestWin: pick("biggestWin", biggestWin),
      mostGoals: pick("mostGoals", mostGoals),
      firstGoal: pick("firstGoal", firstGoal),
      cleanSheets: pick("cleanSheets", cleanSheets),
    },
    podium: Object.keys(mergedPodium).length ? mergedPodium : undefined,
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
