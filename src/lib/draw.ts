// The official, fair draw.
//
// Rules:
//  1. Brazil is pinned to Quentin (guaranteed headliner) and removed from the pool.
//  2. The remaining 47 teams are shuffled with a fixed seed -> identical for everyone.
//  3. Teams are dealt round-robin to fill each person's quota (Taiwo & Quentin: 2;
//     everyone else: 4). Round-robin gives a lively, alternating reveal order.
//
// Returns both the per-person assignment (for the dashboard) and a flat ordered
// draw sequence (for the globe animation), with Brazil->Quentin first.

import { PEOPLE, PINNED, type Person } from "../data/people";
import { TEAMS, TEAM_BY_NAME, type Team } from "../data/teams";
import { mulberry32, seededShuffle } from "./rng";

export const DEFAULT_SEED = 20260611; // opening day: 2026-06-11

export interface DrawPick {
  person: Person;
  team: Team;
  pinned?: boolean;
  order: number;
}

export interface DrawResult {
  byPerson: Record<string, Team[]>;
  sequence: DrawPick[];
  seed: number;
}

export function runDraw(seed: number = DEFAULT_SEED): DrawResult {
  const byPerson: Record<string, Team[]> = Object.fromEntries(
    PEOPLE.map((p) => [p.id, [] as Team[]]),
  );
  const sequence: DrawPick[] = [];
  let order = 0;

  // 1. Pin Brazil (and any other pinned teams) first.
  const pinnedTeamNames = new Set<string>();
  for (const [personId, teamName] of Object.entries(PINNED)) {
    const team = TEAM_BY_NAME[teamName];
    if (!team) continue;
    byPerson[personId].push(team);
    sequence.push({ person: personById(personId), team, pinned: true, order: order++ });
    pinnedTeamNames.add(teamName);
  }

  // 2. Shuffle the remaining pool deterministically.
  const pool = TEAMS.filter((t) => !pinnedTeamNames.has(t.name));
  const shuffled = seededShuffle(pool, mulberry32(seed));

  // 3. Remaining slots per person after pins.
  const remaining: Record<string, number> = {};
  for (const p of PEOPLE) remaining[p.id] = p.slots - byPerson[p.id].length;

  // Round-robin deal.
  let i = 0;
  let safety = shuffled.length * PEOPLE.length;
  while (i < shuffled.length && safety-- > 0) {
    let dealtThisRound = false;
    for (const p of PEOPLE) {
      if (i >= shuffled.length) break;
      if (remaining[p.id] > 0) {
        const team = shuffled[i++];
        byPerson[p.id].push(team);
        sequence.push({ person: p, team, order: order++ });
        remaining[p.id]--;
        dealtThisRound = true;
      }
    }
    if (!dealtThisRound) break;
  }

  return { byPerson, sequence, seed };
}

function personById(id: string): Person {
  const p = PEOPLE.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown person: ${id}`);
  return p;
}
