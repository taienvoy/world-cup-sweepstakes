import { DateTime } from "luxon";
import type { Match, Side } from "../lib/fixtures";
import { countdown, localDay, localTime, venueTime } from "../lib/format";
import Flag from "./Flag";

function SideRow({ side, align }: { side: Side; align: "left" | "right" }) {
  return (
    <div
      className={`flex items-center gap-2.5 ${align === "right" ? "flex-row-reverse text-right" : ""}`}
    >
      {side.team ? (
        <Flag code={side.team.code} title={side.team.name} className="h-7 w-10 rounded shadow-md" />
      ) : (
        <div className="grid h-7 w-10 place-items-center rounded bg-white/10 text-white/40">?</div>
      )}
      <span className="text-sm font-semibold leading-tight">{side.label}</span>
    </div>
  );
}

export default function MatchCard({ match, now }: { match: Match; now: DateTime }) {
  const live = match.kickoff <= now && now < match.kickoff.plus({ hours: 2 });
  const cd = countdown(match.kickoff, now);

  return (
    <div className="glass relative flex min-w-[280px] flex-col gap-3 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-white/45">
          {match.isKnockout ? match.round : `Group ${match.group?.replace("Group ", "")}`}
        </span>
        {live ? (
          <span className="flex items-center gap-1.5 rounded-full bg-magenta/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-magenta">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-magenta" /> Live
          </span>
        ) : (
          <span className="font-mono text-[11px] text-gold">{cd}</span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <SideRow side={match.side1} align="left" />
        <span className="font-display text-white/30">vs</span>
        <SideRow side={match.side2} align="right" />
      </div>

      <div className="flex items-center justify-between border-t border-white/8 pt-2.5 text-[11px] text-white/55">
        <span className="font-medium">
          {localDay(match.kickoff)} · <span className="text-white/90">{localTime(match.kickoff)}</span>
        </span>
        <span className="font-mono text-white/40">{venueTime(match.kickoff, match.venueOffset)}</span>
      </div>
      {match.ground && (
        <div className="-mt-1.5 text-[11px] text-white/40">📍 {match.ground}</div>
      )}
    </div>
  );
}
