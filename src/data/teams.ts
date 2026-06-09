// Canonical team list for the 2026 World Cup.
// `name` matches the openfootball fixtures feed exactly so matches join cleanly.
// `code` is the flag-icons ISO code (file lives at /flags/4x3/<code>.svg).
// `color` is a national accent used for card glows and the globe orbit ribbons.

export type Confederation = "AFC" | "CAF" | "CONCACAF" | "CONMEBOL" | "OFC" | "UEFA";

export interface Team {
  name: string;
  code: string;
  confed: Confederation;
  group: string;
  color: string;
  debut?: boolean;
  host?: boolean;
}

export const TEAMS: Team[] = [
  // AFC
  { name: "Australia", code: "au", confed: "AFC", group: "D", color: "#f9c623" },
  { name: "Iran", code: "ir", confed: "AFC", group: "G", color: "#239f40" },
  { name: "Iraq", code: "iq", confed: "AFC", group: "I", color: "#ce1126" },
  { name: "Japan", code: "jp", confed: "AFC", group: "F", color: "#1e3a8a" },
  { name: "Jordan", code: "jo", confed: "AFC", group: "J", color: "#007a3d", debut: true },
  { name: "Qatar", code: "qa", confed: "AFC", group: "B", color: "#8d1b3d" },
  { name: "Saudi Arabia", code: "sa", confed: "AFC", group: "H", color: "#006c35" },
  { name: "South Korea", code: "kr", confed: "AFC", group: "A", color: "#cd2e3a" },
  { name: "Uzbekistan", code: "uz", confed: "AFC", group: "K", color: "#1eb53a", debut: true },

  // CAF
  { name: "Algeria", code: "dz", confed: "CAF", group: "J", color: "#006233" },
  { name: "Cape Verde", code: "cv", confed: "CAF", group: "H", color: "#003893", debut: true },
  { name: "DR Congo", code: "cd", confed: "CAF", group: "K", color: "#007fff" },
  { name: "Egypt", code: "eg", confed: "CAF", group: "G", color: "#c8102e" },
  { name: "Ghana", code: "gh", confed: "CAF", group: "L", color: "#fcd116" },
  { name: "Ivory Coast", code: "ci", confed: "CAF", group: "E", color: "#f77f00" },
  { name: "Morocco", code: "ma", confed: "CAF", group: "C", color: "#c1272d" },
  { name: "Senegal", code: "sn", confed: "CAF", group: "I", color: "#00853f" },
  { name: "South Africa", code: "za", confed: "CAF", group: "A", color: "#007749" },
  { name: "Tunisia", code: "tn", confed: "CAF", group: "F", color: "#e70013" },

  // CONCACAF
  { name: "Canada", code: "ca", confed: "CONCACAF", group: "B", color: "#ff0000", host: true },
  { name: "Curaçao", code: "cw", confed: "CONCACAF", group: "E", color: "#002b7f", debut: true },
  { name: "Haiti", code: "ht", confed: "CONCACAF", group: "C", color: "#00209f" },
  { name: "Mexico", code: "mx", confed: "CONCACAF", group: "A", color: "#006847", host: true },
  { name: "Panama", code: "pa", confed: "CONCACAF", group: "L", color: "#005293" },
  { name: "USA", code: "us", confed: "CONCACAF", group: "D", color: "#0a3161", host: true },

  // CONMEBOL
  { name: "Argentina", code: "ar", confed: "CONMEBOL", group: "J", color: "#6cace4" },
  { name: "Brazil", code: "br", confed: "CONMEBOL", group: "C", color: "#ffdf00" },
  { name: "Colombia", code: "co", confed: "CONMEBOL", group: "K", color: "#fcd116" },
  { name: "Ecuador", code: "ec", confed: "CONMEBOL", group: "E", color: "#ffd100" },
  { name: "Paraguay", code: "py", confed: "CONMEBOL", group: "D", color: "#d52b1e" },
  { name: "Uruguay", code: "uy", confed: "CONMEBOL", group: "H", color: "#7b9fd4" },

  // OFC
  { name: "New Zealand", code: "nz", confed: "OFC", group: "G", color: "#00247d" },

  // UEFA
  { name: "Austria", code: "at", confed: "UEFA", group: "J", color: "#ed2939" },
  { name: "Belgium", code: "be", confed: "UEFA", group: "G", color: "#f3d02f" },
  { name: "Bosnia & Herzegovina", code: "ba", confed: "UEFA", group: "B", color: "#002395" },
  { name: "Croatia", code: "hr", confed: "UEFA", group: "L", color: "#ff0000" },
  { name: "Czech Republic", code: "cz", confed: "UEFA", group: "A", color: "#11457e" },
  { name: "England", code: "gb-eng", confed: "UEFA", group: "L", color: "#cf142b" },
  { name: "France", code: "fr", confed: "UEFA", group: "I", color: "#0055a4" },
  { name: "Germany", code: "de", confed: "UEFA", group: "E", color: "#1a1a1a" },
  { name: "Netherlands", code: "nl", confed: "UEFA", group: "F", color: "#ff6200" },
  { name: "Norway", code: "no", confed: "UEFA", group: "I", color: "#ba0c2f" },
  { name: "Portugal", code: "pt", confed: "UEFA", group: "K", color: "#006600" },
  { name: "Scotland", code: "gb-sct", confed: "UEFA", group: "C", color: "#0065bf" },
  { name: "Spain", code: "es", confed: "UEFA", group: "H", color: "#c60b1e" },
  { name: "Sweden", code: "se", confed: "UEFA", group: "F", color: "#006aa7" },
  { name: "Switzerland", code: "ch", confed: "UEFA", group: "B", color: "#d52b1e" },
  { name: "Turkey", code: "tr", confed: "UEFA", group: "D", color: "#e30a17" },
];

export const TEAM_BY_NAME: Record<string, Team> = Object.fromEntries(
  TEAMS.map((t) => [t.name, t]),
);

import { asset } from "../lib/asset";

export const flagUrl = (code: string) => asset(`flags/4x3/${code}.svg`);
