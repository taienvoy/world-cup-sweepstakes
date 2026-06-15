import { motion } from "framer-motion";
import type { Person } from "../data/people";
import { TEAM_BY_NAME, type Team } from "../data/teams";
import type { Result, TeamRecord } from "../lib/fixtures";
import type { Standing } from "../lib/scoring";
import Flag from "./Flag";

const MEDAL = ["🥇", "🥈", "🥉"];

const RESULT_STYLE: Record<Result, string> = {
  W: "bg-emerald-500/85 text-emerald-50",
  D: "bg-white/20 text-white/75",
  L: "bg-rose-500/85 text-rose-50",
};

function FormPills({ record }: { record?: TeamRecord }) {
  if (!record || record.results.length === 0) {
    return <span className="text-[10px] text-white/25">—</span>;
  }
  return (
    <span
      className="flex items-center gap-0.5"
      title={`${record.w}W ${record.d}D ${record.l}L · ${record.gf}-${record.ga} · ${record.pts} pts`}
    >
      {record.results.map((r, i) => (
        <span
          key={i}
          className={`grid h-3.5 w-3.5 place-items-center rounded-[3px] text-[9px] font-bold ${RESULT_STYLE[r]}`}
        >
          {r}
        </span>
      ))}
    </span>
  );
}

export default function PersonCard({
  person,
  teams,
  index,
  records,
  standing,
}: {
  person: Person;
  teams: Team[];
  index: number;
  records: Map<string, TeamRecord>;
  standing?: Standing;
}) {
  const lite = person.slots <= 2;
  const pts = standing?.total ?? 0;
  const extra = (standing?.bonus ?? 0) + (standing?.predictionPoints ?? 0);
  const predictions = standing?.predictions ?? [];
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

      {/* points badge: match points + bonuses + predictions */}
      <div
        className="mt-2 flex items-baseline gap-1.5 rounded-full bg-gold/15 px-3 py-1"
        title={
          standing
            ? `${standing.matchPoints} from games + ${standing.bonus} bonuses + ${standing.predictionPoints} predictions`
            : undefined
        }
      >
        <span className="font-display text-lg leading-none text-gold">{pts}</span>
        <span className="text-[11px] font-medium text-gold/70">pts</span>
        {standing && extra > 0 && (
          <span className="text-[10px] text-white/40">
            · {standing.matchPoints}+{extra}
          </span>
        )}
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
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.name}</span>
              {pinned && <span className="text-[11px]" title="Guaranteed pick">⭐</span>}
              <FormPills record={records.get(t.name)} />
              <span className="w-3 text-right font-mono text-[10px] text-white/40">{t.group}</span>
            </li>
          );
        })}
      </ul>

      {/* podium predictions */}
      {predictions.length > 0 && (
        <div className="mt-3 w-full border-t border-white/10 pt-3">
          <div className="eyebrow mb-1.5 text-white/35">Podium picks</div>
          <div className="flex items-center gap-2">
            {predictions.map((h) => {
              const team = TEAM_BY_NAME[h.team];
              const hit = h.actual > 0;
              return (
                <div
                  key={h.team}
                  title={
                    hit
                      ? `${MEDAL[h.predicted - 1]} ${h.team} — finished #${h.actual} (+${h.points})`
                      : `${MEDAL[h.predicted - 1]} ${h.team}`
                  }
                  className={`flex items-center gap-1 rounded-lg px-1.5 py-1 ${
                    hit ? "bg-gold/15 ring-1 ring-gold/50" : "bg-white/5"
                  }`}
                >
                  <span className="text-xs leading-none">{MEDAL[h.predicted - 1]}</span>
                  {team ? (
                    <Flag code={team.code} title={h.team} className="h-4 w-6 rounded-[2px] shadow" />
                  ) : (
                    <span className="text-[10px] text-white/60">{h.team}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
