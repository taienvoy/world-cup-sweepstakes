import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { DrawResult } from "../lib/draw";
import { upcoming, type Match } from "../lib/fixtures";
import { PEOPLE } from "../data/people";
import { useNow } from "../hooks/useNow";
import { asset } from "../lib/asset";
import { countdown, localStamp, localTzAbbrev, localZone } from "../lib/format";
import PersonCard from "../components/PersonCard";
import MatchCard from "../components/MatchCard";
import Flag from "../components/Flag";

export default function Dashboard({
  draw,
  fixtures,
}: {
  draw: DrawResult;
  fixtures: Match[];
}) {
  const now = useNow();
  const next = useMemo(() => upcoming(fixtures, now, 14), [fixtures, now]);
  const opener = fixtures[0];

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
      {/* HERO */}
      <section className="relative grid items-center gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="eyebrow text-gold">United 26 · Canada · Mexico · USA</span>
            <h1 className="mt-3 font-display text-5xl leading-[0.9] tracking-tight sm:text-6xl xl:text-7xl">
              THE ENVOY LONDON
              <br />
              <span className="bg-gradient-to-r from-gold via-magenta to-cyan bg-clip-text text-transparent">
                OFFICE SWEEPSTAKES
              </span>
            </h1>
            <p className="mt-5 max-w-md text-white/65">
              48 nations. 13 of us. One trophy. Every team was drawn live and locked —
              follow your countries all the way to the final at MetLife.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/draw"
                className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-6 py-3 font-semibold text-pitch-950 shadow-lg shadow-gold/25 transition-transform hover:scale-[1.03]"
              >
                ▶ Watch the Draw
              </Link>
              <span className="text-xs text-white/45">
                Times shown in <span className="text-white/80">{localZone}</span>
              </span>
            </div>
          </motion.div>
        </div>

        {/* Countdown to opener with the hemisphere earth + Team Envoy kit */}
        <div className="relative">
          <motion.img
            src={asset("jersey.png")}
            alt="Team Envoy 01 jersey"
            initial={{ opacity: 0, y: -12, rotate: 7 }}
            animate={{ opacity: 1, y: [0, -8, 0], rotate: 7 }}
            transition={{
              opacity: { duration: 0.7, delay: 0.3 },
              y: { repeat: Infinity, duration: 4.5, ease: "easeInOut" },
            }}
            className="pointer-events-none absolute -top-10 right-4 z-20 w-24 drop-shadow-2xl sm:w-28"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
            className="glass relative overflow-hidden rounded-3xl p-7"
          >
          <img
            src={asset("textures/earth_hemisphere.png")}
            alt=""
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 opacity-30 [animation:spin-slow_120s_linear_infinite]"
          />
          <div className="relative">
            <span className="eyebrow text-cyan">Kick-off in</span>
            {opener ? (
              <>
                <div className="mt-2 font-display text-5xl tracking-wide text-white sm:text-6xl">
                  {countdown(opener.kickoff, now)}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  {opener.side1.team && (
                    <Flag code={opener.side1.team.code} className="h-8 w-12 rounded shadow" />
                  )}
                  <span className="font-semibold">
                    {opener.side1.label} <span className="text-white/40">vs</span>{" "}
                    {opener.side2.label}
                  </span>
                  {opener.side2.team && (
                    <Flag code={opener.side2.team.code} className="h-8 w-12 rounded shadow" />
                  )}
                </div>
                <div className="mt-2 text-sm text-white/55">
                  {localStamp(opener.kickoff)} {localTzAbbrev(opener.kickoff)} · {opener.ground}
                </div>
              </>
            ) : (
              <div className="mt-2 text-white/60">Schedule loading…</div>
            )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* UPCOMING MATCHES */}
      <section className="mt-6">
        <SectionHeading kicker="Live schedule" title="Upcoming Matches" />
        <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8">
          {next.map((m, i) => (
            <div key={i} className="snap-start">
              <MatchCard match={m} now={now} />
            </div>
          ))}
        </div>
      </section>

      {/* THE SQUAD */}
      <section className="mt-12">
        <SectionHeading kicker="Who drew what" title="The Squad" />
        <div className="mt-10 grid grid-cols-1 gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PEOPLE.map((p, i) => (
            <PersonCard key={p.id} person={p} teams={draw.byPerson[p.id]} index={i} />
          ))}
        </div>
      </section>
    </main>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="flex items-end justify-between border-b border-white/10 pb-3">
      <div>
        <span className="eyebrow text-gold/70">{kicker}</span>
        <h2 className="font-display text-3xl tracking-wide sm:text-4xl">{title}</h2>
      </div>
    </div>
  );
}
