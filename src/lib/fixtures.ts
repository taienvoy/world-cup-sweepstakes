// Loads the 2026 fixtures (bundled snapshot from openfootball, refreshed from the
// live feed when online) and turns "13:00 UTC-6" into real instants we can show in
// the viewer's local timezone and in the venue's local time.

import { DateTime } from "luxon";
import bundled from "../data/matches.json";
import { TEAM_BY_NAME, type Team } from "../data/teams";

const LIVE_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

interface RawMatch {
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  ground?: string;
}

export interface Side {
  /** Real team if known, else null for a knockout placeholder. */
  team: Team | null;
  /** Raw label, e.g. "Brazil" or "Winner Group C". */
  label: string;
}

export interface Match {
  round: string;
  group?: string;
  ground?: string;
  kickoff: DateTime; // absolute instant (UTC under the hood)
  venueOffset: string; // e.g. "UTC-6"
  side1: Side;
  side2: Side;
  isKnockout: boolean;
}

const PLACEHOLDER_LABELS: Record<string, string> = {};
function prettyLabel(raw: string): string {
  if (TEAM_BY_NAME[raw]) return raw;
  if (PLACEHOLDER_LABELS[raw]) return PLACEHOLDER_LABELS[raw];
  if (/^[12][A-L]$/.test(raw)) return `${raw[0] === "1" ? "Winner" : "Runner-up"} Grp ${raw[1]}`;
  if (/^3/.test(raw)) return `3rd ${raw.slice(1)}`;
  if (/^W\d+$/.test(raw)) return `Winner R${raw.slice(1)}`;
  if (/^L\d+$/.test(raw)) return `Loser ${raw.slice(1)}`;
  return raw;
}

function toSide(raw: string): Side {
  const team = TEAM_BY_NAME[raw] ?? null;
  return { team, label: team ? team.name : prettyLabel(raw) };
}

function parseKickoff(date: string, time: string): { dt: DateTime; offset: string } {
  // time looks like "20:00 UTC-6"
  const m = time.match(/(\d{1,2}):(\d{2})\s*UTC([+-]\d{1,2})?/);
  const hh = m ? m[1] : "12";
  const mm = m ? m[2] : "00";
  const off = m && m[3] ? `UTC${m[3]}` : "UTC+0";
  const dt = DateTime.fromFormat(`${date} ${hh}:${mm}`, "yyyy-MM-dd H:mm", { zone: off });
  return { dt, offset: off };
}

function normalize(raw: RawMatch[]): Match[] {
  return raw
    .map((r) => {
      const { dt, offset } = parseKickoff(r.date, r.time);
      const side1 = toSide(r.team1);
      const side2 = toSide(r.team2);
      return {
        round: r.round,
        group: r.group,
        ground: r.ground,
        kickoff: dt,
        venueOffset: offset,
        side1,
        side2,
        isKnockout: !side1.team || !side2.team || !r.group,
      };
    })
    .filter((m) => m.kickoff.isValid)
    .sort((a, b) => a.kickoff.toMillis() - b.kickoff.toMillis());
}

let cache: Match[] | null = null;

export function loadFixturesSync(): Match[] {
  if (!cache) cache = normalize((bundled as { matches: RawMatch[] }).matches);
  return cache;
}

/** Try to refresh from the live feed; falls back silently to the bundled snapshot. */
export async function refreshFixtures(): Promise<Match[]> {
  try {
    const res = await fetch(LIVE_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as { matches: RawMatch[] };
    cache = normalize(json.matches);
  } catch {
    /* offline / rate-limited — keep bundled data */
  }
  return loadFixturesSync();
}

export function upcoming(all: Match[], from: DateTime, limit = 12): Match[] {
  return all.filter((m) => m.kickoff >= from.minus({ hours: 2 })).slice(0, limit);
}

export function matchesForTeam(all: Match[], teamName: string): Match[] {
  return all.filter(
    (m) => m.side1.team?.name === teamName || m.side2.team?.name === teamName,
  );
}
