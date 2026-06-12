import { DateTime } from "luxon";
import { matchStatus, type Match, type Side } from "../lib/fixtures";
import { countdown, localDay, localTime, venueTime } from "../lib/format";
import type { Person } from "../data/people";
import Flag from "./Flag";
import OwnerAvatar from "./OwnerAvatar";

function SideRow({
  side,
  owner,
  goals,
  dim,
}: {
  side: Side;
  owner?: Person | null;
  goals?: number;
  dim?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <OwnerAvatar person={owner} size={22} />
      {side.team ? (
        <Flag code={side.team.code} title={side.team.name} className="h-7 w-10 rounded shadow-md" />
      ) : (
        <div className="grid h-7 w-10 place-items-center rounded bg-white/10 text-white/40">?</div>
      )}
      <span className={`text-sm font-semibold leading-tight ${dim ? "text-white/45" : ""}`}>
        {side.label}
      </span>
      {goals != null && (
        <span className={`ml-auto font-display text-xl ${dim ? "text-white/40" : "text-white"}`}>
          {goals}
        </span>
      )}
    </div>
  );
}

export default function MatchCard({
  match,
  now,
  owners,
}: {
  match: Match;
  now: DateTime;
  owners: Map<string, Person>;
}) {
  const status = matchStatus(match, now);
  const live = status === "live";
  const finished = status === "finished";
  const ft = match.score?.ft;
  // Highlight the loser as dimmed; both normal on a draw.
  const winner = ft ? (ft[0] > ft[1] ? 1 : ft[1] > ft[0] ? 2 : 0) : 0;

  return (
    <div
      className={`glass relative flex min-w-[280px] flex-col gap-3 rounded-2xl p-4 ${
        live ? "ring-1 ring-magenta/40" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="eyebrow text-white/45">
          {match.isKnockout ? match.round : `Group ${match.group?.replace("Group ", "")}`}
        </span>
        {live ? (
          <span className="flex items-center gap-1.5 rounded-full bg-magenta/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-magenta">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-magenta" /> Live
          </span>
        ) : finished ? (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
            {ft ? "Full time" : "Finished"}
          </span>
        ) : (
          <span className="font-mono text-[11px] text-gold">{countdown(match.kickoff, now)}</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <SideRow
          side={match.side1}
          owner={match.side1.team ? owners.get(match.side1.team.name) : undefined}
          goals={ft ? ft[0] : undefined}
          dim={finished && winner === 2}
        />
        <SideRow
          side={match.side2}
          owner={match.side2.team ? owners.get(match.side2.team.name) : undefined}
          goals={ft ? ft[1] : undefined}
          dim={finished && winner === 1}
        />
        {live && !ft && (
          <div className="text-center text-[11px] font-medium text-magenta">In progress · score to follow</div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/8 pt-2.5 text-[11px] text-white/55">
        <span className="font-medium">
          {localDay(match.kickoff)} · <span className="text-white/90">{localTime(match.kickoff)}</span>
        </span>
        <span className="font-mono text-white/40">{venueTime(match.kickoff, match.venueOffset)}</span>
      </div>
      {match.ground && <div className="-mt-1.5 text-[11px] text-white/40">📍 {match.ground}</div>}
    </div>
  );
}
