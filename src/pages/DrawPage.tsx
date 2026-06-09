import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { DrawResult } from "../lib/draw";
import { DEFAULT_SEED } from "../lib/draw";
import { TEAMS, type Team } from "../data/teams";
import { PEOPLE } from "../data/people";
import GlobeScene from "../components/globe/GlobeScene";
import Flag from "../components/Flag";

const FLIGHT_MS = 720;
const GAP_MS = 180;

type Phase = "idle" | "running" | "done";

export default function DrawPage({
  draw,
  seed,
  onReroll,
  onReset,
  isOfficial,
}: {
  draw: DrawResult;
  seed: number;
  onReroll: (seed: number) => void;
  onReset: () => void;
  isOfficial: boolean;
}) {
  const seq = draw.sequence;
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0); // completed picks
  const [flying, setFlying] = useState<{
    team: Team;
    sx: number;
    sy: number;
    ex: number;
    ey: number;
  } | null>(null);

  const globeRef = useRef<HTMLDivElement>(null);
  const portraitRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Reset when the underlying draw (seed) changes.
  useEffect(() => {
    setPhase("idle");
    setStep(0);
    setFlying(null);
  }, [seed]);

  // teams still orbiting the globe
  const consumed = step + (flying ? 1 : 0);
  const drawnNames = useMemo(
    () => new Set(seq.slice(0, consumed).map((p) => p.team.name)),
    [seq, consumed],
  );
  const remaining = useMemo(() => TEAMS.filter((t) => !drawnNames.has(t.name)), [drawnNames]);

  // per-person assigned-so-far (drives the docked flags under each portrait)
  const assigned = useMemo(() => {
    const map: Record<string, Team[]> = Object.fromEntries(PEOPLE.map((p) => [p.id, []]));
    seq.slice(0, step).forEach((p) => map[p.person.id].push(p.team));
    return map;
  }, [seq, step]);

  const current = phase === "running" && step < seq.length ? seq[step] : null;
  const receivingId = flying ? current?.person.id : null;

  // Drive the sequence.
  useEffect(() => {
    if (phase !== "running") return;
    if (step >= seq.length) {
      setPhase("done");
      return;
    }
    const pick = seq[step];
    const startT = setTimeout(() => {
      const g = globeRef.current?.getBoundingClientRect();
      const t = portraitRefs.current[pick.person.id]?.getBoundingClientRect();
      if (g && t) {
        setFlying({
          team: pick.team,
          sx: g.left + g.width / 2,
          sy: g.top + g.height / 2,
          ex: t.left + t.width / 2,
          ey: t.top + t.height / 2,
        });
      }
    }, GAP_MS);

    const doneT = setTimeout(() => {
      setStep((s) => s + 1);
      setFlying(null);
    }, GAP_MS + FLIGHT_MS);

    return () => {
      clearTimeout(startT);
      clearTimeout(doneT);
    };
  }, [phase, step, seq]);

  const start = () => {
    if (step >= seq.length) {
      setStep(0);
    }
    setPhase("running");
  };
  const skip = useCallback(() => {
    setFlying(null);
    setStep(seq.length);
    setPhase("done");
  }, [seq.length]);

  const boost = phase === "running" ? 1 : 0;
  const progress = Math.round((step / seq.length) * 100);

  return (
    <main className="relative mx-auto max-w-[1500px] px-4 pb-10 sm:px-8">
      {/* Header / controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div>
          <span className="eyebrow text-gold">The Ceremony</span>
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl">THE DRAW</h1>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
              isOfficial ? "bg-gold/15 text-gold" : "bg-magenta/15 text-magenta"
            }`}
          >
            {isOfficial ? "★ Official Draw" : "Practice Re-roll"}
          </span>
          <div className="font-mono text-sm text-white/70">
            {step}
            <span className="text-white/30"> / {seq.length}</span>
          </div>
        </div>
      </div>

      {/* progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-gold via-magenta to-cyan"
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeOut", duration: 0.4 }}
        />
      </div>

      {/* Stage: portrait ring + globe */}
      <div className="relative mx-auto mt-3 aspect-square w-[min(92vw,60vh,780px)]">
        {/* globe */}
        <div
          ref={globeRef}
          className="absolute left-1/2 top-1/2 h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2"
        >
          <GlobeScene remaining={remaining} boost={boost} />
        </div>

        {/* portrait ring */}
        {PEOPLE.map((p, i) => {
          const angle = -Math.PI / 2 + (i / PEOPLE.length) * Math.PI * 2;
          const rx = 48;
          const ry = 43;
          const left = 50 + Math.cos(angle) * rx;
          const top = 50 + Math.sin(angle) * ry;
          const isReceiving = receivingId === p.id;
          const mine = assigned[p.id];
          return (
            <div
              key={p.id}
              className="absolute flex w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              <div
                ref={(el) => {
                  portraitRefs.current[p.id] = el;
                }}
                className="relative"
                style={{
                  filter: isReceiving
                    ? "drop-shadow(0 0 14px var(--color-gold))"
                    : undefined,
                }}
              >
                <div
                  className="absolute -inset-[3px] rounded-full opacity-80"
                  style={{
                    background:
                      "conic-gradient(from 0deg, var(--color-gold), var(--color-magenta), var(--color-cyan), var(--color-gold))",
                    animation: isReceiving ? "spin-slow 2s linear infinite" : undefined,
                  }}
                />
                <img
                  src={p.photo}
                  alt={p.name}
                  className="relative h-14 w-14 rounded-full border-2 border-pitch-900 object-cover sm:h-[58px] sm:w-[58px]"
                  draggable={false}
                />
              </div>
              <span className="mt-1 text-xs font-semibold">{p.name}</span>
              {/* docked flags */}
              <div className="mt-1 flex max-w-[112px] flex-wrap justify-center gap-1">
                <AnimatePresence>
                  {mine.map((t) => (
                    <motion.div
                      key={t.name}
                      initial={{ scale: 0, rotate: -25 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 380, damping: 18 }}
                    >
                      <Flag
                        code={t.code}
                        title={t.name}
                        className="h-3.5 w-5 rounded-[2px] shadow ring-1 ring-white/20"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}

      </div>

      {/* Current pick banner */}
      <div className="mt-2 flex h-16 items-center justify-center">
        <AnimatePresence mode="wait">
          {current && flying ? (
            <motion.div
              key={current.order}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="glass flex items-center gap-3 rounded-full px-5 py-2.5"
            >
              <Flag code={current.team.code} className="h-6 w-9 rounded shadow" />
              <span className="font-semibold">
                <span className="text-gold">{current.person.name}</span> drew{" "}
                <span className="text-white">{current.team.name}</span>
              </span>
              {current.pinned && <span title="Guaranteed pick">⭐</span>}
            </motion.div>
          ) : phase === "idle" && step === 0 ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-white/55"
            >
              {remaining.length} nations orbiting · press start to draw
            </motion.p>
          ) : phase === "done" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="font-display text-2xl tracking-wide text-gold"
            >
              🏆 THE DRAW IS COMPLETE
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        {phase !== "running" && (
          <button
            onClick={start}
            className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-7 py-3 font-semibold text-pitch-950 shadow-lg shadow-gold/25 transition-transform hover:scale-[1.03]"
          >
            {phase === "done" ? "↻ Replay Draw" : step > 0 ? "Resume" : "▶ Start the Draw"}
          </button>
        )}
        {phase === "running" && (
          <>
            <button
              onClick={() => setPhase("idle")}
              className="glass rounded-full px-6 py-3 font-medium transition-colors hover:bg-white/10"
            >
              ❚❚ Pause
            </button>
            <button
              onClick={skip}
              className="glass rounded-full px-6 py-3 font-medium transition-colors hover:bg-white/10"
            >
              Skip ⏭
            </button>
          </>
        )}
        {phase === "done" && (
          <Link
            to="/"
            className="glass rounded-full px-6 py-3 font-medium transition-colors hover:bg-white/10"
          >
            View Dashboard →
          </Link>
        )}

        {/* admin re-roll */}
        <div className="ml-2 flex items-center gap-2">
          <button
            onClick={() => onReroll(Math.floor(Math.random() * 1_000_000_000))}
            className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/55 transition-colors hover:text-white"
            title="Practice re-roll (does not change the official result)"
          >
            ⚙ Re-roll
          </button>
          {!isOfficial && (
            <button
              onClick={onReset}
              className="rounded-full border border-gold/30 px-4 py-2 text-xs text-gold transition-colors hover:bg-gold/10"
            >
              Restore official
            </button>
          )}
        </div>
      </div>

      {/* Flying flag overlay */}
      <AnimatePresence>
        {flying && (
          <motion.div
            key={`${flying.team.name}-${step}`}
            className="pointer-events-none fixed z-50"
            style={{ left: 0, top: 0 }}
            initial={{ x: flying.sx - 34, y: flying.sy - 26, scale: 0.4, opacity: 0 }}
            animate={{
              x: [flying.sx - 34, (flying.sx + flying.ex) / 2 - 34, flying.ex - 22],
              y: [flying.sy - 26, Math.min(flying.sy, flying.ey) - 110, flying.ey - 16],
              scale: [0.4, 1.5, 0.5],
              opacity: [0, 1, 1],
            }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: FLIGHT_MS / 1000, ease: [0.3, 0.7, 0.3, 1] }}
          >
            <div className="relative">
              <div className="absolute -inset-2 rounded-lg bg-gold/30 blur-md" />
              <Flag
                code={flying.team.code}
                className="relative h-11 w-16 rounded-md shadow-2xl ring-2 ring-white/40"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
