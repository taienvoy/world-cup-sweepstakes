import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DateTime } from "luxon";
import type { DrawResult } from "../lib/draw";
import { teamRecords, type Match } from "../lib/fixtures";
import { useNow } from "../hooks/useNow";
import {
  BONUSES,
  POT_TOTAL,
  SAMPLE_STATE,
  EMPTY_STATE,
  computeStandings,
  loadScoring,
  type ScoringState,
  type ResolvedBonus,
  type Standing,
} from "../lib/scoring";
import Flag from "../components/Flag";

export default function Scoring({ draw, fixtures }: { draw: DrawResult; fixtures: Match[] }) {
  const now = useNow(30_000);
  const [live, setLive] = useState<ScoringState>(EMPTY_STATE);
  const [sample, setSample] = useState(false);

  // Poll the poller-written scoring.json every 60s.
  useEffect(() => {
    let alive = true;
    const tick = () => loadScoring().then((s) => alive && setLive(s));
    tick();
    const id = setInterval(tick, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const state = sample ? SAMPLE_STATE : live;
  const records = useMemo(() => teamRecords(fixtures, now), [fixtures, now]);
  const { bonuses, table, potClaimed } = useMemo(
    () => computeStandings(state, draw, records),
    [state, draw, records],
  );

  const updated = state.updatedAt ? DateTime.fromISO(state.updatedAt) : null;
  const isLive = !sample && state.matchesPlayed > 0;

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
      {/* header */}
      <section className="flex flex-wrap items-end justify-between gap-4 py-8">
        <div>
          <span className="eyebrow text-gold">In-house points · live</span>
          <h1 className="font-display text-5xl tracking-tight sm:text-6xl">THE LEADERBOARD</h1>
          <p className="mt-2 max-w-xl text-white/60">
            <span className="text-white/80">3 pts</span> per win,{" "}
            <span className="text-white/80">1 pt</span> per draw across all your teams — plus a{" "}
            {POT_TOTAL}-point bonus pot from five twists. Every match counts.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
              sample
                ? "bg-violet/20 text-violet"
                : isLive
                  ? "bg-magenta/20 text-magenta"
                  : "bg-white/10 text-white/55"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isLive ? "animate-ping bg-magenta" : sample ? "bg-violet" : "bg-white/50"
              }`}
            />
            {sample ? "Sample preview" : isLive ? "Live" : "Awaiting kickoff"}
          </span>
          <button
            onClick={() => setSample((s) => !s)}
            className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/60 transition-colors hover:text-white"
          >
            {sample ? "Show live board" : "👁 Preview sample outcomes"}
          </button>
        </div>
      </section>

      {/* pot meter */}
      <div className="glass rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="eyebrow text-cyan">Prize pool</span>
            <div className="font-display text-3xl">
              {potClaimed}
              <span className="text-white/35"> / {POT_TOTAL} claimed</span>
            </div>
          </div>
          <div className="text-right text-xs text-white/50">
            <div>
              {state.matchesPlayed} matches played · source {state.source}
            </div>
            <div>
              {sample
                ? "illustrative sample — not real results"
                : updated
                  ? `updated ${updated.toRelative()}`
                  : "no results yet — board updates automatically"}
            </div>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-gold via-magenta to-cyan"
            animate={{ width: `${(potClaimed / POT_TOTAL) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* bonus board */}
      <section className="mt-8">
        <h2 className="eyebrow mb-3 text-white/45">Ways to win bonus points</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {bonuses.map((b) => (
            <BonusCard key={b.key} bonus={b} />
          ))}
        </div>
      </section>

      {/* leaderboard */}
      <section className="mt-10">
        <h2 className="eyebrow mb-3 text-white/45">Standings</h2>
        <div className="flex flex-col gap-2">
          {table.map((row, i) => (
            <LeaderRow key={row.person.id} row={row} rank={i + 1} bonuses={bonuses} />
          ))}
        </div>
      </section>
    </main>
  );
}

function BonusCard({ bonus }: { bonus: ResolvedBonus }) {
  return (
    <div
      className={`glass relative flex flex-col gap-2 rounded-2xl p-4 transition-all ${
        bonus.decided ? "ring-1 ring-gold/40" : "opacity-90"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{bonus.icon}</span>
        <span className="font-display text-xl text-gold">{bonus.points}</span>
      </div>
      <div className="text-sm font-semibold leading-tight">{bonus.label}</div>

      {bonus.decided && bonus.team ? (
        <div className="mt-1 flex items-center gap-2 rounded-lg bg-white/5 p-2">
          <Flag code={bonus.team.code} title={bonus.team.name} className="h-5 w-7 rounded shadow" />
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold">{bonus.team.name}</div>
            {bonus.owner ? (
              <div className="flex items-center gap-1">
                <img src={bonus.owner.photo} alt="" className="h-3.5 w-3.5 rounded-full" />
                <span className="truncate text-[11px] text-gold">{bonus.owner.name}</span>
              </div>
            ) : (
              <span className="text-[11px] text-white/40">unowned</span>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-1 rounded-lg border border-dashed border-white/15 p-2 text-center text-[11px] text-white/40">
          To be decided
        </div>
      )}
      {bonus.detail && <div className="text-[10px] text-white/40">{bonus.detail}</div>}
    </div>
  );
}

function LeaderRow({
  row,
  rank,
  bonuses,
}: {
  row: Standing;
  rank: number;
  bonuses: ResolvedBonus[];
}) {
  const leader = rank === 1 && row.total > 0;
  const held = bonuses.filter((b) => b.owner?.id === row.person.id);
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className={`glass flex items-center gap-3 rounded-2xl p-3 ${
        leader ? "ring-1 ring-gold/50" : ""
      }`}
    >
      <div
        className={`w-7 text-center font-display text-lg ${
          leader ? "text-gold" : "text-white/40"
        }`}
      >
        {leader ? "👑" : rank}
      </div>
      <img
        src={row.person.photo}
        alt={row.person.name}
        className="h-11 w-11 rounded-full border border-white/15 object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{row.person.name}</span>
          <span className="text-[11px] text-white/35">{row.teamCount} teams</span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1">
          <span className="text-[11px] text-white/45">{row.played} played</span>
          {held.map((b) => (
            <span
              key={b.key}
              title={`${b.label} (+${b.points})`}
              className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-medium text-gold"
            >
              {b.icon} {b.short}
            </span>
          ))}
        </div>
      </div>
      <div className="text-right">
        <div className="font-display text-3xl leading-none">{row.total}</div>
        <div className="mt-0.5 text-[11px] text-white/45">
          <span className="text-cyan">{row.matchPoints}</span> games
          {row.bonus > 0 && (
            <>
              {" · "}
              <span className="text-gold">{row.bonus}</span> bonus
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
