import { motion } from "framer-motion";
import type { Person } from "../data/people";
import type { Team } from "../data/teams";
import Flag from "./Flag";

export default function PersonCard({
  person,
  teams,
  index,
}: {
  person: Person;
  teams: Team[];
  index: number;
}) {
  const lite = person.slots <= 2;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
      className="glass group relative flex flex-col items-center rounded-3xl p-5 pt-12"
    >
      {/* portrait */}
      <div className="absolute -top-9">
        <div className="relative">
          <div
            className="absolute -inset-1 rounded-full opacity-70 blur-[6px] transition-opacity group-hover:opacity-100"
            style={{ background: "conic-gradient(from 0deg, var(--color-gold), var(--color-magenta), var(--color-cyan), var(--color-gold))" }}
          />
          <img
            src={person.photo}
            alt={person.name}
            className="relative h-[72px] w-[72px] rounded-full border-2 border-pitch-900 object-cover"
            draggable={false}
          />
        </div>
      </div>

      <div className="mt-1 flex items-center gap-2">
        <h3 className="font-display text-xl tracking-wide">{person.name}</h3>
        {lite && (
          <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
            {person.slots} only
          </span>
        )}
      </div>
      <div className="eyebrow mt-0.5 text-white/40">
        {teams.length} {teams.length === 1 ? "team" : "teams"}
      </div>

      <ul className="mt-4 flex w-full flex-col gap-2">
        {teams.map((t) => {
          const pinned = person.id === "quentin" && t.name === "Brazil";
          return (
            <li
              key={t.name}
              className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/5 transition-colors hover:bg-white/10"
              style={pinned ? { boxShadow: `inset 0 0 0 1px ${t.color}` } : undefined}
            >
              <Flag code={t.code} title={t.name} className="h-5 w-7 rounded-[3px] shadow" />
              <span className="flex-1 truncate text-sm font-medium">{t.name}</span>
              {pinned && <span className="text-[11px]" title="Guaranteed pick">⭐</span>}
              <span className="font-mono text-[10px] text-white/40">{t.group}</span>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
