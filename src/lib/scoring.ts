// The sweepstake scoring model.
//
// Everyone buys in (320-point pot: 20 each, Quentin 80). That pot is redistributed
// entirely through five bonuses — which happen to sum to exactly 320 — awarded to
// whoever OWNS the team that achieves each milestone.

import type { DrawResult } from "./draw";
import type { TeamRecord } from "./fixtures";
import { asset } from "./asset";
import { PEOPLE, PREDICTIONS, type Person } from "../data/people";
import { TEAM_BY_NAME, type Team } from "../data/teams";

export type BonusKey =
  | "winner"
  | "firstRed"
  | "mostYellows"
  | "firstOwnGoal"
  | "topScorer"
  | "firstGoal"
  | "biggestWin"
  | "mostGoals"
  | "cleanSheets"
  | "firstHatTrick";

export interface BonusDef {
  key: BonusKey;
  label: string;
  short: string;
  points: number;
  icon: string;
  desc: string;
}

export const BONUSES: BonusDef[] = [
  { key: "winner", label: "World Cup Winner", short: "Champion", points: 150, icon: "🏆", desc: "Your team lifts the trophy" },
  { key: "firstRed", label: "First Red Card", short: "First red", points: 50, icon: "🟥", desc: "First red card of the tournament" },
  { key: "firstHatTrick", label: "First Hat-trick", short: "Hat-trick", points: 50, icon: "🎩", desc: "Team of the first player to score 3 in a game" },
  { key: "mostYellows", label: "Most Yellow Cards", short: "Most yellows", points: 40, icon: "🟨", desc: "Team with the most yellows overall" },
  { key: "firstOwnGoal", label: "First Own Goal", short: "First OG", points: 40, icon: "⚽", desc: "First own goal of the tournament" },
  { key: "topScorer", label: "Top Scorer's Team", short: "Golden Boot", points: 40, icon: "👟", desc: "Nation of the tournament's top scorer" },
  { key: "biggestWin", label: "Biggest Win", short: "Biggest win", points: 40, icon: "💥", desc: "Largest winning margin in a single match" },
  { key: "mostGoals", label: "Most Goals", short: "Most goals", points: 40, icon: "🥅", desc: "Team that scores the most goals overall" },
  { key: "firstGoal", label: "First Goal", short: "First goal", points: 30, icon: "⚡", desc: "Team that scores the tournament's first goal" },
  { key: "cleanSheets", label: "Most Clean Sheets", short: "Clean sheets", points: 30, icon: "🧤", desc: "Team that keeps the most clean sheets" },
];

export const POT_TOTAL = BONUSES.reduce((s, b) => s + b.points, 0); // 320

/** Buy-in per person. Quentin stakes 80; everyone else 20. (12*20 + 80 = 320) */
export const contributionFor = (personId: string) => (personId === "quentin" ? 80 : 20);

/** One resolved (or pending) bonus outcome, written by the poller. */
export interface Outcome {
  team: string | null; // canonical team name (matches data/teams.ts) or null if undecided
  detail?: string; // e.g. player name, minute, count — shown as context
}

/** Final tournament podium (team names), filled in once the knockouts are played. */
export interface Podium {
  first?: string;
  second?: string;
  third?: string;
}

export interface ScoringState {
  updatedAt: string | null;
  matchesPlayed: number;
  source: string; // "API-Football" | "Sample" | "Pre-tournament"
  outcomes: Partial<Record<BonusKey, Outcome>>;
  podium?: Podium;
}

// Podium-prediction points: a pick landing in its EXACT predicted slot scores big;
// landing anywhere on the podium scores a consolation.
export const PODIUM_EXACT: Record<number, number> = { 1: 40, 2: 25, 3: 15 };
export const PODIUM_ON = 10; // right team, wrong slot

export interface PredictionHit {
  team: string;
  predicted: number; // 1 | 2 | 3 (slot the person picked)
  actual: number; // 0 = not on podium, else 1 | 2 | 3
  points: number;
}

export const EMPTY_STATE: ScoringState = {
  updatedAt: null,
  matchesPlayed: 0,
  source: "Pre-tournament",
  outcomes: {},
};

export interface ResolvedBonus extends BonusDef {
  team: Team | null;
  owner: Person | null;
  detail?: string;
  decided: boolean;
}

