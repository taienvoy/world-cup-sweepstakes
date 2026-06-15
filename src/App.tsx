import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { DEFAULT_SEED, runDraw } from "./lib/draw";
import { loadFixturesSync, refreshFixtures, type Match } from "./lib/fixtures";
import { loadScoring, EMPTY_STATE, type ScoringState } from "./lib/scoring";
import Background from "./components/Background";
import Nav from "./components/Nav";
import Kiosk from "./components/Kiosk";
import Dashboard from "./pages/Dashboard";
import Scoring from "./pages/Scoring";

// The Draw page pulls in Three.js — load it on demand so the Dashboard stays light.
const DrawPage = lazy(() => import("./pages/DrawPage"));

const SEED_KEY = "wc2026-seed";
const KIOSK_KEY = "wc2026-kiosk";

// Kiosk can be turned on via ?kiosk (optionally ?kiosk=12 for seconds-per-page),
// or remembered in localStorage so an office screen stays in rotation across reloads.
function readKioskParam(): { on: boolean; secs?: number } {
  const hash = window.location.hash;
  const qi = hash.indexOf("?");
  const params = new URLSearchParams(qi >= 0 ? hash.slice(qi + 1) : "");
  const v = params.get("kiosk");
  const secs = v && /^\d+$/.test(v) ? Math.max(5, parseInt(v, 10)) : undefined;
  const on = params.has("kiosk") || localStorage.getItem(KIOSK_KEY) === "1";
  return { on, secs };
}
const KIOSK_INIT = readKioskParam();

export default function App() {
  const [seed, setSeed] = useState<number>(() => {
    const saved = localStorage.getItem(SEED_KEY);
    return saved ? Number(saved) : DEFAULT_SEED;
  });

  const draw = useMemo(() => runDraw(seed), [seed]);

  const [fixtures, setFixtures] = useState<Match[]>(() => loadFixturesSync());
  const [scoring, setScoring] = useState<ScoringState>(EMPTY_STATE);
  useEffect(() => {
    let alive = true;
    const pull = () => {
      refreshFixtures().then((f) => alive && setFixtures(f));
      loadScoring().then((s) => alive && setScoring(s));
    };
    pull();
    // Re-fetch scores/results periodically so the board updates without a reload.
    const id = setInterval(pull, 120_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const [kiosk, setKioskState] = useState(KIOSK_INIT.on);
  const setKiosk = (on: boolean) => {
    setKioskState(on);
    localStorage.setItem(KIOSK_KEY, on ? "1" : "0");
  };

  const reroll = (next: number) => {
    setSeed(next);
    localStorage.setItem(SEED_KEY, String(next));
  };
  const resetSeed = () => {
    setSeed(DEFAULT_SEED);
    localStorage.removeItem(SEED_KEY);
  };

  return (
    <div className="relative min-h-screen">
      <Background />
      <Nav kiosk={kiosk} onToggleKiosk={() => setKiosk(!kiosk)} />
      <Kiosk active={kiosk} seconds={KIOSK_INIT.secs} onExit={() => setKiosk(false)} />
      <Routes>
        <Route
          path="/"
          element={<Dashboard draw={draw} fixtures={fixtures} scoring={scoring} />}
        />
        <Route
          path="/leaderboard"
          element={<Scoring draw={draw} fixtures={fixtures} scoring={scoring} />}
        />
        <Route
          path="/draw"
          element={
            <Suspense
              fallback={
                <div className="grid h-[60vh] place-items-center text-white/50">
                  Preparing the globe…
                </div>
              }
            >
              <DrawPage
                draw={draw}
                seed={seed}
                onReroll={reroll}
                onReset={resetSeed}
                isOfficial={seed === DEFAULT_SEED}
              />
            </Suspense>
          }
        />
      </Routes>
    </div>
  );
}
