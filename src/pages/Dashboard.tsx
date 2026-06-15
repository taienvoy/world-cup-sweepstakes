import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { DrawResult } from "../lib/draw";
import { matchWindow, focusMatch, matchStatus, teamRecords, type Match } from "../lib/fixtures";
import { computeStandings, type ScoringState, type Standing } from "../lib/scoring";
import { PEOPLE, type Person } from "../data/people";
import { useNow } from "../hooks/useNow";
import { asset } from "../lib/asset";
import { countdown, localStamp, localTzAbbrev, localZone } from "../lib/format";
import PersonCard from "../components/PersonCard";
import MatchCard from "../components/MatchCard";
import OwnerAvatar from "../components/OwnerAvatar";
import Flag from "../components/Flag";

export default function Dashboard({
  draw,
  fixtures,
  scoring,
}: {
  draw: DrawResult;
  fixtures: Match[];
  scoring: ScoringState;
}) {
  const now = useNow();
  const window = useMemo(() => matchWindow(fixtures, now), [fixtures, now]);
  const focus = useMemo(() => focusMatch(fixtures, now), [fixtures, now]);
  const focusState = focus ? matchStatus(focus, now) : null;
  const fft = focus?.score?.ft;

  // team name -> the person who drew it (for the "whose team is playing" avatars)
  const owners = useMemo(() => {
    const m = new Map<string, Person>();
    for (const p of PEOPLE) for (const t of draw.byPerson[p.id] ?? []) m.set(t.name, p);
    return m;
  }, [draw]);
  const owner1 = focus?.side1.team ? owners.get(focus.side1.team.name) : undefined;
  const owner2 = focus?.side2.team ? owners.get(focus.side2.team.name) : undefined;

  // each team's W/D/L form, recomputed as results come in
  const records = useMemo(() => teamRecords(fixtures, now), [fixtures, now]);

  // per-person standings (match points + bonuses) for the squad badge
  const standingByPerson = useMemo(() => {
    const m = new Map<string, Standing>();
    for (const s of computeStandings(scoring, draw, records).table) m.set(s.person.id, s);
    return m;
  }, [scoring, draw, records]);

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
            {focus ? (
              <>
                {focusState === "live" ? (
                  <span className="flex items-center gap-2 text-magenta">
                    <span className="h-2 w-2 animate-ping rounded-full bg-magenta" />
                    <span className="eyebrow">Live now</span>
                  </span>
                ) : focusState === "finished" ? (
                  <span className="eyebrow text-white/55">Latest result</span>
                ) : (
                  <span className="eyebrow text-cyan">Kick-off in</span>
                )}

                {focusState === "upcoming" ? (
                  <div className="mt-2 font-display text-5xl tracking-wide text-white sm:text-6xl">
                    {countdown(focus.kickoff, now)}
                  </div>
                ) : (
                  // Live or finished: show the scoreline big
                  <div className="mt-3 flex items-center gap-4">
                    {focus.side1.team && (
                      <span className="flex items-center gap-2">
                        <OwnerAvatar person={owner1} size={28} />
                        <Flag code={focus.side1.team.code} className="h-9 w-14 rounded shadow" />
                      </span>
                    )}
                    <div className="font-display text-5xl tracking-wide text-white sm:text-6xl">
                      {fft ? `${fft[0]}–${fft[1]}` : focusState === "live" ? "vs" : "–"}
                    </div>
                    {focus.side2.team && (
                      <span className="flex items-center gap-2">
                        <OwnerAvatar person={owner2} size={28} />
                        <Flag code={focus.side2.team.code} className="h-9 w-14 rounded shadow" />
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3">
                  {focusState === "upcoming" && focus.side1.team && (
                    <span className="flex items-center gap-2">
                      <OwnerAvatar person={owner1} size={26} />
                      <Flag code={focus.side1.team.code} className="h-8 w-12 rounded shadow" />
                    </span>
                  )}
                  <span className="font-semibold">
                    {focus.side1.label} <span className="text-white/40">vs</span> {focus.side2.label}
                  </span>
                  {focusState === "upcoming" && focus.side2.team && (
                    <span className="flex items-center gap-2">
                      <OwnerAvatar person={owner2} size={26} />
                      <Flag code={focus.side2.team.code} className="h-8 w-12 rounded shadow" />
                    </span>
                  )}
                </div>

                {/* whose teams are these */}
                {(owner1 || owner2) && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-white/55">
                      {owner1 ? (
                        <>
                          <span className="text-gold">{owner1.name}</span>'s {focus.side1.label}
                        </>
                      ) : (
                        focus.side1.label
                      )}
                    </span>
                    <span className="text-white/30">vs</span>
                    <span className="text-white/55">
                      {owner2 ? (
                        <>
                          <span className="text-gold">{owner2.name}</span>'s {focus.side2.label}
                        </>
                      ) : (
                        focus.side2.label
                      )}
                    </span>
                  </div>
                )}
                <div className="mt-2 text-sm text-white/55">
                  {localStamp(focus.kickoff)} {localTzAbbrev(focus.kickoff)} · {focus.ground}
                </div>
              </>
            ) : (
              <div className="mt-2 text-white/60">Schedule loading…</div>
            )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* MATCH TRACKER — recent results · live · upcoming (auto-advances) */}
      <section className="mt-6">
        <SectionHeading kicker="Live schedule" title="Results & Fixtures" />
        <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8">
          {window.map((m, i) => (
            <div key={`${m.kickoff.toMillis()}-${i}`} className="snap-start">
              <MatchCard match={m} now={now} owners={owners} />
            </div>
          ))}
        </div>
      </section>

      {/* THE SQUAD */}
      <section className="mt-12">
        <SectionHeading kicker="Who drew what" title="The Squad" />
        <div className="mt-10 grid grid-cols-1 gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PEOPLE.map((p, i) => (
            <PersonCard
              key={p.id}
              person={p}
              teams={draw.byPerson[p.id]}
              index={i}
              records={records}
              standing={standingByPerson.get(p.id)}
            />
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