export interface Standing {
  person: Person;
  contribution: number;
  bonus: number; // points from the bonuses
  matchPoints: number; // 3 per win + 1 per draw, across all their teams (Prem-style)
  predictionPoints: number; // from podium predictions
  predictions: PredictionHit[]; // their picks + how each scored
  played: number; // matches their teams have played
  total: number; // bonus + matchPoints + predictionPoints
  bonuses: BonusKey[]; // bonuses this person currently holds
  teamCount: number;
}

/** Score a person's podium picks against the actual podium. */
export function scorePredictions(personId: string, podium?: Podium): PredictionHit[] {
  const picks = PREDICTIONS[personId];
  if (!picks) return [];
  const actualOf = (team: string) =>
    podium?.first === team ? 1 : podium?.second === team ? 2 : podium?.third === team ? 3 : 0;
  return picks.map((team, i) => {
    const predicted = i + 1;
    const actual = actualOf(team);
    const points = actual === 0 ? 0 : actual === predicted ? PODIUM_EXACT[predicted] : PODIUM_ON;
    return { team, predicted, actual, points };
  });
}

export interface Standings {
  bonuses: ResolvedBonus[];
  table: Standing[];
  potClaimed: number;
}

/** League points: 3 for a win, 1 for a draw, 0 for a loss. */
export const POINTS = { win: 3, draw: 1, loss: 0 } as const;

/** Reverse map: team name -> the person who drew it. */
function ownerIndex(draw: DrawResult): Map<string, Person> {
  const idx = new Map<string, Person>();
  for (const p of PEOPLE) {
    for (const t of draw.byPerson[p.id] ?? []) idx.set(t.name, p);
  }
  return idx;
}

export function computeStandings(
  state: ScoringState,
  draw: DrawResult,
  records?: Map<string, TeamRecord>,
): Standings {
  const owners = ownerIndex(draw);

  const bonuses: ResolvedBonus[] = BONUSES.map((b) => {
    const oc = state.outcomes[b.key];
    const team = oc?.team ? TEAM_BY_NAME[oc.team] ?? null : null;
    const owner = oc?.team ? owners.get(oc.team) ?? null : null;
    return { ...b, team, owner, detail: oc?.detail, decided: !!oc?.team };
  });

  const bonusPts: Record<string, number> = {};
  const held: Record<string, BonusKey[]> = {};
  for (const p of PEOPLE) {
    bonusPts[p.id] = 0;
    held[p.id] = [];
  }
  for (const b of bonuses) {
    if (b.owner) {
      bonusPts[b.owner.id] += b.points;
      held[b.owner.id].push(b.key);
    }
  }

  const table: Standing[] = PEOPLE.map((p) => {
    // Prem-style match points across this person's teams (3 win / 1 draw / 0 loss).
    let matchPoints = 0;
    let played = 0;
    for (const t of draw.byPerson[p.id] ?? []) {
      const r = records?.get(t.name);
      if (r) {
        matchPoints += r.pts;
        played += r.w + r.d + r.l;
      }
    }
    const bonus = bonusPts[p.id];
    const predictions = scorePredictions(p.id, state.podium);
    const predictionPoints = predictions.reduce((s, h) => s + h.points, 0);
    return {
      person: p,
      contribution: contributionFor(p.id),
      bonus,
      matchPoints,
      predictionPoints,
      predictions,
      played,
      total: bonus + matchPoints + predictionPoints,
      bonuses: held[p.id],
      teamCount: draw.byPerson[p.id]?.length ?? 0,
    };
  }).sort(
    (a, b) =>
      b.total - a.total ||
      b.matchPoints - a.matchPoints ||
      a.person.name.localeCompare(b.person.name),
  );

  const potClaimed = bonuses.filter((b) => b.decided).reduce((s, b) => s + b.points, 0);
  return { bonuses, table, potClaimed };
}

/** Fetch the live scoring state written by the poller; fall back to empty. */
export async function loadScoring(): Promise<ScoringState> {
  try {
    const res = await fetch(asset(`scoring.json?t=${Math.floor(Date.now() / 30000)}`), {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as ScoringState;
    return { ...EMPTY_STATE, ...json, outcomes: json.outcomes ?? {} };
  } catch {
    return EMPTY_STATE;
  }
}

/** Clearly-labelled sample so the UI can be previewed before kickoff. */
export const SAMPLE_STATE: ScoringState = {
  updatedAt: null,
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
    firstGoal: { team: "Mexico", detail: "9' — opening match" },
    cleanSheets: { team: "Morocco", detail: "5 clean sheets" },
  },
  podium: { first: "Brazil", second: "France", third: "Argentina" },
};
