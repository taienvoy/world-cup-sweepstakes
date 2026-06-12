import type { Person } from "../data/people";

/** Small circular portrait of the person who drew a team. Renders nothing for
 *  unowned sides (knockout placeholders). */
export default function OwnerAvatar({
  person,
  size = 20,
  showName = false,
}: {
  person?: Person | null;
  size?: number;
  showName?: boolean;
}) {
  if (!person) return null;
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <img
        src={person.photo}
        alt={person.name}
        title={`${person.name}'s team`}
        style={{ height: size, width: size }}
        className="rounded-full object-cover ring-2 ring-gold/60"
        draggable={false}
      />
      {showName && <span className="text-xs font-medium text-gold">{person.name}</span>}
    </span>
  );
}
