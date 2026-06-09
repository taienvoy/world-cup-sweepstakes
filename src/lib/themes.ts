// Theme metadata for the picker. The actual color values live in index.css under
// `html[data-theme="..."]` (Tailwind v4 tokens are CSS variables, so overriding them
// there re-skins every utility). Aurora is the :root default (no data-theme needed).

export interface ThemeDef {
  id: string;
  name: string;
  blurb: string;
  swatches: [string, string, string]; // preview dots: primary, secondary, surface
}

export const THEMES: ThemeDef[] = [
  { id: "aurora", name: "Aurora", blurb: "Original gold & neon", swatches: ["#ffd24a", "#ff2d7e", "#070b18"] },
  { id: "envoy", name: "Envoy", blurb: "Brand red & indigo", swatches: ["#fa4338", "#5b4fe3", "#120f30"] },
  { id: "pitch", name: "Pitch", blurb: "Grass green & lime", swatches: ["#c6ff4a", "#2ee6a6", "#06190f"] },
  { id: "sunset", name: "Sunset", blurb: "Amber & rose", swatches: ["#ffb24a", "#ff4d6d", "#1d0a24"] },
];

export const DEFAULT_THEME = "aurora";
