import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { DEFAULT_SEED, runDraw } from "./lib/draw";
import { loadFixturesSync, refreshFixtures, type Match } from "./lib/fixtures";
import Background from "./components/Background";
import Nav from "./components/Nav";
import Dashboard from "./pages/Dashboard";
import Scoring from "./pages/Scoring";

// The Draw page pulls in Three.js — load it on demand so the Dashboard stays light.
const DrawPage = lazy(() => import("./pages/DrawPage"));

const SEED_KEY = "wc2026-seed";

export default function App() {
  const [seed, setSeed] = useState<number>(() => {
    const saved = localStorage.getItem(SEED_KEY);
    return saved ? Number(saved) : DEFAULT_SEED;
  });

  const draw = useMemo(() => runDraw(seed), [seed]);

  const [fixtures, setFixtures] = useState<Match[]>(() => loadFixturesSync());
  useEffect(() => {
    let alive = true;
    const pull = () => refreshFixtures().then((f) => alive && setFixtures(f));
    pull();
    // Re-fetch scores/results periodically so the board updates without a reload.
    const id = setInterval(pull, 120_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

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
      <Nav />
      <Routes>
        <Route path="/" element={<Dashboard draw={draw} fixtures={fixtures} />} />
        <Route path="/leaderboard" element={<Scoring draw={draw} />} />
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
